# Déploiement balldontlie — build du front + mise à jour du serveur en une commande.
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
$SshPort     = 22
$SymfonyEnv  = 'prod'
$RunComposer = $false

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
    Write-Host "==> 1/3 Build du front (encore production)..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Le build du front a échoué." }

    Write-Host "==> 2/3 Mise à jour du serveur (git pull + cache:clear)..." -ForegroundColor Cyan
    $steps = @("cd '$RemotePath'", 'git pull origin master')
    if ($RunComposer) { $steps += 'composer install --no-dev --optimize-autoloader' }
    $steps += "php bin/console cache:clear --env=$SymfonyEnv"
    $remoteCmd = $steps -join ' && '

    ssh -p $SshPort $SshTarget $remoteCmd
    if ($LASTEXITCODE -ne 0) { throw "La mise à jour distante (SSH) a échoué." }

    Write-Host "==> 3/3 Envoi du bundle front (scp public/build)..." -ForegroundColor Cyan
    scp -P $SshPort -r 'public/build' "${SshTarget}:$RemotePath/public/"
    if ($LASTEXITCODE -ne 0) { throw "L'envoi du bundle front a échoué." }

    Write-Host ""
    Write-Host "Deploiement termine avec succes." -ForegroundColor Green
}
finally {
    Pop-Location
}
