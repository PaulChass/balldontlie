# 🏀 balldontlie

**balldontlie** est une application web de statistiques et de pronostics NBA : stats d'équipes et de joueurs, matchs du soir, cotes, et un jeu de paris en monnaie virtuelle entre utilisateurs.

Le backend **Symfony** expose une API REST consommée par un front **React**, et agrège en direct plusieurs sources de données NBA publiques.

👉 **Démo en ligne : [balldontlie.fr](https://balldontlie.fr)**

---

## 🛠 Stack technique

| Couche | Technologies |
|---|---|
| Backend | PHP 8, **Symfony 5.4**, Doctrine ORM |
| Frontend | **React 18** bundlé par Webpack Encore |
| Base de données | MySQL 8 |
| Conteneurisation | Docker / Docker Compose |
| Tests & CI | PHPUnit 10, GitHub Actions (lint + tests unitaires) |

---

## 🧩 Architecture

```
Front React (assets/)  ──fetch──►  API Symfony (src/Controller/MainController.php)
                                        │
                                        ├─ src/Services/StatsManager.php   → stats.nba.com (équipes / joueurs)
                                        ├─ src/Services/MatchsDeLaNuit.php  → cdn.nba.com (calendrier & scores)
                                        ├─ src/Services/BetManager.php      → résolution des paris
                                        └─ src/Nba/NbaClient.php            → client HTTP commun (timeouts, cache, erreurs)
                                        │
                                        └─ Doctrine ORM → MySQL (entités Bet, Comment, User)
```

- **`src/Controller/MainController.php`** : toutes les routes de l'API (stats, matchs, paris, commentaires, comptes).
- **`src/Services/`** : accès aux sources NBA et logique métier des paris.
- **`src/Nba/NbaClient.php`** : point d'entrée unique des appels HTTP NBA (timeouts raisonnables, gestion d'erreur, cache).
- **`src/Nba/Season.php`** : saison NBA courante (une seule constante à mettre à jour par intersaison).
- **`assets/`** : application React (composants, styles) compilée par Webpack Encore vers `public/build/`.

### Sources de données externes

| Donnée | Source |
|---|---|
| Stats équipes / joueurs | `stats.nba.com` (measure types Base / Defense / Advanced) |
| Calendrier & scores du soir | `cdn.nba.com` (scoreboard) |
| Blessures | `rotowire.com` |
| Cotes | `parionssport.fdj.fr` |

> ⚠️ Ces sources sont des APIs publiques non officielles : le code applique des timeouts et dégrade proprement (valeurs nulles, cache) quand elles sont indisponibles.

---

## 📦 Fonctionnalités

- 📈 Statistiques d'équipes et de joueurs, filtrables (N derniers matchs, domicile/extérieur, adversaire, pace, type de saison).
- 📆 Matchs du soir et du lendemain, scores en direct.
- 🤕 Blessures par équipe.
- 🎲 Jeu de paris en monnaie virtuelle (création, acceptation, résolution automatique) et classement des parieurs.
- 💬 Commentaires par match.

---

## ⚙️ Installation locale

### Prérequis
- PHP 8.1+, Composer
- Node.js + Yarn
- MySQL 8 (ou Docker)

### Mise en route

```bash
git clone https://github.com/PaulChass/balldontlie.git
cd balldontlie

# 1. Variables d'environnement
cp .env.example .env.local        # puis renseigner APP_SECRET et DATABASE_URL

# 2. Dépendances
composer install
yarn install

# 3. Base de données (via Docker, ou une instance MySQL existante)
docker compose up -d database
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# 4. Build du front
yarn dev        # ou `yarn watch` en développement

# 5. Lancer le serveur
symfony serve   # ou `php -S localhost:8000 -t public`
```

---

## 🔧 Commandes utiles

```bash
# Résoudre les paris en attente/acceptés depuis les résultats NBA
# (à planifier via cron ; l'ancienne route HTTP ouverte /check a été supprimée)
php bin/console app:bets:check

# Tests unitaires
vendor/bin/phpunit --testsuite unit
```

---

## ✅ Tests & CI

- **Tests unitaires** (`tests/Unit/`) : logique pure, sans réseau ni base (hachage des mots de passe, conversions de dates, format de saison).
- **Tests d'intégration** (`tests/`) : `WebTestCase` et tests de dépôts ; nécessitent une base de test et un accès réseau.
- **CI GitHub Actions** (`.github/workflows/ci.yml`) : à chaque PR, lint PHP (`php -l`) et exécution de la suite `unit`.

---

## 🔐 Authentification

L'identité de l'utilisateur est portée par une **session serveur** (cookie `HttpOnly`,
`SameSite=Lax`), jamais déduite du corps de la requête :

- `/signin` et `/register` ouvrent la session après vérification du mot de passe.
- `/me` renvoie l'utilisateur courant (le front restaure la session au chargement) ;
  `/logout` la ferme.
- Les routes mutantes (`/bet`, `/acceptBet`) exigent une session et prennent le pseudo
  de la session, pas celui envoyé par le client (`401` sinon).
- Le `SameSite=Lax` fournit une protection CSRF de base pour ces requêtes same-origin.

---

## 🚀 Déploiement & rollback

### En une commande (recommandé)

Le script [`deploy/deploy.ps1`](deploy/README-deploy.md) build le front en local puis,
en SSH, met à jour le back (`git pull` + `cache:clear`) et envoie le bundle — il
remplace le `git pull` manuel + l'upload FTP. Configuration (clé SSH, cible) et détails
dans [`deploy/README-deploy.md`](deploy/README-deploy.md).

```powershell
pwsh deploy/deploy.ps1
```

### À la main (équivalent)

Le serveur suit `origin/master`. Le **back** se déploie par `git pull` ; le **front**
(bundle `public/build/`, hors git) par un build local puis upload de `app.js` / `app.css`.

```bash
# Back (sécurité, API) — s'applique immédiatement
git pull origin master
php bin/console cache:clear

# Front (interface) — build local, puis upload de public/build/app.js et app.css
npm run build

# Rollback : revenir à un palier tagué
git fetch --tags
git reset --hard lot-6            # ou baseline-pre-refactor pour l'état d'origine
```

> La sécurité (Lot 6) vit côté serveur : elle s'applique dès le `git pull` + `cache:clear`,
> même si le bundle front n'est pas encore réuploadé.

---

## 📄 Licence

Projet personnel — tous droits réservés.
