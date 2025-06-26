# Cahier des Spécifications - Dealtock

**Version 1.0**
**Date : 20/06/2025**

---

## 1. Introduction

### 1.1. Objectif de l'application
Dealtock est une application web conçue pour permettre aux entreprises (clients) de gérer et suivre leurs produits stockés dans des entrepôts tiers. Elle offre une interface centralisée pour la gestion des stocks, le suivi des ventes, les approbations administratives et l'analyse des performances.

### 1.2. Public Cible
L'application s'adresse à deux types d'utilisateurs principaux :
-   **Clients** : Entreprises ou individus qui confient leurs produits à des entrepôts.
-   **Administrateurs** : Personnel de Dealtock chargé de la gestion de la plateforme, de la validation des produits et des utilisateurs.

---

## 2. Rôles et Permissions

### 2.1. Client (Utilisateur standard)
-   Peut s'inscrire et se connecter.
-   Peut soumettre de nouveaux produits pour approbation.
-   Peut consulter la liste de ses produits et leur statut (Disponible, Vendu, Expédié, En attente).
-   Peut demander l'accès aux détails d'un produit (contact de l'entrepôt).
-   Peut consulter un tableau de bord analytique de ses propres produits.
-   Peut modifier son mot de passe et sa langue d'interface.

### 2.2. Administrateur
-   Dispose de toutes les permissions du rôle Client.
-   Accède à un tableau de bord administratif centralisé.
-   Valide ou refuse les soumissions de nouveaux produits.
-   Valide ou refuse les nouvelles inscriptions d'utilisateurs (fonctionnalité future).
-   Approuve ou refuse les demandes d'accès aux détails des produits.
-   Consulte les statistiques globales de la plateforme.
-   Peut réinitialiser le mot de passe d'un utilisateur.
-   Peut créer de nouveaux comptes administrateurs/modérateurs.

---

## 3. Spécifications Fonctionnelles

### 3.1. Authentification et Sécurité
-   **Inscription** : Formulaire avec nom complet, email et mot de passe.
-   **Politique de mot de passe** : 8 caractères minimum, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.
-   **Connexion** : Formulaire sécurisé avec email et mot de passe.
-   **Déconnexion automatique** : La session est automatiquement terminée après 5 minutes d'inactivité.
-   **Confirmation par e-mail** : Supabase gère l'envoi d'un e-mail pour activer le compte après l'inscription.

### 3.2. Gestion des Produits (Client)
-   **Ajout de produit** : Formulaire incluant nom, catégorie, valeur, quantité, emplacement et description. Le produit est soumis avec le statut "En attente d'approbation".
-   **Visualisation** : Les produits sont affichés sous forme de cartes avec leurs détails principaux.
-   **Filtrage et Recherche** : Possibilité de rechercher par mot-clé et de filtrer par statut.
-   **Mise à jour de statut** : Le client peut marquer un produit comme "Vendu" ou "Expédié" via des modales dédiées.

### 3.3. Tableau de Bord Principal (Admin)
-   La page d'accueil de l'admin est un centre de notifications et d'actions.
-   **Approbations de produits** : Liste des produits en attente avec des boutons pour approuver ou refuser.
-   **Demandes d'accès** : Liste des demandes des utilisateurs pour voir les détails des produits, avec des boutons pour accorder ou refuser l'accès.
-   **Notifications récentes** : Flux d'activité de la plateforme (nouvelles soumissions, nouvelles demandes, etc.).

### 3.4. Pages dédiées
-   **/ (Accueil)** : Affiche les actions rapides pour les clients et le tableau de bord des validations pour les admins.
-   **/products** : Affiche la liste des produits de l'utilisateur (ou tous les produits pour l'admin).
-   **/analytics** : Affiche les statistiques de performance (produits performants, peu performants, métriques financières).

### 3.5. Internationalisation
-   L'interface est disponible en Français (par défaut), Anglais et Arabe.
-   La langue peut être changée à tout moment depuis le menu utilisateur.

---

## 4. Spécifications Techniques

### 4.1. Stack Technologique
-   **Frontend** : React 18.2.0
-   **Build Tool** : Vite
-   **Styling** : TailwindCSS 3.3.2 avec shadcn/ui pour les composants.
-   **Animations** : Framer Motion 10.16.4
-   **Routing** : React Router 6.16.0
-   **Icônes** : Lucide React 0.292.0

### 4.2. Backend et Base de Données (BaaS)
-   **Service** : Supabase
-   **Authentification** : Supabase Auth (gestion des utilisateurs, JWT).
-   **Base de données** : Supabase (PostgreSQL) pour stocker les profils, produits, entrepôts, notifications, etc.
-   **Edge Functions** : Fonctions serverless pour des logiques spécifiques (ex: vérification de permissions).
-   **Realtime** : Supabase Realtime pour les mises à jour en direct de l'interface.

### 4.3. Schéma de la Base de Données (Simplifié)
-   `profiles`: Stocke les informations des utilisateurs (nom, entreprise, etc.), lié à `auth.users`.
-   `products`: Contient tous les détails des produits, y compris le statut, la valeur, la quantité et les permissions d'accès.
-   `warehouses`: Gère les informations sur les entrepôts (nom, adresse, etc.).
-   `search_requests`: Enregistre les demandes des utilisateurs pour accéder aux détails des produits.
-   `notifications`: Stocke les notifications générées par des actions système (triggers) pour le tableau de bord admin.
-   `user_registrations`: Gère le processus d'approbation des nouveaux utilisateurs.

---

## 5. Évolutions Futures
-   Gestion multi-entrepôts complète.
-   Système de facturation pour les commissions.
-   Tableaux de bord analytiques plus avancés avec graphiques interactifs.
-   Notifications push et par e-mail pour les actions importantes.