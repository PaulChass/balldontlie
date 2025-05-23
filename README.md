# 🏀 balldontlie

**balldontlie** est une application web responsive permettant de consulter des statistiques NBA à jour, via un backend développé en **Symfony** qui interagit directement avec les données de [nba.com](https://nba.com).

Le projet vise à proposer une alternative légère, rapide et accessible aux bases de données statistiques existantes.

---

## 🚀 Démo

👉 [balldontlie.fr](https://balldontlie.fr)  
*(Projet personnel en ligne et fonctionnel)*

---

## 🛠 Stack technique

- **Backend** : PHP, Symfony
- **Scraping/API privée** : nba.com (données récupérées depuis le site)
- **Frontend** : HTML, CSS, JavaScript (Vanilla)
- **Base de données** : MySQL
- **Hébergement** : VPS (Linux)

---

## 📦 Fonctionnalités principales

- 🔍 Recherche de joueurs NBA
- 📈 Consultation de statistiques par saison
- 📆 Visualisation des matchs récents ou en cours
- 🧩 Backend personnalisé sans API tierce publique

---



## ⚙️ Installation locale (optionnel)

```bash
git clone https://github.com/PaulChass/balldontlie.git
cd balldontlie

# Installer les dépendances Symfony
composer install

# Créer le fichier .env.local et configurer la base de données
cp .env .env.local

# Créer la BDD
php bin/console doctrine:database:create

# Lancer le serveur
symfony serve
