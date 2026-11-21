# Déploiement

Un script remplace le `git pull` manuel + l'upload FTP de `app.js`/`app.css`.
Il **construit le front en local** puis, en SSH : met à jour le back (`git pull` +
`cache:clear`) et envoie le bundle (`scp public/build`).

## Mise en place (une seule fois)

1. **Config locale** — copie le modèle et renseigne tes valeurs :

   ```powershell
   Copy-Item deploy/deploy.config.example.ps1 deploy/deploy.config.ps1
   ```

   Édite `deploy/deploy.config.ps1` : `$SshTarget` (utilisateur@hôte ou alias SSH)
   et `$RemotePath` (chemin absolu du dépôt sur le serveur).
   Ce fichier est **gitignoré** : aucun identifiant ne part dans git.

2. **Accès SSH sans mot de passe** (recommandé) — génère une clé si tu n'en as pas,
   puis installe-la sur le serveur :

   ```powershell
   ssh-keygen -t ed25519
   ```

   ```powershell
   type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh deploy@mon-serveur.example "cat >> ~/.ssh/authorized_keys"
   ```

   Astuce : un alias dans `~/.ssh/config` (`Host balldontlie-prod` …) permet de mettre
   simplement `$SshTarget = 'balldontlie-prod'`.

## Déployer

```powershell
pwsh deploy/deploy.ps1
```

Le script s'arrête à la première erreur (build, SSH ou envoi) sans rien laisser à
moitié fait côté commandes. Les identifiants ne transitent jamais par le script :
l'authentification repose sur ta clé SSH.

## Rollback

Inchangé — les paliers sont tagués (`lot-0` … `lot-6`, `baseline-pre-refactor`).
Sur le serveur :

```bash
git fetch --tags && git reset --hard lot-6 && php bin/console cache:clear --env=prod
```

## Déploiement automatique en CI (sans aucune action manuelle)

Le workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) build le
front puis déploie via SSH **à chaque merge sur `master`** (et à la demande, via
« Run workflow »). Rien à faire une fois configuré.

### 1. Environnement GitHub

Le workflow cible un environnement nommé **`production`** (clé `environment: production`).
Crée-le dans **Settings → Environments** avec ce nom exact (ou renomme-le ainsi).

### 2. Clé SSH dédiée

Génère une paire **dédiée au déploiement** (ne réutilise pas ta clé perso) :

```powershell
ssh-keygen -t ed25519 -f deploy_key -N '""'
```

Ajoute la **clé publique** (`deploy_key.pub`) dans `~/.ssh/authorized_keys` sur le serveur.
La **clé privée** (`deploy_key`, tout le contenu) ira dans le secret `SSH_PRIVATE_KEY`.

### 3. Secrets & variables de l'environnement `production`

Dans l'environnement, section **Environment secrets** :

| Nom | Valeur |
| --- | --- |
| `SSH_HOST` | IP ou domaine du serveur |
| `SSH_USER` | utilisateur SSH |
| `SSH_PRIVATE_KEY` | contenu **entier** de la clé privée `deploy_key` |
| `DEPLOY_PATH` | chemin absolu du dépôt sur le serveur (ex. `/var/www/balldontlie`) |

Section **Environment variables** (optionnel) :

| Nom | Valeur |
| --- | --- |
| `SSH_PORT` | port SSH si différent de `22` |

Aucun de ces éléments ne vit dans le dépôt ni dans `.env`.

### Garde-fou (optionnel)

Comme chaque merge sur `master` déclenche un déploiement, tu peux ajouter une
**Required reviewer** sur l'environnement `production` : le build se lance, mais le
déploiement attend ton clic de validation. Bon compromis entre automatisation et
contrôle du moment.

> Le script local [`deploy.ps1`](deploy.ps1) reste utilisable en parallèle (déploiement
> manuel ponctuel). Les deux voies peuvent coexister.
