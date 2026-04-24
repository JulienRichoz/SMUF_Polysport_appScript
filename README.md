# Polysport 2026 - Gestionnaire de Tournoi

Ce projet est une application web "lightweight" conçue pour la gestion et la consultation en temps réel des matchs du tournoi **Polysport 2026**. Elle repose sur l'écosystème **Google Apps Script** (GAS), utilisant Google Sheets comme base de données vivante.

## 🌟 Fonctionnalités

### Vue Publique (`index.html`)
Destinée aux participants du tournoi :
* **Recherche d'équipe** : Barre de recherche avec autocomplétion pour trouver rapidement son planning.
* **Statut Live** : Affichage dynamique des matchs "En cours" avec un badge clignotant.
* **Compte à rebours** : Calcul automatique du temps restant avant le prochain match de l'équipe sélectionnée.
* **Programme & Plan** : Accès rapide au planning général de la journée et au plan des terrains. Le plan du tournoi est une image hébergée sur Postimages.org. Il faudra peut-être renouveler le lien si l'image ne s'affiche plus.

### Dashboard Staff (`admin.html`)
Destiné aux organisateurs sur le terrain :
* **Accès Sécurisé** : Authentification par code PIN avec persistance de session (`localStorage`).
* **Gestion par Terrain** : Vue filtrée par terrain pour savoir qui doit jouer et quand.
* **Fiches Contacts** : Accès direct aux coordonnées (téléphone/email) des capitaines pour les contacter en un clic en cas de retard.
* **Détails d'Équipe** : Visualisation complète de l'effectif et des statistiques de genre.

### Logique Backend (`code.gs`)
Le cerveau de l'application :
* **Routage** : Gestion des accès via des paramètres d'URL (ex: `?page=admin`).
* **Nettoyage des données** : Fonctions de formatage pour transformer les données brutes d'Excel en objets JSON exploitables.
* **Sécurité** : Vérification côté serveur du code PIN.

## Source de Données

Cette application est intimement liée à une **Google Sheet privée**. 

> **Note importante** : La base du planning (les horaires et les rencontres) est générée en amont par cet outil : [SMUF Polysport Scheduler](https://github.com/JulienRichoz/SMUF_Polysport_Scheduler.git).

### Structure de la Google Sheet
Le mieux à faire est de demander la Google Sheet à l'auteur ou contacter un membre du comité SMUF-Polysport.
Pour que l'application fonctionne, votre classeur Google Sheets doit contenir les onglets suivants :
1.  **`PLANNING_GENERAL`** : Contient les événements globaux (Equipe, Horaire, match).
2.  **`AFFICHAGE_FINAL`** : La grille des matchs par terrain.
3.  **`REF_Equipes`** : La base de données des équipes (Noms, Capitaines, Contacts, Participants).
4. Les données des équipes pour le tournoi 2026 ont été prises via le formulaire d'inscription GoogleDoc.

## 🚀 Installation et Déploiement

Pour reprendre ce projet sur votre propre compte Google :

1.  **Créer une Google Sheet** : Préparez vos données selon la structure mentionnée ci-dessus.
2.  **Ouvrir l'éditeur de scripts** : Dans votre Sheet, allez dans *Extensions* > *Apps Script*.
3.  **Copier les fichiers** :
    * Créez un fichier `Code.gs` et collez-y le contenu de `code.gs`.
    * Créez un fichier HTML nommé `index.html` et collez-y le contenu correspondant.
    * Créez un fichier HTML nommé `admin.html` et collez-y le contenu correspondant.
4.  **Configuration** :
    * Dans `code.gs`, modifiez la variable `BACKEND_PIN` pour définir votre code secret.
    * Modifiez `ADMIN_TOKEN` pour sécuriser l'URL de votre dashboard.
5.  **Déploiement** :
    * Cliquez sur *Déployer* > *Nouveau déploiement*.
    * Type : *Application Web*.
    * Exécuter en tant que : *Moi*.
    * Qui a accès : *Tout le monde* (l'accès admin est protégé par le token et le PIN).


*Projet développé pour l'équipe du tournoi Polysport 2026 par Julien Richoz.*
