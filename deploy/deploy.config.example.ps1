# Modèle de configuration de déploiement.
#
# COPIE ce fichier en  deploy/deploy.config.ps1  (gitignoré) puis renseigne tes valeurs.
# N'édite pas ce modèle avec de vraies valeurs : il est suivi par git.

# Cible SSH : "utilisateur@hote" OU un alias défini dans ton ~/.ssh/config.
# Recommandé : un alias + clé SSH pour ne jamais saisir de mot de passe.
$SshTarget = 'deploy@mon-serveur.example'

# Chemin ABSOLU du dépôt sur le serveur (là où tourne l'app et où se fait `git pull`).
$RemotePath = '/var/www/balldontlie'

# --- Options (décommente pour surcharger les valeurs par défaut) ---

# Port SSH (défaut : 22).
# $SshPort = 22

# Environnement Symfony pour le cache:clear (défaut : prod).
# $SymfonyEnv = 'prod'

# Lancer `composer install --no-dev` sur le serveur à chaque déploiement
# (utile seulement si tes dépendances PHP changent ; défaut : $false).
# $RunComposer = $true

# Rebuild + redémarrer le service Node de l'assistant IA sur le serveur
# (serveur MCP + agent, puis `systemctl restart nba-agent`). Défaut : $true.
# Mets $false si tu ne déploies pas l'IA. Prérequis : Node/nvm sur le serveur et
# le service systemd installé (voir deploy/README-agent.md).
# $DeployAgent = $false

# Nom de l'unité systemd de l'agent (défaut : nba-agent).
# $AgentService = 'nba-agent'
