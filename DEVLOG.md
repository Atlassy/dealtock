# Dealtock — Journal de développement

Ce fichier liste, dans l'ordre chronologique, chaque modification faite sur le projet : ce qui a été changé, les erreurs trouvées et leur solution, ce qui a été amélioré, et ce qui a été supprimé. Mis à jour à chaque étape de travail.

---

## Branche `design/bordereau-identity`

### 1. Identité visuelle "Bordereau"
**Ce qu'on a fait :**
- Remplacé la palette `amazon` (définie mais jamais utilisée) par une rampe de couleur `kraft-50` → `kraft-900` dans `tailwind.config.js`, basée sur le marron kraft `#AA8350`.
- Renommé mécaniquement toutes les classes `orange-*` en `kraft-*` (117 occurrences / 22 fichiers, marketplace + dashboards). Les classes `amber-*` ont été laissées intactes intentionnellement : elles servent de code couleur sémantique "en attente/avertissement" dans les flux de validation, pas la marque.
- Aplati 3 dégradés décoratifs `orange→amber` (bannières non sémantiques) en `bg-kraft-700` uni.
- Créé le composant `src/components/ui/stamp-badge.jsx` ("badge tampon") et l'avons appliqué aux badges "Dealtock Deal"/"Sealed" sur la marketplace.
- Ajouté les polices Archivo Black (titres), IBM Plex Mono (données), Inter (corps de texte) via Google Fonts dans `index.html`, et les familles correspondantes dans `tailwind.config.js`.

### 2. Bug majeur trouvé : hack CSS global qui cassait tout
**Erreur trouvée :** `src/index.css` contenait un bloc entier (lignes 106-375) de overrides `!important` non scopés, visiblement écrit à l'origine pour corriger une seule page (un formulaire "Add Product"), mais appliqué à l'aveugle à toute l'application :
- Forçait tous les éléments `text-white`, `text-gray-900`, etc. en gris foncé `#333333 !important` — rendait le texte illisible partout où du texte blanc était voulu (notamment en mode sombre).
- Forçait **tous les `<form>` du site** (login, recherche, checkout...) en largeur 500px, fond blanc, mise en page flex colonne — un formulaire de connexion ou une barre de recherche n'a rien à voir avec un formulaire d'ajout de produit.
- Forçait des fonds, bordures, ombres sur des classes Tailwind génériques (`bg-white`, `bg-gray-50`, `border-gray-200`...) partout dans l'app.

**Solution :** Suppression complète de ce bloc, en ne gardant que les utilitaires `line-clamp` (légitimes et réutilisés ailleurs).

### 3. Mode sombre cassé sur (quasiment) tout le site
**Erreur trouvée :** le toggle clair/sombre (`Navbar.jsx`) fonctionnait techniquement (ajoute/enlève la classe `dark` sur `<html>`), mais la quasi-totalité des composants n'avaient **aucune** classe `dark:` Tailwind : dashboards admin/seller/warehouse/delivery/dropshipper, page panier, profil, paramètres, formulaires d'authentification. Résultat : passer en mode sombre ne changeait rien sur ces pages (ou pire, laissait du texte illisible).

**Solution :** Ajout systématique des classes `dark:` sur l'ensemble de ces fichiers, en suivant la convention déjà utilisée sur la marketplace (`bg-white dark:bg-gray-800`, `text-gray-900 dark:text-white`, badges sémantiques avec `dark:bg-{couleur}-900/30 dark:text-{couleur}-400`, etc.). Travail réparti sur plusieurs agents en parallèle pour couvrir : seller, admin (fichiers principaux + components/modals/invoices/retours), warehouse, delivery, dropshipper, cart/profil/paramètres.

### 4. Texte invisible dans les champs de saisie (login/signup/reset)
**Erreur trouvée :** les champs `<input>` de connexion, inscription, mot de passe oublié et réinitialisation n'avaient aucune couleur de texte/fond explicite. Sur un Mac en mode sombre système, le navigateur appliquait son style natif sombre par défaut (texte blanc) même si la page elle-même était en mode clair — texte blanc sur fond blanc, invisible pendant la saisie.

**Solution :**
- Ajout de `bg-white text-gray-900` explicite sur tous les champs concernés (`login.jsx`, `SignUpForm.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`).
- Ajout d'un filet de sécurité global : déclaration `color-scheme: light` / `color-scheme: dark` dans `index.css` selon le mode, pour que tout futur champ sans couleur explicite suive le thème du site plutôt que les préférences système du visiteur.

### 5. Tableau produits (Inventory) : débordement horizontal + fond blanc résiduel
**Erreur trouvée :** `ProductTable.jsx` n'avait pas de classes `dark:` (fond blanc forcé en mode sombre), et ses colonnes en largeur fixe (`min-w-[Npx]`) forçaient un scroll horizontal même quand l'écran avait de la place disponible à gauche/droite.

**Solution :**
- Ajout des classes `dark:` sur le tableau, les badges de statut, les lignes alternées, etc.
- Passage à `table-fixed` avec largeurs en pourcentage (au lieu de largeurs fixes en pixels) pour que le tableau s'adapte à la largeur réelle disponible.
- Boutons "Edit"/"Delete" remplacés par des icônes compactes pour gagner de la place.
- Conteneur de la page Inventory passé de `max-w-7xl` à `w-full`.

### 6. Fond sombre codé en dur sur Seller Dashboard / Inventory
**Erreur trouvée :** `SellerDashboard.jsx` et `Inventory.jsx` avaient un fond `bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900` appliqué **sans condition** — la page restait sombre même en mode clair.

**Solution (1ère passe) :** rendu le fond conditionnel (`bg-gray-50` en clair, dégradé sombre uniquement via `dark:`), et converti tout le texte/bordures "glassy" du fichier pour qu'ils s'adaptent aux deux modes.

**Erreur trouvée (2e passe) :** le dégradé en mode sombre laissait apparaître une zone plus claire sur la droite de l'écran sur les grands écrans (probablement la zone du dégradé ne couvrant pas toute la largeur réelle après le passage à une largeur de page non contrainte).

**Solution :** remplacement du dégradé par une couleur sombre unie `dark:bg-gray-900`, cohérente avec le reste du site, qui élimine le problème.

### 7. Suppression de code mort
- `src/components/dashboard/seller/SellerDashboardold.jsx` (1336 lignes) — ancienne version, non importée nulle part.
- `src/components/dashboard/admin/AdminDecisionModel.jsx` — fragment de code orphelin (pas un vrai composant React, ne compile pas seul), non importé nulle part.
- `src/components/dashboard/admin/AdminReturnCard.jsx` — fichier complètement vide, non importé nulle part.

### 8. Statuts de commande retournée/échouée mal affichés (seller)
**Erreur trouvée :** `SellerOrders.jsx` ne reconnaissait pas les statuts de commande `returned`, `failed`, `refunded` — elles retombaient par défaut sur le badge "Pending Approval", ce qui donnait une fausse information au vendeur (un colis refusé/retourné semblait être "en attente d'approbation").

**Découverte en creusant le vrai schéma de la base (via la clé `service_role`) :** pas besoin de créer une nouvelle table pour gérer les pickups — la table `orders` a déjà toutes les colonnes nécessaires (`delivery_weight_kg`, `ready_for_pickup_at`, `returned_at`, `failed_at`, `delivery_tracking_number`...). (Note : on pensait à ce moment que les fonctions `seller_approve_order`/`seller_mark_ready` existaient déjà côté backend — faux, voir point 11 ci-dessous.)

**Solution :**
- Ajout des badges manquants "Returned", "Delivery Failed", "Refunded" avec une couleur rouge/grise cohérente.
- Le fallback par défaut pour un statut inconnu affiche maintenant "Unknown" au lieu de mentir en affichant "ordered".
- Ajout d'un encart rouge visible sur la carte de commande quand elle a été refusée/retournée ou que la livraison a échoué, avec les notes de livraison si disponibles.

### 10. Suppression de `AdminReturnsDashboard.jsx`
**Erreur trouvée :** ce composant interrogeait des colonnes (`reason`, `condition_on_return`, `decision`, `return_status`) qui **n'existent pas** dans la vraie table `returns` (qui ne contient que `id, order_id, product_id, created_at`). En vérifiant, le composant n'était importé/utilisé **nulle part** dans l'app — donc il ne plantait pas en prod, il était juste invisible. Sa fonction (validation des litiges retour) est déjà couverte, en fonctionnel, par `ReturnedProductsQueue.jsx` (lui bien utilisé dans le dashboard admin), qui gère l'approbation/refus des produits retournés sur la vraie table `products`.

**Solution :** suppression du fichier — code mort, cassé, et redondant avec une fonctionnalité qui marche déjà.

### 11. BUG CRITIQUE : le flux commande → approbation → pickup était cassé pour tout le monde
**Erreur trouvée :** en lançant l'audit du dashboard admin, on a vérifié quelles fonctions RPC sont *réellement déployées* sur la base (via le schéma exposé par la clé `service_role`, en comparant à la liste réelle des fonctions exposées par PostgREST). Résultat :
- `seller_approve_order` et `seller_mark_ready` — utilisées par les boutons "Approve Order" / "Mark Ready for Pickup" du dashboard vendeur — **n'existaient nulle part**, ni en base ni même dans aucun fichier de migration local.
- `update_order_status` — utilisée par le dashboard admin (Order Oversight) pour changer le statut d'une commande — n'existait pas non plus.
- Bonus : le fichier de migration local `supabase/migrations/20260211031448_admin_rpc_functions.sql` (6 fonctions : `admin_override_order_status`, `release_escrow_funds`, `get_pending_escrow`, `get_delivery_companies_with_stats`, `update_order_from_delivery`, `validate_order_status_transition`) n'avait **jamais été appliqué** à la base staging — ces fonctionnalités admin (escrow, stats transporteurs) sont donc probablement cassées aussi. Pas encore corrigé, à traiter dans la suite de l'audit admin.

**Impact :** concrètement, avant cette correction, un vendeur ne pouvait pas approuver une commande ni la marquer prête pour pickup — chaque clic plantait avec une erreur "function not found". C'était le cœur du flux de commande, pas une fonctionnalité secondaire.

**Solution :** écriture d'une nouvelle migration `supabase/migrations/20260619000000_seller_admin_order_status_rpcs.sql` avec les 3 fonctions manquantes (`seller_approve_order`, `seller_mark_ready`, `update_order_status`), avec vérification de propriété de la commande, codes d'erreur cohérents avec ce que le frontend attend déjà (`ORDER_NOT_FOUND`, `INVALID_STATUS`, `UPDATE_FAILED`), et journalisation dans `order_status_history`/`admin_actions`. Exécutée manuellement par Ali dans l'éditeur SQL Supabase (pas d'accès DDL direct possible avec la clé `service_role` seule). Vérifié après coup que les 3 fonctions sont bien exposées et actives.

### 12. `admin.js` : du code backend Express.js égaré dans le dossier React
**Erreur trouvée :** `src/components/dashboard/admin/admin.js` (361 lignes) était en réalité du code serveur Express.js (`require('express')`, middleware `req/res/next`, rate limiting, vérification JWT) — pas un module React. Il définissait 9 fonctions RPC (`admin_get_orders`, `admin_release_escrow`, `admin_get_dashboard_metrics`, etc.) **dont aucune n'existe en base**, mais le fichier n'était importé/exécuté nulle part dans l'app : il n'avait donc aucun impact réel, juste de la confusion potentielle.

**Vérification faite avant suppression :** on a confirmé que les vraies fonctionnalités escrow (`EscrowManagementSection.jsx`) et transporteurs (`DeliveryCompaniesSection.jsx`) **fonctionnent déjà** — elles font des requêtes directes sur les tables (`escrow_holdings`, `delivery_companies`) plutôt que de passer par des fonctions RPC. Elles ne dépendent donc pas des fonctions manquantes de `admin.js` ni de celles, jamais déployées non plus, du fichier `supabase/migrations/20260211031448_admin_rpc_functions.sql`. Ce dernier fichier de migration reste dans le repo mais n'est appelé par aucun code actif — gardé pour l'instant sans risque, à revoir si on a besoin un jour de ses fonctionnalités (override de statut par RPC, libération d'escrow par RPC, stats transporteurs calculées côté serveur).

**Solution :** suppression de `admin.js` — code mort, mal placé, sans impact sur l'app.

### 9. Nettoyage divers
- `.env` local créé à partir du fichier fourni par le propriétaire du repo (jamais commité, déjà dans `.gitignore`).
- Retrait du trailer "Co-Authored-By: Claude" des commits (préférence explicite du collaborateur, à ne jamais remettre).

---

## En attente de décision
- Couleur `blue-*` (492 occurrences / 51 fichiers) : la rebrander en kraft/encre, ou la garder comme couleur fonctionnelle séparée de la marque ?
- App mobile (acheteurs + vendeurs/entrepôts) : pas commencée.
- Prochaine feature prévue : continuer sur le dashboard admin, puis warehouse (actuellement un simple placeholder "coming soon").
