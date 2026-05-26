# Congrès App

Application web de gestion de congrès scientifique : soumissions, inscriptions, paiements, gestion des utilisateurs et administration.

## Sommaire

- [Fonctionnalités principales](#fonctionnalités-principales)
- [Structure métier](#structure-métier)
- [Installation & Prérequis](#installation--prérequis)
- [Configuration](#configuration)
- [Lancement du projet](#lancement-du-projet)
- [Accès administrateur](#accès-administrateur)
- [Technologies](#technologies)
- [Auteurs](#auteurs)

---

## Fonctionnalités principales

- Gestion des utilisateurs (admin, participants)
- Soumission d’articles, posters, communications
- Inscriptions et paiement en ligne (Orange Money)
- Tableau de bord utilisateur et admin
- Notifications (approbation, rejet, etc.)
- Statistiques et suivi

## Structure métier

### Utilisateurs

- **User** : gestion des comptes, rôles (admin, user), informations personnelles

### Soumissions

- **Soumission** : dépôt, édition, validation, téléchargement, suppression
- Notifications liées aux soumissions

### Inscriptions

- **Inscription** : formulaire, validation, paiement mobile (Orange Money)
- Service dédié pour l’intégration paiement

### Administration

- Dashboard admin : gestion des soumissions, validation, suppression, téléchargement
- Dashboard user : suivi de ses soumissions, statistiques

### Sécurité

- Authentification Laravel, middleware par rôle, .env sécurisé

### Frontend

- Vues Blade, assets compilés avec Vite

### Base de données

- Migrations : users, soumissions, inscriptions, notifications
- Seeders pour utilisateurs de test

---

## Installation & Prérequis

1. **Cloner le dépôt**

    ```bash
    git clone <repo-url>
    cd CONGRES APP
    ```

2. **Installer les dépendances**

    ```bash
    composer install
    npm install
    ```

3. **Créer le fichier .env** (copier .env.example si présent ou générer via l’assistant)
4. **Générer la clé d’application**

    ```bash
    php artisan key:generate
    ```

5. **Configurer la base de données** dans `.env`
6. **Lancer les migrations**

    ```bash
    php artisan migrate
    ```

7. **Compiler les assets**

    ```bash
    npm run build
    ```

## Configuration

Adapter le fichier `.env` selon votre environnement :

- DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
- Paramètres Orange Money si besoin

## Lancement du projet

```bash
php artisan serve
```

Accéder à [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Accès administrateur

Par défaut, créez un utilisateur admin via un seeder ou directement en base.
Exemple de commande pour générer un utilisateur :

```bash
php artisan tinker
>>> App\Models\User::create(['nom'=>'Admin','prenom'=>'Admin','email'=>'admin@example.com','password'=>bcrypt('password'),'role'=>'admin']);
```

## Technologies

- Laravel PHP
- MySQL/MariaDB
- Vite, npm, Tailwind CSS
- Orange Money API

## Auteurs

- Projet développé par [Votre Nom/Équipe]

---

> Pour toute question, contactez l’équipe technique.
