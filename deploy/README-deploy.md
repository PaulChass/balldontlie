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

## Aller plus loin (optionnel) : déploiement automatique en CI

Pour un déploiement **sans aucune action manuelle** (à chaque merge sur `master`),
un workflow GitHub Actions peut builder puis déployer via SSH. Les secrets
(`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`) se mettent alors dans
**GitHub → Settings → Secrets and variables → Actions**, jamais dans le dépôt ni
dans `.env`. À noter : cela déploierait automatiquement chaque changement mergé —
à n'activer que si tu veux abandonner le contrôle manuel du moment du déploiement.
