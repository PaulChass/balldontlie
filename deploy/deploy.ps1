# Déploiement balldontlie — front + serveur PHP + agent IA en une commande.
#
# Usage :
#   pwsh deploy/deploy.ps1
#   (ou, depuis Windows PowerShell, à la racine du projet : .\deploy\deploy.ps1)
#
# Les identifiants de connexion NE SONT PAS dans ce script. Ils vivent dans
# deploy/deploy.config.ps1 (gitignoré), que tu crées à partir de
# deploy/deploy.config.example.ps1. L'authentification passe par ta clé SSH
# (voir deploy/README-deploy.md pour configurer un accès sans mot de passe).

$ErrorActionPreference = 'Stop'

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot   = Split-Path -Parent $scriptDir
$configPath = Join-Path $scriptDir 'deploy.config.ps1'

if (-not (Test-Path $configPath)) {
    Write-Host "Config de déploiement manquante : $configPath" -ForegroundColor Red
    Write-Host "Copie deploy/deploy.config.example.ps1 en deploy/deploy.config.ps1 puis renseigne tes valeurs." -ForegroundColor Yellow
    exit 1
}

# Valeurs par défaut (surchargées par le fichier de config).
$SshPort      = 22
$SymfonyEnv   = 'prod'
$RunComposer  = $false
$DeployAgent  = $true          # rebuild + redémarre le service Node de l'assistant IA
$AgentService = 'nba-agent'    # nom de l'unité systemd (voir deploy/nba-agent.service)

# Charge la config (définit $SshTarget, $RemotePath, et éventuellement les options ci-dessus).
. $configPath

foreach ($name in 'SshTarget', 'RemotePath') {
    $value = Get-Variable -Name $name -ValueOnly -ErrorAction SilentlyContinue
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "Variable `$$name manquante ou vide dans deploy.config.ps1." -ForegroundColor Red
        exit 1
    }
}

Push-Location $repoRoot
try {
    Write-Host "==> 1/4 Build du front (encore production)..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Le build du front a échoué." }

    Write-Host "==> 2/4 Mise à jour du serveur (git pull + cache:clear)..." -ForegroundColor Cyan
    $steps = @("cd '$RemotePath'", 'git pull origin master')
    if ($RunComposer) { $steps += 'composer install --no-dev --optimize-autoloader' }
    $steps += "php bin/console cache:clear --env=$SymfonyEnv"
    $remoteCmd = $steps -join ' && '

    ssh -p $SshPort $SshTarget $remoteCmd
    if ($LASTEXITCODE -ne 0) { throw "La mise à jour distante (SSH) a échoué." }

    Write-Host "==> 3/4 Envoi du bundle front (scp public/build)..." -ForegroundColor Cyan
    scp -P $SshPort -r 'public/build' "${SshTarget}:$RemotePath/public/"
    if ($LASTEXITCODE -ne 0) { throw "L'envoi du bundle front a échoué." }

    if ($DeployAgent) {
        Write-Host "==> 4/4 Rebuild + redémarrage de l'agent IA ($AgentService)..." -ForegroundColor Cyan
        # Script distant : on source nvm (sinon npm est introuvable en SSH non
        # interactif), on rebuild le serveur MCP puis l'agent, et on redémarre le
        # service. set -e : la moindre erreur interrompt et fait échouer le déploiement.
        # `$HOME / `$NVM_DIR sont échappés pour être évalués côté serveur, pas par PowerShell.
        $agentCmd = @"
set -e
export NVM_DIR="`$HOME/.nvm"
[ -s "`$NVM_DIR/nvm.sh" ] && . "`$NVM_DIR/nvm.sh"
command -v npm >/dev/null 2>&1 || { echo "npm introuvable sur le serveur (PATH/nvm)"; exit 1; }
cd '$RemotePath/ai/mcp-server' && npm ci && npm run build
cd '$RemotePath/ai/agent' && npm ci && npm run build
systemctl restart $AgentService
"@
        ssh -p $SshPort $SshTarget $agentCmd
        if ($LASTEXITCODE -ne 0) { throw "Le déploiement de l'agent IA a échoué." }
    }

    Write-Host ""
    Write-Host "Deploiement termine avec succes." -ForegroundColor Green
}
finally {
    Pop-Location
}
