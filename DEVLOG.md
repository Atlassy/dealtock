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

**Découverte en creusant le vrai schéma de la base (via la clé `service_role`) :** pas besoin de créer une nouvelle table pour gérer les pickups — la table `orders` a déjà toutes les colonnes nécessaires (`delivery_weight_kg`, `ready_for_pickup_at`, `returned_at`, `failed_at`, `delivery_tracking_number`...) et des fonctions backend existent déjà (`seller_approve_order`, `seller_mark_ready`) pour le flux normal d'approbation → mise en prêt pour pickup.

**Solution :**
- Ajout des badges manquants "Returned", "Delivery Failed", "Refunded" avec une couleur rouge/grise cohérente.
- Le fallback par défaut pour un statut inconnu affiche maintenant "Unknown" au lieu de mentir en affichant "ordered".
- Ajout d'un encart rouge visible sur la carte de commande quand elle a été refusée/retournée ou que la livraison a échoué, avec les notes de livraison si disponibles.

**Bug trouvé mais pas encore corrigé :** `AdminReturnsDashboard.jsx` interroge des colonnes (`reason`, `condition_on_return`, `decision`, `return_status`) qui **n'existent pas** dans la vraie table `returns` (qui ne contient que `id, order_id, product_id, created_at`). Cette page plante probablement déjà en production. À corriger — en attente de décision.

### 9. Nettoyage divers
- `.env` local créé à partir du fichier fourni par le propriétaire du repo (jamais commité, déjà dans `.gitignore`).
- Retrait du trailer "Co-Authored-By: Claude" des commits (préférence explicite du collaborateur, à ne jamais remettre).

---

## En attente de décision
- Corriger `AdminReturnsDashboard.jsx` (colonnes inexistantes).
- Couleur `blue-*` (492 occurrences / 51 fichiers) : la rebrander en kraft/encre, ou la garder comme couleur fonctionnelle séparée de la marque ?
- App mobile (acheteurs + vendeurs/entrepôts) : pas commencée.
- Prochaine feature prévue : continuer sur le dashboard admin, puis warehouse (actuellement un simple placeholder "coming soon").
