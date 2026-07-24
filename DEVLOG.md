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

### 9. Nettoyage divers
- `.env` local créé à partir du fichier fourni par le propriétaire du repo (jamais commité, déjà dans `.gitignore`).


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

### 13. Détection de conflits entre règles de commission
**Erreur trouvée :** `CommissionRulesManager.jsx` permettait de créer deux règles actives avec le même public cible (`applies_to`), la même catégorie et des tranches de montant qui se chevauchent — sans aucun avertissement. Risque : calcul de commission silencieusement ambigu/imprévisible selon laquelle des deux règles est appliquée.

**Solution :**
- Ajout d'une logique de détection (`findConflicts`) : deux règles "se chevauchent" si même `applies_to`, même catégorie, et que leurs tranches de montant ET leurs périodes de validité se croisent.
- Dans la liste des règles, un badge "Conflict" (avec tooltip listant les règles concurrentes) apparaît sur toute règle active en conflit.
- Dans le formulaire d'ajout/édition, un bandeau d'avertissement jaune liste les règles existantes qui chevauchent celle en cours de création, avant validation (non bloquant — l'admin reste libre de l'enregistrer, mais voit le risque).
- Corrigé au passage : la modale d'ajout/édition de règle n'avait aucune classe `dark:` (oubliée lors de la passe mode sombre précédente).

### 14. Actions groupées sur les produits retournés
**Ce qu'on a fait :** `ReturnedProductsQueue.jsx` ne permettait d'approuver/refuser qu'un produit retourné à la fois. Ajout d'une case à cocher par produit (onglet "Pending Review" uniquement), d'un "Select all", et de deux boutons "Approve Selected (N)" / "Decline Selected (N)" qui appliquent l'action à tous les éléments sélectionnés en une seule requête. La modale de refus (avec choix du motif) est réutilisée pour le cas groupé.

### 15. BUG CRITIQUE : l'onglet Factures admin n'a jamais fonctionné
**Erreur trouvée :** `src/hooks/useInvoices.ts` interroge deux vues SQL (`admin_invoices_overview`, `order_oversight_with_invoices`) qui **n'existaient pas du tout** dans la base. Conséquence : la liste des factures ne s'est jamais chargée, ni le détail d'une facture — depuis le début. En creusant, le nom de colonne attendu côté frontend (`invoice_status`) ne correspond pas non plus au vrai nom de colonne de la table `invoices` (`status`).

**Solution :** écriture de la migration `supabase/migrations/20260619010000_invoice_overview_views.sql` qui crée les deux vues à partir des vraies tables (`invoices`, `invoice_lines`, `orders`, `order_financials`, `profiles`, `escrow_holdings`, `financial_ledger`, `returns`, `return_inspections`), avec l'alias `status AS invoice_status` pour matcher ce que le frontend attend. Exécutée manuellement par Ali dans l'éditeur SQL Supabase. Vérifié après coup que les deux vues répondent correctement (vides pour l'instant, car aucune facture n'a encore été générée en staging — comportement normal, pas un bug).

### 16. Chiffres bidons dans l'onglet Overview (admin)
**Erreur trouvée :** la carte "Total Orders" affichait une tendance "+12%" codée en dur (jamais recalculée), et le bloc "System Status" affichait "Database"/"API Services" toujours en vert "Operational", sans aucun lien avec la réalité.

**Solution :**
- Suppression de la fausse tendance "+12%" (pas de donnée historique fiable pour la calculer honnêtement pour l'instant — mieux vaut ne rien afficher qu'afficher un chiffre inventé).
- Remplacement des deux lignes "Database"/"API Services" toujours vertes par une seule ligne réelle "Database queries (last refresh)", basée sur les résultats effectifs des requêtes de chargement du dashboard (`Promise.allSettled`) : si une requête échoue, ça s'affiche en rouge avec le nombre d'échecs et le détail au survol.

---

### 17. Test manuel en conditions réelles : encore un bug caché trouvé et corrigé
**Ce qu'on a fait :** après tous les correctifs précédents, on a testé en vrai dans le navigateur (pas seulement via le schéma/le code) : créé une commande de test en base, puis cliqué sur "Approve Order" dans le dashboard seller.

**Erreur trouvée :** ça plantait avec `column "changed_at" of relation "order_status_history" does not exist`. En inspectant les triggers de la table `orders` (`information_schema.triggers`), le trigger `tr_track_order_status` (fonction `track_order_status_change()`) tentait d'insérer une colonne `changed_at` qui n'existe pas (la vraie colonne est `created_at`). Ce trigger se déclenche automatiquement sur **tout** changement de statut de commande — donc ce bug existait déjà avant notre travail et cassait silencieusement bien plus que nos nouvelles fonctions RPC (override admin, webhooks de livraison, etc., dès qu'un statut change).

**Solution :** migration `supabase/migrations/20260619020000_fix_order_status_history_trigger.sql` qui corrige la fonction du trigger (`created_at` au lieu de `changed_at`), et retire au passage l'INSERT manuel dans `order_status_history` qu'on avait ajouté dans `seller_approve_order`/`seller_mark_ready`/`update_order_status` (devenu redondant maintenant que le trigger fonctionne correctement — sinon chaque changement de statut aurait été journalisé deux fois). Exécutée manuellement par Ali dans l'éditeur SQL Supabase. Confirmé que "Approve Order" fonctionne maintenant.

**Leçon retenue :** les bugs qu'on trouve en lisant le code/le schéma ne suffisent pas — certains (comme celui-ci, un trigger silencieux) ne se révèlent qu'en cliquant réellement dans l'app. À refaire systématiquement après chaque lot de correctifs.

### 18. Commission Rules : la jointure vers `categories` n'a jamais existé en base
**Erreur trouvée :** en testant avec un compte admin de test, l'onglet "Commissions" affichait "Failed to load commission rules". `CommissionRulesManager.jsx` faisait `.select('*, categories(id, name)')`, mais il n'existe **aucune clé étrangère réelle** entre `commission_rules.category_id` et `categories.id` en base — PostgREST ne peut donc pas faire cette jointure implicite, et la requête entière échoue (pas de dégradation silencieuse). La table `categories` est par ailleurs complètement vide.

**Solution :** retrait de la jointure côté requête ; le nom de catégorie est maintenant retrouvé côté frontend en croisant `rule.category_id` avec la liste `categories` déjà chargée séparément pour le menu déroulant (qui existait déjà dans le composant).

### 19. Affinage de la détection de conflits : un défaut + une surcharge n'est pas un vrai conflit
**Ce qu'on a trouvé en testant avec les vraies données :** les 21 règles de commission déjà en production se sont **toutes** affichées en "Conflict" — par exemple pour B2C, 3 règles par tranche (0-200 MAD à 20%, 200.01-1000 à 25%, 1000.01-∞ à 15%) plus une règle "0-∞" à 30%. En vérifiant les vraies valeurs (`priority`, `is_default`), ce n'est pas un vrai conflit ambigu : la règle "0-∞" a `priority: 0` et `is_default: true` (un filet de sécurité), les 3 règles par tranche ont `priority: 10` — le système applique donc déjà la bonne règle de façon déterministe. La fonctionnalité de détection marchait correctement, mais ne distinguait pas "défaut + surcharge intentionnelle" d'un vrai conflit.

**Solution :** `findConflicts` ne signale plus que les paires de règles avec la **même priorité** qui se chevauchent (ambiguïté réelle, puisque rien ne les départage) — un défaut de priorité 0 chevauché par une règle plus spécifique de priorité 10 n'est plus considéré comme un conflit.

### 20. La génération de factures n'a jamais été implémentée
**Ce qu'on a trouvé en testant :** l'onglet Invoices charge bien (cf. point 15) mais reste vide — pas un bug, la table `invoices` est **complètement vide** sur toute la base. Aucun trigger, RPC ou fonction ne crée jamais de ligne dans `invoices` automatiquement (par exemple quand une commande est livrée/réglée). En creusant, on a trouvé une **3e tentative abandonnée** de cette fonctionnalité : `supabase/functions/invoices/index.ts` parle en interne de "bills" (pas "invoices") et pointe vers encore une autre vue inexistante (`admin_bills_overview`) — donc plusieurs essais inachevés par le passé, jamais terminés ni unifiés.

**Mise à jour : construit le même jour.** Migration `supabase/migrations/20260619030000_auto_generate_invoice_on_delivery.sql` : ajoute un trigger `tr_generate_invoice` (AFTER UPDATE ON orders) qui génère automatiquement une facture (+ sa ligne dans `invoice_lines`) la première fois qu'une commande passe au statut `delivered`, en réutilisant les montants déjà calculés par le trigger existant `compute_order_financials()` dans `order_financials`. Le numéro de facture reprend celui de la commande (`ORD-000003` → `INV-000003`). Protégé contre la double facturation (vérifie qu'aucune facture n'existe déjà pour la commande). Testé en passant la commande de test au statut "delivered" : la facture `INV-000003` a bien été créée et apparaît correctement dans `admin_invoices_overview` (nom du vendeur, montant, tout est bon).

### 21. Tests confirmés OK : actions groupées sur les produits retournés
Testé avec 3 vrais produits de test ("Pending Review") créés pour l'occasion : sélection multiple, "Approve Selected" et "Decline Selected" fonctionnent comme prévu. Confirmé par Ali.

### 22. "Download PDF" sur les factures ne marchait pas non plus
**Erreur trouvée :** le bouton "Download PDF" appelait une fonction edge `generate-invoice-pdf` qui **n'existe ni dans le code ni déployée** — encore une fonctionnalité jamais terminée (comme la génération de factures elle-même). Le bouton était même grisé/désactivé en permanence dans certains cas car il dépendait d'un `pdf_url` qui n'a jamais été renseigné.

**Solution :** plutôt que de construire et déployer une vraie fonction edge (pas d'accès CLI Supabase depuis cet environnement pour la déployer), génération du PDF **directement dans le navigateur** à partir des données déjà affichées (`src/lib/generateInvoicePdf.ts`, librairie `jspdf` ajoutée en dépendance). Le bouton télécharge maintenant un vrai fichier PDF (en-tête, infos vendeur, détail financier, lignes de facture) sans dépendre d'aucun backend. Mis à jour `InvoicesList.tsx`, `InvoiceDetailModal.tsx`, `OrderInvoiceCell.tsx` et `useInvoices.ts` pour ne plus dépendre de `pdf_url` (le bouton est maintenant toujours actif).

### 23. Bugs trouvés par l'associé en testant Order Oversight : RLS cassée + colonnes inexistantes
**Erreur trouvée #1 (la plus grave) :** la policy RLS `profiles_select_admin` vérifiait `auth.jwt() -> 'app_metadata' ->> 'role'` — mais **rien dans le code n'a jamais rempli ce champ** sur les utilisateurs (le vrai rôle vit dans la colonne `profiles.role`). Résultat : **aucun admin n'a jamais pu lire le profil d'un autre utilisateur** via la jointure `orders -> seller:profiles!seller_id(...)`, ni en prod ni en test — c'est pour ça que "Seller Information" et la colonne Seller du tableau affichaient toujours "N/A".

**Solution :** migration `supabase/migrations/20260620000000_fix_admin_profiles_select_policy.sql` — la policy utilise maintenant `current_user_role()` (la même fonction déjà utilisée correctement par la policy de mise à jour), qui lit la vraie colonne. Vérifié après coup avec une vraie session admin : la jointure renvoie maintenant les bonnes infos.

**Erreur trouvée #2 :** `OrderOversightSection.jsx` lisait des colonnes qui n'existent pas du tout sur `orders` (`customer_name`, `customer_phone`, `customer_address`, `city`) — d'où "Customer Information" toujours vide. Les vraies données sont dans `shipping_address` (jsonb : `name`, `phone`, `address`, `city`, `postal_code`) et `shipping_city`.

**Solution :** toutes les références corrigées pour lire `order.shipping_address?.name/phone/address` et `order.shipping_city`.

**Erreur trouvée #3 :** le détail "Order Amount" ne montrait que Product Price + Delivery Fee + Commission, sans la marge dropshipper/B2C — sur une commande de test à 35 MAD (20 MAD produit + 15 MAD marge), les 15 MAD manquants n'étaient nulle part visibles. La "Commission" affichée était aussi toujours à 0 car elle lisait `selectedOrder.dealtock_commission`, une colonne qui n'existe pas sur `orders` (le vrai calcul vit dans `order_financials`, déjà calculé automatiquement par un trigger existant).

**Solution :** jointure ajoutée vers `order_financials` dans la requête de `AdminDashboard.jsx`, affichage de la marge (markup) quand présente, et un avertissement visuel si le total ne correspond toujours pas à la somme des parties.

### 24. Frais de livraison : calcul depuis `delivery_fee_rules` ajouté (en attente de données)
**Demande de l'associé :** il a rempli la table `delivery_fee_rules` (ville, poids, transporteur) et voulait que le frais de livraison affiché dans Order Details en tienne compte plutôt que de rester à 0.

**Constat :** la table `delivery_fee_rules` est **vide** sur le projet staging utilisé ici (`wicjcdggytwqqvplxlod`) — ses données ont probablement été ajoutées sur un autre projet Supabase. À vérifier avec lui.

**Ce qu'on a fait quand même :** ajout de la logique de recherche/calcul (ville de destination, poids, transporteur, priorité) dans `OrderOversightSection.jsx` — affiche un avertissement si le frais calculé par règle diffère de celui enregistré sur la commande. Prêt à fonctionner dès que les données seront au bon endroit.

---

### 25. `delivery_fee_rules` : bug dans notre propre logique de correspondance
**Suite du point 24 :** confirmé avec l'associé que c'est bien le même projet Supabase (`wicjcdggytwqqvplxlod`) — la table était simplement restée vide (sa précédente tentative d'insertion n'avait apparemment pas abouti). Il a réinséré des règles de test.

**Erreur trouvée dans notre code :** la logique de correspondance ajoutée au point 24 enchaînait deux `.or()` Supabase, ce qui les combine en ET — donc dès qu'une commande avait un `delivery_company_id` mais que la règle de frais n'en précisait aucun (règle générique), la règle était exclue à tort.

**Solution :** la recherche de règle se fait maintenant en une seule requête (par ville de destination), puis le bon tarif est choisi côté client par ordre de préférence : règle liée au transporteur de la commande > règle générique (sans transporteur précis) > première correspondance.

## Décidé
- Couleur `blue-*` : **on ne touche pas**, reste comme couleur fonctionnelle séparée de la marque.
- App mobile : **pas pour l'instant**, à reprendre plus tard.

### 26. BUG CRITIQUE : un dropshipper n'a jamais pu passer une commande
**Erreur trouvée :** audit du dashboard dropshipper (même méthode que seller/admin) sur `PlaceOrderModal.jsx`. Deux problèmes cumulés :
1. **3 fonctions RPC inexistantes** : `get_dropshipper_customers`, `calculate_commission`, `place_dropshipper_order_v2` — appelées par le code mais jamais créées en base.
2. **La section "Customer Information" n'était qu'un commentaire vide** (`{/* ... customer form fields ... */}`) — aucun moyen de sélectionner ou créer un client dans l'interface. Impossible de passer une commande, indépendamment des RPC manquantes.
3. Bonus trouvé en creusant : `product.category_id` n'existe pas sur la table `products` (le vrai champ est `category`, texte) — la logique de commission ne se déclenchait donc même jamais.
4. Bonus #2 : même en réparant tout ça, la policy RLS sur `profiles` empêche un dropshipper de créer directement un profil pour quelqu'un d'autre (`auth.uid() = id` obligatoire) — la création de nouveau client aurait quand même échoué.

**Solution :** migration `supabase/migrations/20260620010000_dropshipper_place_order_rpcs.sql` avec les 3 fonctions manquantes + une 4ᵉ (`create_dropshipper_customer`, contourne proprement la restriction RLS via `SECURITY DEFINER`). Côté frontend : construction réelle de la section client dans `PlaceOrderModal.jsx` (liste des clients déjà commandés + bouton "+ Add a new customer" avec formulaire), retrait de la dépendance à `category_id`, et correction de l'adresse de livraison envoyée selon qu'on choisit un client existant ou qu'on en crée un nouveau. Exécuté manuellement par Ali, vérifié que les 4 fonctions sont actives.

### 27. Notifications invisibles dans tout le module dropshipper
**Erreur trouvée en testant :** en cliquant sur "Place B2B Order", rien ne semblait se passer — pas de message de succès ni d'erreur, juste "Processing..." puis retour à la normale. Cause : `PlaceOrderModal.jsx`, `AddCustomerModal.jsx` et `MarketplaceProducts.jsx` utilisaient le hook `useToast` (shadcn), mais l'app entière n'affiche que le `<Toaster />` de la librairie "sonner" (monté une fois dans `App.jsx`). Les notifications de `useToast` étaient donc créées en mémoire mais **jamais affichées à l'écran** — tout échec (ou succès) était invisible.

**Solution :** remplacement par `toast` de "sonner" dans les 3 fichiers, cohérent avec le reste de l'app.

**Conséquence positive :** une fois les messages visibles, un vrai bug est apparu : `new row violates row-level security policy for table "profiles"` en ajoutant un client depuis l'onglet "Customers" (`AddCustomerModal.jsx`) — exactement le même problème RLS déjà identifié et contourné dans `PlaceOrderModal.jsx` (point 26), mais ce fichier-ci faisait encore une insertion directe. Corrigé pour utiliser la même fonction `create_dropshipper_customer`, étendue avec un paramètre email optionnel (migration `20260620020000_add_email_to_create_dropshipper_customer.sql`) puisque ce formulaire en propose un. Confirmé par Ali que l'ajout de client fonctionne maintenant.

### 28. Chaîne de 4 bugs supplémentaires découverts en testant la création de client jusqu'au bout
En testant réellement "+ Add a new customer" puis "Place B2B Order" de bout en bout, quatre bugs en cascade sont apparus l'un après l'autre (chacun corrigé puis le suivant révélé en retestant) :

1. **`profiles_id_fkey`** : `profiles.id` a une clé étrangère obligatoire vers `auth.users.id` — impossible de créer un profil "client" sans compte d'authentification associé. Décision prise avec Ali : créer un vrai compte `auth.users` minimal et inutilisable (email généré, mot de passe aléatoire jamais communiqué) en arrière-plan, plutôt que de modifier la contrainte existante.
2. **`function gen_salt(unknown) does not exist`** : les fonctions de chiffrement (`pgcrypto`) sont dans le schéma `extensions`, pas `public` — la fonction RPC limitait sa recherche à `public`. Corrigé en les appelant explicitement (`extensions.crypt(...)`, `extensions.gen_salt(...)`).
3. **`duplicate key value violates unique constraint "profiles_pkey"`** : il existe déjà un trigger sur `auth.users` qui crée automatiquement une ligne `profiles` correspondante à la création d'un compte — notre propre `INSERT` entrait donc en conflit. Corrigé en `UPSERT` (`ON CONFLICT (id) DO UPDATE`).
4. **`null value in column "delivery_company_id" of relation "escrow_holdings"`** : le trigger `create_escrow_on_order()` crée une ligne d'escrow sur **toute** commande sans vérifier qu'un transporteur est assigné — or une commande dropshipper n'en a pas encore au moment de sa création (assigné plus tard). C'est un bug de conception préexistant, pas spécifique au dropshipper : n'importe quel flux de commande sans transporteur dès la création aurait crashé pareil. Corrigé pour ignorer la création d'escrow quand `delivery_company_id` est `NULL`.

**Résultat :** testé et confirmé par Ali — création de client + passage de commande B2B fonctionnent maintenant de bout en bout (commande ORD-000006 créée, stats du dashboard dropshipper à jour : marge brute, frais Dealtock, profit net).

### 29. Faux conflits sur les règles de commission par catégorie
**Erreur trouvée :** l'associé a rempli de vraies règles de commission dropshipper par catégorie (Electronics, Home, Beauty...) — toutes se sont affichées en "Conflict" à tort. Cause : ces règles utilisent le champ texte historique `category`, pas `category_id` (qui n'a jamais été lié à de vraies catégories — voir point 18). Mon code de détection de conflit ne comparait que `category_id`, donc des règles avec des catégories différentes mais `category_id` vide étaient toutes considérées comme "même catégorie".

**Solution :** la comparaison utilise maintenant `category_id` en priorité, sinon `category` (texte) en repli.

**Signalé par l'associé, vérifié et résolu :** "access denied" en modifiant une règle de commission dropshipper. Vérification faite : son compte (`allblue.contact@gmail.com`) a bien le rôle `admin` en base, et la policy RLS `cr_manage_admin` vérifie correctement `profiles.role = 'admin'` (pas de bug de JWT comme au point 23). En retestant avec ce compte connecté, la modification d'une règle de commission s'enregistre normalement — l'erreur initiale était probablement liée à une session pas encore rafraîchie au moment du signalement, pas un bug du site.

### 30. Fin de l'audit dropshipper : 3 bugs supplémentaires trouvés
**`DropshipperOrders.jsx`** : la liste des statuts de commande ne correspondait pas aux vrais statuts utilisés ailleurs (`ready_for_pickup`/`with_delivery_partner` au lieu de `ready`/`picked_up`, et `returned`/`failed`/`refunded`/`settled` manquaient complètement) — même bug que celui déjà corrigé côté seller. Corrigé, plus un filtre de statut plus complet et un statut par défaut honnête ("Unknown" au lieu de mentir).

**`DropshipperEarningsPage.jsx`** : la requête sélectionnait `products.category_id`, une colonne qui n'existe pas — confirmé que ça fait planter toute la requête (`column products_1.category_id does not exist`), donc la page Earnings ne chargeait jamais rien. Colonne retirée (elle n'était utilisée nulle part dans le fichier).

**`DropshipperCustomersPage.jsx`** : **3ᵉ copie** du même bug déjà vu deux fois (`PlaceOrderModal.jsx`, `AddCustomerModal.jsx`) — un formulaire "Add Customer" intégré directement dans cette page, qui insérait encore directement dans `profiles` au lieu de passer par `create_dropshipper_customer`. Corrigé. Au passage, `.single()` remplacé par `.maybeSingle()` sur la recherche d'email existant (plantait avec une erreur si aucun client ne correspondait).

**Bug racine trouvé en plus, qui touchait les 3 fichiers à la fois :** la table `profiles` n'avait que 2 policies de lecture (son propre profil, ou être admin) — un dropshipper n'avait **aucun moyen de lire les profils de ses propres clients**. La jointure `customer:customer_id(...)` aurait donc toujours renvoyé `null` silencieusement (RLS ne génère pas d'erreur, juste un résultat vide), affichant "Customer: N/A" indéfiniment même avec de vraies données en base. Nouvelle policy ajoutée (`profiles_select_own_customers`) : un dropshipper peut lire le profil d'un client s'il existe une commande les reliant.

### 31. Le dashboard warehouse n'a jamais été branché, et le rôle "warehouse" n'existait pas en base
**Erreur trouvée :** `Dashboard.jsx` avait l'import et le `case "warehouse"` du switch de routage **commentés** — un utilisateur avec ce rôle voyait littéralement "Unauthorized role: warehouse". `WarehouseDashboard.jsx` lui-même n'était qu'une page "coming soon" vide.

**Découvertes en construisant le vrai dashboard :**
1. Les policies RLS `products_update_seller`/`products_delete_seller` limitaient la modification de ses propres produits aux rôles `seller`/`pro_seller` — un compte warehouse n'aurait jamais pu gérer ses produits même une fois assigné.
2. **Bug critique trouvé en profondeur :** `ReturnedProductsImporter.jsx` (l'import CSV admin des produits retournés) assignait `user_id = id de la société de livraison` au lieu d'un vrai profil utilisateur — or `products.user_id` a une **vraie clé étrangère vers `profiles`**. Testé directement : chaque tentative d'import a **toujours échoué** avec une violation de clé étrangère, depuis le début. Personne n'a dû s'en rendre compte car rien ne signalait clairement l'erreur exacte.
3. Encore plus en profondeur : `profiles.role` avait une **contrainte CHECK** qui n'autorisait que `'', 'seller', 'dropshipper', 'customer', 'admin', 'delivery'` — `'warehouse'` n'y figurait même pas. Impossible de créer un compte warehouse, point final.

**Solution :**
- Reconnecté `WarehouseDashboard` dans `Dashboard.jsx`.
- Reconstruit `WarehouseDashboard.jsx` : statistiques (total, en attente, disponible, valeur du stock), liste des produits retournés assignés au compte connecté, modification du prix demandé, marquage "vendu".
- Étendu les policies RLS produits pour inclure le rôle `warehouse`.
- Ajouté un vrai sélecteur "Warehouse Partner" dans l'import CSV (liste des profils `role='warehouse'`), qui assigne désormais `user_id` au bon partenaire au lieu de la société de livraison (`origin_delivery_company_id` reste pour tracer qui a déposé le colis).
- Étendu la contrainte CHECK sur `profiles.role` pour autoriser `'warehouse'`.
- Créé un compte warehouse de test avec 2 produits assignés pour valider le flux complet.

### 32. RÉGRESSION CRITIQUE (auto-infligée) : récursion infinie cassait TOUS les comptes
**Erreur trouvée :** juste après le point 31, plus aucun compte ne pouvait se connecter — "Unauthorized role:" s'affichait pour seller, admin, dropshipper, warehouse, tout le monde. Cause : la policy `profiles_select_own_customers` ajoutée plus tôt (point 30) vérifiait une condition en lisant la table `orders` — mais la policy RLS de `orders` lit elle-même `profiles` pour vérifier le rôle de l'appelant. Résultat : `profiles` → `orders` → `profiles` → `orders`... récursion infinie (`infinite recursion detected in policy for relation "profiles"`), qui fait échouer **toute** lecture de `profiles`, pour tout le monde, peu importe quelle autre policy aurait suffi.

**Solution :** la condition est passée dans une fonction `SECURITY DEFINER` (`is_own_customer()`), qui contourne le RLS de `orders` en interne et casse ainsi le cycle. Vérifié immédiatement après par Ali : tous les comptes refonctionnent, et le dashboard warehouse de test s'affiche correctement (2 produits, stats, prix, bouton "Mark as Sold").

**Leçon retenue :** toute policy RLS qui lit une autre table doit être vérifiée pour un risque de cycle si cette autre table a elle-même une policy qui relit la première — à surveiller systématiquement pour toute future policy ajoutée.

### 33. "Failed to release escrow" — valeur non autorisée
**Erreur trouvée :** en testant le bouton "Release" dans Escrow Management, message générique "Failed to release escrow". En reproduisant la requête directement, le vrai message était `violates check constraint "escrow_holdings_release_reason_check"` — le code envoie `release_reason: 'admin_release'` (et `'bulk_admin_release'` pour la libération groupée), mais la contrainte en base n'autorise que `'delivered', 'returned', 'settled', 'admin_override', 'order_delivered'`.

**Solution :** les deux valeurs remplacées par `'admin_override'`, qui existe déjà dans la liste autorisée — aucun changement de base nécessaire.

### 34. BUG CRITIQUE : personne n'a jamais pu commander en tant qu'invité
**Découvert en simulant le parcours client réel.** Une chaîne de 4 bugs empilés, trouvés un par un en testant le vrai checkout marketplace (pas via script) :

1. **`orders_insert_buyer` exigeait `auth.uid() IS NOT NULL`** — alors que le panier propose explicitement "Guest checkout" et affiche "You're ordering as a guest." Le guest checkout était donc **techniquement impossible** depuis toujours. Ajout d'une policy `orders_insert_guest` qui autorise l'insertion anonyme, mais seulement pour des commandes B2C "propres" (`customer_id` et `dropshipper_id` doivent être `NULL`, pour empêcher un invité de usurper l'identité d'un client/dropshipper enregistré).
2. **`create_escrow_on_order()` n'était pas `SECURITY DEFINER`** — ce trigger se déclenche automatiquement à la création de n'importe quelle commande, mais s'exécutait avec les droits de l'appelant (l'invité), qui n'a pas le droit d'écrire dans `escrow_holdings`. Corrigé.
3. **8 autres triggers de la table `orders` avaient le même problème** (`create_ledger_entry`, `create_payouts_on_delivery`, `detect_order_anomalies`, `finalize_ledger_on_delivery`, `generate_order_number`, `notify_order_update`, `release_escrow_on_delivery`, `set_default_order_status`, `track_order_status_change`) — vérifié systématiquement via `pg_trigger`/`pg_proc` plutôt que de les découvrir un par un, et tous corrigés en une seule migration (`ALTER FUNCTION ... SECURITY DEFINER`).
4. **Le code du checkout relisait la commande juste après l'avoir créée** (`.insert().select().single()`), mais un invité n'a aucune policy de lecture sur `orders` (il n'a pas d'identité stable pour scoper "ses propres" commandes) — ouvrir cette lecture à tout le monde aurait exposé les noms/adresses/téléphones de tous les autres clients invités. Corrigé côté frontend : on ne redemande la relecture que si l'utilisateur est connecté, sinon on réutilise les données déjà construites localement.

**Leçon retenue :** un trigger qui se déclenche automatiquement sur une action accessible à un utilisateur non-admin (ici : passer une commande) doit systématiquement être `SECURITY DEFINER` s'il écrit dans une table que cet utilisateur n'a pas le droit de modifier directement. À vérifier en premier réflexe pour tout futur trigger ajouté sur une table accessible aux invités/clients.

### 35. `update_order_status` plantait quand aucun motif n'était fourni
**Erreur trouvée :** en changeant le statut d'une commande via le menu déroulant de Order Oversight, `null value in column "reason" of relation "admin_actions" violates not-null constraint`. La fonction insère le motif (`p_reason`) dans `admin_actions.reason`, mais ce champ est obligatoire et le frontend envoie toujours `null` (le menu déroulant ne demande pas de motif).

**Solution :** valeur par défaut `'Status updated via Order Oversight'` quand aucun motif n'est fourni.

### 36. Le client n'avait jamais aucun moyen de connaître son numéro de commande
**Constat (soulevé par Ali) :** après un achat, le client (invité ou connecté) voit juste un toast générique "Order placed!" — le numéro de commande (`order_number`, ex: `ORD-000006`) est bien généré côté base mais n'était **jamais affiché**, donc strictement aucun moyen de suivre sa commande ensuite.

**Solution :** le toast de succès affiche maintenant le(s) numéro(s) de commande, avec une durée d'affichage plus longue (10s) pour laisser le temps de le noter.

**Décision prise :** l'automatisation du suivi (mise à jour automatique du statut par le transporteur via webhook/API, fonction `update_order_from_delivery` déjà prévue mais jamais déployée) est reportée — aucun vrai transporteur n'est connecté actuellement (uniquement "Test Delivery Co", fictif), donc rien à automatiser concrètement pour l'instant. Le suivi manuel par l'admin reste le bouche-trou logique tant qu'un vrai partenaire transporteur n'est pas intégré.

### 37. Email de confirmation de commande automatisé (Resend) — bug `ALTER DATABASE` non autorisé sur Supabase hébergé
**Demande d'Ali :** envoyer automatiquement au client un email de confirmation contenant son numéro de commande, dès qu'une commande est créée — sans déployer d'edge function (pas d'accès CLI Supabase depuis cet environnement).

**Ce qu'on a fait :** migration `supabase/migrations/20260620150000_auto_send_order_confirmation_email.sql` — active l'extension `pg_net` (appels HTTP asynchrones depuis Postgres) et ajoute un trigger `tr_send_order_confirmation_email` (AFTER INSERT ON orders) qui appelle directement l'API Resend (`POST https://api.resend.com/emails`) avec le numéro de commande et le total.

**Erreur trouvée :** aucun email n'est arrivé, et le tableau de bord Resend affichait "No sent emails yet" — `pg_net` n'avait même pas tenté l'appel (confirmé en lisant `net._http_response` : 0 ligne). Cause : la clé API était censée être lue via `current_setting('app.settings.resend_api_key', true)`, réglée par `ALTER DATABASE postgres SET app.settings.resend_api_key = '...'` — mais Supabase hébergé **refuse cette commande aux comptes non-superutilisateur** (`ERROR 42501: permission denied to set parameter`), même si le rôle s'appelle "postgres" dans l'éditeur SQL. La clé n'a donc jamais été enregistrée (confirmé : `current_setting(...)` renvoyait `null`).

**Solution :** remplacement par **Supabase Vault** (mécanisme officiel pour stocker des secrets accessibles depuis des fonctions SQL sur Supabase hébergé) : la clé est stockée une fois via `SELECT vault.create_secret('...', 'resend_api_key');` (commande à coller directement dans l'éditeur SQL, jamais commitée), et la fonction du trigger la lit désormais via `SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'resend_api_key'`. En attente de test après que la clé soit re-stockée via Vault.

**Leçon retenue :** sur Supabase hébergé, ne jamais utiliser `ALTER DATABASE ... SET app.settings.*` pour des secrets — toujours passer par Vault (`vault.create_secret`/`vault.decrypted_secrets`).

**Confirmé par Ali :** email reçu après le passage à Vault. Le design/contenu du message (HTML) reste basique pour l'instant — à retravailler plus tard, ce n'est pas urgent.

### 38. "Days in storage" : valeur figée saisie à la main, incohérente entre annonces
**Constat (soulevé par Ali) :** sur le dashboard Warehouse, le badge "X days in storage" n'apparaissait que sur certaines annonces, pas toutes.

**Erreur trouvée :** ce champ n'était pas calculé — c'était une valeur **optionnelle saisie manuellement** lors de l'import CSV (`ReturnedProductsImporter.jsx`). Si l'admin laissait la colonne vide dans le CSV, le badge disparaissait simplement (`product.days_in_storage != null`). Pire : même quand elle était remplie, c'était un chiffre figé au moment de l'import, qui ne progressait jamais (ex: "3 days in storage" affiché le lendemain de la création, alors que ça aurait dû dire "1 day").

**Solution :** remplacé par un calcul automatique côté frontend (`daysInStorage()`, `Math.floor((Date.now() - created_at) / 86400000)`) dans `WarehouseDashboard.jsx` et `ReturnedProductsQueue.jsx` — toujours juste, toujours affiché, plus besoin de saisie manuelle. Retiré le champ "Days in Storage" de l'import CSV (`ReturnedProductsImporter.jsx` : colonne du template, mapper automatique, validation, payload d'insertion, colonne du tableau d'aperçu) puisqu'il est désormais entièrement obsolète.

### 39. Cloche de notifications branchée dans la navbar (tous rôles)
**Demande d'Ali :** un bouton cloche de notifications dans la navbar, fonctionnel pour tout le monde (client, vendeur, admin, dropshipper...), pas juste visuel.

**Découverte en creusant :** l'infrastructure existait déjà à 90%, jamais branchée — encore le même schéma que tout le reste de l'audit (fonctionnalité construite puis oubliée) :
- Table `notifications` (avec RLS correcte : chacun lit/marque ses propres notifs).
- `src/hooks/useNotifications.js` — souscription temps réel Supabase déjà fonctionnelle.
- `src/components/notifications/NotificationBell.jsx` — composant complet, mais **importé nulle part**, sans classes `dark:`.
- Un trigger `notify_order_update()` qui alimentait déjà la table, mais avec 2 bugs : (1) se déclenchait sur **toute** mise à jour de commande, pas seulement un changement de statut (donc notifications trompeuses "status changed to X" même quand le statut n'avait pas changé), et (2) ne notifiait **que le vendeur**, jamais le client ni le dropshipper, et jamais à la création de la commande (le trigger ne tournait qu'en `UPDATE`).

**Solution :**
- Migration `supabase/migrations/20260621000000_fix_and_extend_order_notifications.sql` : `notify_order_update()` ne se déclenche plus que si le statut a réellement changé (`IF NEW.status IS DISTINCT FROM OLD.status`), et notifie désormais le vendeur **et** le client **et** le dropshipper (selon qui est renseigné sur la commande). Nouveau trigger `tr_notify_new_order` (`AFTER INSERT`) qui notifie vendeur/dropshipper dès qu'une commande est passée.
- `useNotifications.js` : ajout de `markAllAsRead` (manquant alors que le composant l'attendait déjà).
- `NotificationBell.jsx` : ajout des classes `dark:` (oubliées comme partout ailleurs lors de la 1ère passe mode sombre, puisque ce composant n'était pas encore branché à ce moment-là), état d'ouverture maintenant contrôlé par le hook plutôt que dupliqué localement.
- Branché dans `Navbar.jsx` (icônes partagées mobile/desktop) : visible uniquement si connecté, entre le sélecteur de langue/mode sombre et le panier — donc actif pour tous les rôles (client, vendeur, admin, dropshipper, warehouse, delivery) puisque c'est le même composant Navbar pour tout le monde.

**Limite connue, pas corrigée :** la policy `notif_insert_any` autorise n'importe quel utilisateur connecté à insérer une notification pour **n'importe quel** `user_id` (pas seulement les `SECURITY DEFINER` functions) — risque de spam, pas de fuite de données. À durcir plus tard si besoin (restreindre l'insertion aux fonctions `SECURITY DEFINER` seulement).

**Non testé visuellement par moi** (pas d'outil de navigateur disponible dans cet environnement) — à valider par Ali : se connecter, passer une commande de test ou changer son statut, vérifier que la cloche affiche bien la notification en temps réel.

### 40. Clic sur une notification : redirection vers le détail de la commande
**Demande d'Ali (suite du point 39) :** cliquer sur une notification doit rediriger vers ce qu'elle concerne, comme une notif bancaire qui ouvre le détail du paiement — pas juste marquer comme lu.

**Découverte en construisant ça :** il n'existait **aucune page "Mes commandes"** pour un client connecté — un client n'avait nulle part où voir l'historique de ses commandes (seul `OrderConfirmation.jsx` juste après l'achat). Sans ça, une notification "votre commande a changé de statut" n'aurait eu aucun endroit valable où rediriger.

**Solution :**
- Nouvelle page `src/components/MyOrders.jsx` (route `/my-orders`) : liste les commandes du client connecté (`customer_id = auth.uid()`), avec badges de statut cohérents avec le reste du site. Lien ajouté dans le menu utilisateur de la navbar.
- `SellerOrders.jsx` et `DropshipperOrders.jsx` : lisent désormais `?orderId=` dans l'URL, scrollent automatiquement jusqu'à la commande concernée et l'entourent d'un anneau de surbrillance.
- `SellerDashboard.jsx` : lit `?view=orders` pour ouvrir directement l'onglet Commandes au chargement.
- `Navbar.jsx` : au clic sur une notification de type "order", redirige selon le rôle de l'utilisateur — `/dashboard?view=orders&orderId=X` (seller/warehouse), `/dropshipper/orders?orderId=X` (dropshipper), ou `/my-orders?orderId=X` (client) — et ferme le menu déroulant.

**Non testé visuellement par moi** (toujours pas d'outil de navigateur ici) — à valider par Ali sur chaque rôle.

### 41. Le sélecteur de langue (FR/AR) ne traduisait rien — mise en place du vrai i18n
**Constat d'Ali :** changer la langue en français ou arabe dans la navbar ne changeait jamais le texte affiché, tout restait en anglais.

**Erreur trouvée :** le sélecteur ne faisait que changer le sens d'écriture (`dir`, ltr/rtl) et l'icône du drapeau (`Navbar.jsx`) — il n'y avait **aucun système de traduction réel** dans tout le site. Pas de `react-i18next`, pas de fichiers de traduction, pas de fonction `t()` : chaque texte était écrit en dur en anglais directement dans le JSX de chaque composant.

**Décision prise avec Ali :** construire le vrai système de traduction (pas juste masquer le sélecteur), à faire progressivement — marketplace d'abord, puis dashboards dans une prochaine étape.

**Solution (1ère étape) :**
- Installation de `i18next` + `react-i18next`. Config dans `src/lib/i18n.js`, chargée au démarrage (`main.jsx`).
- Fichiers de traduction `src/locales/{en,fr,ar}.json` (clés `navbar`, `marketplace`, `categories`), avec gestion du pluriel via les suffixes `_one`/`_other` (convention i18next v26).
- `Navbar.jsx` : `changeLanguage()` appelle désormais réellement `i18n.changeLanguage(code)` (avant : changeait juste un state local sans effet) ; tous les textes (recherche, filtres, tri, menu utilisateur, sidebar mobile, pied de page) remplacés par des appels `t(...)`.
- `MarketplacePage.jsx` : catégories, onglets (Tous/Nouveaux/Deals Dealtock), bannière de deals locaux, badges produit, modale de détail — tout traduit.
- Le nom anglais des catégories (`Electronics`, `Fashion`...) reste la valeur canonique utilisée pour le filtrage/les requêtes Supabase ; seul l'**affichage** est traduit, pour ne rien casser dans la logique de filtre existante.

**Reste à faire (prochaine étape, signalé à Ali) :** traduire les dashboards (seller/admin/dropshipper/warehouse/delivery), le panier/checkout, les formulaires d'authentification — pas encore fait, portée volontairement limitée à la navbar + marketplace pour cette première passe.

**Non testé visuellement par moi** (pas d'outil de navigateur ici) — à valider par Ali : changer de langue et vérifier que la marketplace et la navbar changent réellement de texte, y compris le sens d'écriture en arabe (RTL).

**Confirmé par Ali :** la navbar change bien de langue (testé en français). Remarque pertinente d'Ali : au Maroc, tout le monde ne comprend pas l'anglais, et tout le monde ne comprend pas le français non plus — le site ne devrait pas avoir l'anglais comme langue par défaut.

**Suite donnée :**
- Langue par défaut changée de l'anglais vers le français (`src/lib/i18n.js`, `Navbar.jsx`) pour les nouveaux visiteurs sans préférence enregistrée — l'arabe et l'anglais restent sélectionnables.
- Traduction de `CartPage.jsx` (panier, résumé de commande, messages de succès/erreur) ajoutée à la même étape, vu que c'est la page la plus utilisée par les clients après la marketplace.

**Demande explicite d'Ali (test en direct) :** "je veux que le site bascule en tout mais carrément tout en fr" — en testant le dashboard vendeur, tout restait en anglais.

**Réponse honnête sur l'ampleur :** traduire la totalité du site (5 dashboards — seller/admin/dropshipper/warehouse/delivery —, formulaires d'auth, profil, factures...) représente plusieurs milliers de chaînes de texte répartis sur des dizaines de fichiers. Ce n'est pas réaliste de tout faire en un seul lot sans risquer des oublis/erreurs. Décision : avancer méthodiquement, fichier par fichier, en commençant par ce qui est sous les yeux d'Ali.

**Fait à cette étape :** traduction complète de l'onglet "Dashboard" du tableau de bord vendeur (`SellerDashboard.jsx`) — les 4 onglets, les 9 cartes de statistiques (Produits actifs, Valeur du stock, Total des commandes, Revenu net, Solde Escrow, Taux de conversion, Panier moyen, Réussite COD, Délai de traitement), le graphique de tendance des ventes, la répartition par appareil, le top produits par quantité/valeur, l'alerte stock faible, le top catégories, les produits les plus vendus, et l'en-tête de l'onglet Produits. Clés ajoutées sous `sellerDashboard` dans les 3 fichiers de langue.

**Mise à jour : dashboard vendeur 100% traduit.** Suite de la même session — traduction complète de `ProductTable.jsx` (en-têtes de colonnes, badges stock/statut, tooltips de commission), de l'onglet Escrow (`EscrowTab`, cartes, tableaux commandes/versements), et de `SellerOrders.jsx` (badges de statut, boutons d'action, modale de détail commande, état vide). Le dashboard vendeur est désormais le 1er dashboard intégralement traduit en FR/AR/EN.

**Mise à jour : + Delivery Companies + Invoices + Returned Products traduits → dashboard admin terminé.** `DeliveryCompaniesSection.jsx`, `InvoicesList.tsx`/`InvoiceDetailModal.tsx`, et `ReturnedProductsSection.jsx`/`ReturnedProductsQueue.jsx` (file de révision, actions groupées, modale de refus avec motifs traduits) traduits. **Le dashboard admin est maintenant 100% traduit**, à l'exception des modales de configuration des sociétés de livraison (API/mappings de statuts — `DeliveryCompanyModal`, `ApiKeysModal`, `StatusMappingTab`), reportées car peu utilisées au quotidien.

**Signalé par Ali :** la page "Inventory" (route `/inventory`, séparée des onglets du dashboard vendeur) était toujours en anglais. Traduite (`Inventory.jsx`) : en-tête, 4 cartes de stats, filtres (recherche/statut/catégorie), bascule tableau/grille, état vide, cartes produit en mode grille, titres des modales Ajouter/Modifier.

**Mise à jour : page Profil traduite.** `ProfilePage.jsx` (747 lignes) — les 3 onglets (Profil, Infos entreprise, Sécurité), changement d'email/mot de passe, upload d'avatar, bannière Premium, tous les messages toast.

**Mise à jour : dashboard dropshipper entièrement traduit.** On a fait `DropshipperDashboard.jsx` (squelette + onglets), `DropshipperOrders.jsx`, `MarketplaceProducts.jsx` + `ProductCard.jsx` (calculateur de profit), `DropshipperCustomersPage.jsx` + `AddCustomerModal.jsx`, `DropshipperEarningsPage.jsx`, et `PlaceOrderModal.jsx` — tous les onglets et modales du dashboard dropshipper sont maintenant en FR/AR/EN.

**Mise à jour : tous les formulaires d'authentification traduits.** On a fait `login.jsx`, `SignUpForm.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `CheckEmail.jsx`, `EmailConfirmation.jsx`, `PasswordUpdated.jsx`, `PasswordStrength.jsx` — connexion, inscription, mot de passe oublié/réinitialisation, confirmation d'e-mail, indicateur de force du mot de passe, tout est en FR/AR/EN. Attention conservée sur `PasswordStrength.jsx` : la valeur interne ("Strong"/"Medium"...) utilisée par la logique de validation reste en anglais (comparaisons de code), seul le libellé affiché à l'écran est traduit.

**Mise à jour : page Mes commandes traduite.** `MyOrders.jsx` traduite, en réutilisant les libellés de statut déjà créés pour le dashboard vendeur (cohérence des termes entre client et vendeur).

**Bilan de cette série de traductions :** marketplace, panier, profil, dashboard vendeur (+ Inventaire), dashboard admin (en entier), dashboard dropshipper (en entier), formulaires d'authentification, page Mes commandes — tout est maintenant en FR/AR/EN avec bascule réelle (et plus seulement le sens d'écriture).

**Reste à faire (volontairement pas fait, peu utilisé au quotidien) :**
- Le paragraphe "Business Insights" du dashboard vendeur (texte dynamique avec logique conditionnelle) — titre traduit, corps en anglais.
- Les formulaires internes `AddProductForm`/`EditProductForm` (champs de saisie).
- Modales de config des sociétés de livraison (API/mappings de statuts).
- Dashboards warehouse, delivery — comptes internes, peu nombreux.

## Priorités (méthode MoSCoW)

**Mise à jour importante du contexte :** le projet n'est pas encore lancé. L'idée est approuvée par l'État, le local et le matériel sont déjà pris — ce qui manque, c'est un site présentable pour convaincre de vraies sociétés de livraison de devenir partenaires. Aucun vrai transporteur ne sera intégré avant qu'un partenariat soit signé via cette démarche de présentation. Ça change la priorité : ce qui rend le site crédible pour une démo passe avant ce qui ne sert qu'après le lancement.

**Must have (avant de présenter le site à des sociétés de livraison) :**
- Nettoyer les données de test visibles (`Test Delivery Co`, produits "TEST"/"TEST2"...) qui feraient mauvaise impression si elles apparaissent pendant une démo.
- S'assurer que les flux principaux (commande → approbation → livraison → facture) fonctionnent de bout en bout sans erreur visible, puisque c'est probablement ce qu'on montrera en démo.
- Vérifier un domaine sur Resend (`dealtock.ma` ou équivalent) pour que les emails de démonstration n'aient pas l'air d'un compte de test gratuit.

**Should have (renforce la crédibilité, pas bloquant pour une démo) :**
- Traduire les dashboards Warehouse et Delivery.
- Retravailler le contenu/design de l'email de confirmation de commande.
- Traduire les formulaires internes `AddProductForm`/`EditProductForm`.
- **Notification SMS/WhatsApp en complément de l'email** — argument de poids pour convaincre un transporteur marocain habitué au SMS plutôt qu'à l'email (façon Jumia).
- **Vérification photo de la condition du produit** avant mise en ligne — rassure un futur partenaire transporteur sur le sérieux du contrôle qualité.

**Could have (utile une fois un partenaire signé, pas avant) :**
- Traduire les modales de configuration des sociétés de livraison (API/mappings de statuts).
- Traduire le paragraphe dynamique "Business Insights" du dashboard vendeur.
- Construire une vraie modélisation warehouse (table dédiée, capacité, plusieurs entrepôts par partenaire).
- **Vente par lot/palette** (façon B-Stock/Liquidation.com/BULQ).
- **Avis/notation vendeur et transporteur** — le champ `seller_rating` existe déjà dans le code mais aucune interface ne permet de laisser un avis.
- **Export de rapports pour les vendeurs** — utile une fois qu'il y a du volume réel.

**Won't have (pas avant qu'un vrai transporteur soit partenaire) :**
- Intégration API réelle d'un transporteur — littéralement impossible avant qu'un partenaire signe, puisqu'on n'a pas accès à leur API.
- Automatisation du suivi de livraison par webhook transporteur — dépend du point ci-dessus.
- Application mobile — décidé de reporter, pas de date fixée.

## En attente de décision
- ~~Aucune société de livraison de test (`Test Delivery Co`) ne doit traîner en base, surtout avant une démo à un partenaire potentiel.~~ Fait, voir plus bas.
- ~~Domaine pour Resend (`dealtock.ma` ou équivalent) : pas encore acheté.~~ Fait, voir plus bas.
- Brancher `dealtock.ma` comme domaine du site lui-même (pas seulement pour les emails) : nécessite l'accès au compte Vercel pour ajouter le domaine dans Settings → Domains, pas encore disponible.

## Nettoyage des données de test (préparation démo)

**Contexte précisé :** l'État marocain n'a pas seulement approuvé le projet, il a aussi **investi** dans Dealtock. Le local et le matériel sont déjà acquis. Le site doit être présentable pour convaincre de vraies sociétés de livraison de devenir partenaires — d'où le besoin de nettoyer ce qui ressemble à du test/bricolage avant toute démo.

**Vérification de `delivery_companies` :** 6 lignes en base. Amana, DHL, Sendit, EcoDelivery sont des exemples avec des clés API factices (`your-amana-secret`...) mais portent de **vrais noms de transporteurs existants** — décision prise de les garder tels quels (ce sont des exemples internes, pas exposés publiquement comme partenariats signés). `Test Delivery Co` et `BENEXPEDITION` étaient de vrais placeholders à supprimer.

**Suppression en pratique :** `Test Delivery Co` avait 14 commandes (`orders.delivery_company_id`) et des lignes `escrow_holdings` qui pointaient directement vers elle (colonne `NOT NULL`, donc impossible de juste supprimer la société sans casser ces lignes). Réassigné ces 14 commandes + les `escrow_holdings` correspondants vers Amana, puis supprimé `Test Delivery Co` et `BENEXPEDITION` (qui n'avait aucune commande liée). Base de données plus propre pour une démo.

**Produits "TEST"/"TEST2" :** 8 produits factices trouvés (créés en testant l'import "Produits retournés" et le dashboard Warehouse). 3 avaient des commandes réelles liées (Watch ×2, Speaker ×1, Backpack ×1) — renommés en retirant le préfixe TEST plutôt que supprimés, pour ne pas casser ces commandes. Les 5 autres, sans commande liée, ont été supprimés directement (la première tentative de DELETE n'avait visiblement rien fait, relancée pour confirmer la suppression réelle).

## Vérification du flux de commande de bout en bout

**Bug critique trouvé en auditant le flux commande → approbation → livraison → facture :** `seller_mark_ready()` (RPC appelée quand le vendeur marque une commande "prête pour enlèvement") écrivait le statut `'ready'`, alors que tout le reste de l'app (`SellerOrders.jsx`, `MyOrders.jsx`, `DropshipperOrders.jsx`, `DropshipperDashboard.jsx`, `StatusMappingTab.jsx`) utilise `'ready_for_pickup'`. Et `DeliveryDashboard.jsx` (l'écran où le transporteur voit ses commandes à livrer) filtrait justement sur `'ready'`/`'picked'` au lieu de `'ready_for_pickup'`/`'picked_up'`. Conséquence concrète : une commande marquée prête par le vendeur n'apparaissait **jamais** chez le transporteur — silencieusement, sans erreur visible. Pas de contrainte CHECK sur `orders.status` pour l'attraper non plus (colonne texte libre). Corrigé : nouvelle migration qui recrée `seller_mark_ready()` avec `'ready_for_pickup'`, et `DeliveryDashboard.jsx` mis à jour pour filtrer/transiter sur les bons noms de statut partout (requête, stats, badges, boutons d'action).

**Repéré en testant en direct :** la modale "Edit Product" (bouton crayon sur la page Produits du vendeur) n'avait aucune classe `dark:` — formulaire entièrement blanc même en mode sombre, alors que le cadre de la modale autour était bien stylé. `EditProductForm.jsx` n'avait jamais reçu de passe dark mode. Corrigé : sections, labels, champs (texte, nombre, select, textarea, checkbox), aperçu de prix marketplace, aperçu d'image, et boutons d'action — tout en dark mode maintenant.

**Bug critique : toutes les commissions affichées à 0,00 MAD.** Repéré en testant la page Produits du vendeur — colonne "Commission (MAD)" et "Commission Rate" à 0 pour tous les produits, y compris les vrais (iPad, PlayStation 5...). Cause : `commission_rules` a été conçue avec des paliers de prix (0–1000 MAD → 10%, 1000–3000 → 7%, etc.), toutes ces lignes ayant `category = null` et `is_default = true` — il peut donc y avoir **plusieurs** lignes `is_default = true` pour un même `applies_to` (une par palier). Le code (`SellerDashboard.jsx`, `marketplaceQueries.js`, `ProductDetailModal.jsx`) supposait à tort qu'il n'existait qu'**une seule** règle par défaut et utilisait `.maybeSingle()`, qui échoue silencieusement dès qu'il y a plusieurs résultats. La requête "règle par catégorie" ne matchait jamais non plus puisque `category` est toujours `null` en base. Résultat : taux de commission toujours à 0 pour les vendeurs, et des valeurs de repli incohérentes avec les vrais paliers pour les clients/dropshippers. Corrigé dans les 3 fichiers : on récupère désormais toutes les règles actives d'un coup et on cherche en mémoire la règle (catégorie puis défaut) dont la tranche de prix (`min_amount`/`max_amount`) contient le prix du produit — `useMarketplaceProducts.js` et `useCart.jsx` faisaient déjà ça correctement, ils ont servi de modèle.

**Test en direct du flux complet, jusqu'au dashboard transporteur.** Pour vérifier le correctif `ready_for_pickup`/`picked_up`, il a fallu un compte société de livraison fonctionnel — aucun n'existait. Tentative de création directe en SQL (`INSERT INTO auth.users`) : a échoué avec `500 Database error querying schema` à la connexion, malgré un hash de mot de passe correct (`extensions.crypt`/`gen_salt('bf')`) — il manquait la ligne correspondante dans `auth.identities`, que GoTrue exige même pour l'auth email/mot de passe classique. Même après l'avoir ajoutée, l'erreur 500 persistait pour une raison non identifiée. Abandonné cette approche au profit de la méthode fiable : inscription normale via `/signup` (le même chemin que pour tous les autres comptes du site), puis confirmation d'email forcée par SQL (`email_confirmed_at = NOW()`, l'email étant fictif) et passage du rôle en `delivery` manuellement. Compte de test créé : `operations@amana.ma` (réutilise l'email déjà présent dans `delivery_companies`, donc reconnu automatiquement par `DeliveryDashboard.jsx`).

**Bug supplémentaire trouvé une fois connecté :** `DeliveryDashboard.jsx` lisait/écrivait des colonnes `delivery_picked_at` et `delivery_confirmed_at` qui n'existent pas dans `orders` — les vraies colonnes sont `picked_up_at` et `delivered_at`. Corrigé partout dans le fichier (requête, mapping d'affichage, mise à jour de statut).

**Dernier bug, le plus sournois : le statut "Delivered" revenait tout seul à "Ready for Pickup" après ~10 secondes.** En apparence l'action marchait (toast de succès, badge vert "Delivered" affiché), mais `updated_at` en base montrait une date d'il y a plusieurs jours — l'UPDATE n'avait en réalité jamais été écrit. Cause : `orders` n'avait des policies RLS UPDATE que pour seller/dropshipper/admin, **aucune pour le rôle `delivery`**. Une UPDATE filtrée par RLS ne renvoie pas d'erreur côté Supabase, elle réussit silencieusement en modifiant 0 ligne — d'où le faux succès suivi du "retour en arrière" au prochain rechargement (l'abonnement temps réel refetch la vraie valeur, jamais changée). Corrigé par une nouvelle policy `orders_update_delivery` qui autorise la mise à jour quand la commande est assignée à la société de livraison du compte connecté (jointure `profiles.email = delivery_companies.email`, le même principe que `DeliveryDashboard.jsx` utilise déjà pour retrouver sa société).

**Le flux complet a été testé en direct de bout en bout avec succès, jusqu'à la facture :** vendeur approuve → marque prêt pour enlèvement → la commande apparaît chez le transporteur → Pick Up → en transit → livré (statut qui tient cette fois) → **facture générée automatiquement** par le trigger existant (`INV-060576WXTI0` créée à l'instant de la livraison).

## Domaine `dealtock.ma` configuré sur Resend

Le domaine `dealtock.ma` a été acheté (chez NindoHost, valable jusqu'au 26/06/2028). Ajout du domaine dans Resend, puis configuration des 4 enregistrements DNS dans la "Zone DNS" NindoHost (qui n'existait pas encore, il a fallu la créer) : `TXT resend._domainkey` (DKIM), `MX send` + `TXT send` (SPF, pour l'envoi), `TXT _dmarc` (DMARC). Domaine vérifié côté Resend en quelques minutes. Mise à jour de `send_order_confirmation_email()` pour utiliser `commandes@dealtock.ma` comme expéditeur au lieu de l'adresse de test `onboarding@resend.dev` (qui ne pouvait envoyer qu'au propriétaire du compte Resend). Testé en plaçant une commande réelle : l'email arrive bien, depuis la bonne adresse, à un destinataire externe — **le dernier point Must-have de la liste de préparation à la démo est coché.**

**Brancher `dealtock.ma` sur le site lui-même** (pas seulement les emails) nécessite l'accès au compte Vercel — pas encore disponible, mis en attente.

## Bugs trouvés en créant un vrai compte client de test

**"Unauthorized role" à la connexion.** En testant l'inscription publique (`/signup`) pour avoir un compte client normal (adresse postale, wishlist, panier), la page après connexion affichait juste "Unauthorized role:" — écran blanc. Cause : `create_profile_for_users()` (le trigger qui crée une ligne `profiles` à l'inscription) ne fixe aucun rôle, donc un client normal a `role` vide. Mais `login.jsx` redirigeait *tout* le monde vers `/dashboard`, et `Dashboard.jsx` n'avait aucun cas pour un rôle vide/`customer` — seulement admin/seller/dropshipper/delivery/warehouse. Un compte client ordinaire ne pouvait donc jamais se connecter correctement. Corrigé : `signIn()` (dans `SupabaseAuthContext.jsx`) renvoie maintenant le profil chargé, `login.jsx` redirige vers `/dashboard` seulement si le rôle fait partie de la liste des rôles "métier", sinon vers l'accueil. `Dashboard.jsx` redirige aussi vers l'accueil par défaut au lieu d'afficher un message d'erreur, en filet de sécurité.

**Bug plus grave : le panier perdait tout son contenu.** En testant avec ce nouveau compte client, le panier affichait "vide" après avoir ajouté 4 produits. Cause trouvée en comparant le code à la vraie structure de la table : `useCart.jsx` traitait `user_carts` comme **une seule ligne par utilisateur avec une colonne JSON `items`** — mais cette colonne n'a jamais existé. La vraie table est normalisée : une ligne par produit (`user_id`, `product_id`, `quantity`). Chaque sauvegarde de panier pour un utilisateur connecté échouait donc silencieusement depuis le début (erreur attrapée et juste loguée en console, jamais remontée à l'écran) — le panier ne fonctionnait en réalité **que pour les invités** (stockage local du navigateur), jamais pour un compte connecté. Corrigé : ajout d'une contrainte unique `(user_id, product_id)` (nécessaire pour pouvoir faire un upsert propre), puis réécriture complète de `loadCart`/`saveCart` dans `useCart.jsx` pour lire/écrire ligne par ligne au lieu d'un blob JSON, et mise à jour de la synchronisation temps réel qui supposait la même structure inexistante.

**Deux complications pour valider le correctif :** (1) le serveur de dev local s'était arrêté entre deux sessions de test, donnant l'impression que le lien de confirmation d'email était cassé — juste besoin de le relancer. (2) Après avoir ajouté la contrainte unique, l'upsert échouait encore avec "no unique or exclusion constraint matching the ON CONFLICT specification" alors que la contrainte existait bien en base (`pg_constraint` le confirmait) — le cache de schéma de PostgREST (la couche API de Supabase) n'avait pas encore vu le changement. Résolu avec `NOTIFY pgrst, 'reload schema';`. Testé en direct : produits ajoutés au panier, persistés en base (`user_carts`), toujours présents après rechargement de la page.

**Favicon corrigé.** L'onglet du navigateur affichait encore le logo par défaut de Vite. Le vrai logo Dealtock n'existait que sous forme d'URL externe (`i.ibb.co`, utilisée dans `Navbar.jsx`/`login.jsx`) — téléchargé en local (`public/favicon.png`) et branché dans `index.html`.

## Idée à construire plus tard : import automatique de produits depuis Telegram

Les fournisseurs chinois envoient déjà photos + infos en texte libre sur Telegram, pas de format structuré. Objectif : qu'un produit se crée automatiquement sur Dealtock à partir de ces messages, sans ressaisie manuelle. Plan retenu : bot Telegram (via @BotFather) → Edge Function Supabase qui reçoit chaque message en webhook → appel à un modèle IA avec vision pour extraire nom/catégorie/prix depuis la photo + texte → insertion automatique dans `products`, mais avec un statut "à valider" non visible publiquement par sécurité (le "full auto" porte sur la création de la fiche, pas sur sa publication immédiate, pour éviter qu'une mauvaise extraction de l'IA ne s'affiche en pleine démo). Pas commencé — besoin du token du bot Telegram avant de démarrer. Reporté à une session ultérieure.

## Mise en ligne réelle : merge vers production + déploiements bloqués sur Vercel

Accès au compte Vercel obtenu. Ajout de `dealtock.ma` dans Vercel (Settings → Domains), ajout des 2 enregistrements DNS demandés (`A @ → 216.198.79.1`, `CNAME www → e97c67ce742d5002.vercel-dns-017.com.`) dans la Zone DNS NindoHost — configuration validée côté Vercel.

**Merge de `design/bordereau-identity` vers `pre-enhancement-backup`** (branche de production, ~80 commits d'écart) pour que tout le travail des dernières semaines (i18n, dark mode, corrections de bugs, domaine, etc.) apparaisse enfin sur le site en ligne. Merge propre, sans conflit, poussé.

**Découverte en allant vérifier le déploiement : tous les déploiements Vercel étaient bloqués, depuis le tout début, sur toutes les branches.** Message exact : *"The deployment was blocked because the commit author did not have contributing access to the project on Vercel. The Hobby Plan does not support collaboration for private repositories."* Le compte Vercel est en plan gratuit (Hobby), le dépôt GitHub est privé, et les commits poussés depuis ce compte ne sont pas reconnus comme ayant un accès "contributeur" sur le projet Vercel — donc strictement aucun déploiement n'a jamais réellement publié les changements depuis le début du projet. Ça expliquait le décalage perçu entre le code et le site en ligne.

**Solution retenue (gratuite) : rendre le dépôt GitHub public.** La restriction Hobby ne s'applique qu'aux dépôts privés. Avant de basculer, scan de tout l'historique git à la recherche de secrets committés par erreur : trouvé une ancienne clé API Resend (`re_01K20SR6...`) dans les tout premiers commits, antérieurs à ce travail — vérifié sur le dashboard Resend, cette clé n'existe plus dans la liste des clés actives, donc pas de risque réel. Les 2 clés Supabase trouvées sont des clés `anon` (publiques par conception, protégées par les policies RLS). Bascule en public à faire par l'associé directement sur GitHub (Settings → Danger Zone → Change repository visibility), pas de droits admin disponibles sur ce dépôt depuis ce compte pour le faire autrement.

## Géolocalisation automatique du widget "Deliver to"

Le widget "Deliver to / Morocco" dans la navbar était purement décoratif (texte statique, pas de logique). Rendu interactif : au premier chargement, demande la position GPS du navigateur et calcule la ville marocaine la plus proche (12 villes avec coordonnées approximatives, distance Haversine — pas besoin d'API de géocodage payante), affiche cette ville et la mémorise (`localStorage`). Si la géolocalisation est refusée ou indisponible, le widget reste cliquable pour choisir une ville manuellement dans une liste déroulante. Branché sur le même état `city` qui filtre déjà le marketplace par ville.

**Oubli notable :** premier essai de ce correctif jamais réellement déployé — committé seulement en local, jamais poussé sur GitHub. Repéré en allant vérifier pourquoi la fonctionnalité n'apparaissait pas en ligne après la mise en prod (voir section suivante). Corrigé en committant/poussant pour de vrai.

## Migration de l'hébergement : Vercel (Hobby, bloqué) → VPS NindoHost déjà payé

Accès au compte Vercel obtenu, domaine `dealtock.ma` ajouté dans Vercel (Settings → Domains), DNS configuré chez NindoHost (`A @ → 216.198.79.1`, `CNAME www → e97c67ce742d5002.vercel-dns-017.com.`). Merge de `design/bordereau-identity` vers `pre-enhancement-backup` (branche de production) pour publier ~80 commits de travail accumulé.

**Découverte : tous les déploiements Vercel sont bloqués depuis le tout début, sur toutes les branches.** Message exact : *"The deployment was blocked because the commit author did not have contributing access to the project on Vercel. The Hobby Plan does not support collaboration for private repositories."* Le compte Vercel est en plan gratuit, le dépôt GitHub privé — donc aucun déploiement n'a jamais réellement publié quoi que ce soit depuis le début du projet, peu importe le nombre de push. Ça explique le décalage perçu entre le code et le site en ligne depuis le début.

**Décision : plutôt que de rendre le dépôt public ou payer Vercel Pro, migrer l'hébergement vers le VPS NindoHost déjà payé** (Ubuntu 24.04, 4 vCPU, 8 Go RAM, à Nuremberg) — celui-ci ne servait jusque-là qu'à l'agent de backup Acronis, totalement libre sinon. Stack installée : Nginx (serveur web), Node.js 20 (pour builder), Certbot (SSL Let's Encrypt). Le dépôt étant resté privé, clonage initial avec un token GitHub temporaire, immédiatement retiré du remote après coup pour ne pas le laisser traîner sur le serveur. Build Vite (`npm run build`) servi en statique par Nginx avec fallback SPA (`try_files ... /index.html`) pour que les routes React Router fonctionnent en rechargement direct. Bascule DNS de `dealtock.ma`/`www` vers l'IP du VPS (propagation quasi immédiate), certificat SSL obtenu et déployé automatiquement par Certbot avec redirection HTTP→HTTPS et renouvellement automatique configuré. Site vérifié en `https://dealtock.ma` et `https://www.dealtock.ma`, code 200, certificat valide.

**Processus de redéploiement pour la suite (pas encore automatisé) :** sur le VPS, `cd /var/www/dealtock && git pull ... && npm run build` — Nginx sert directement le dossier `dist/` donc aucun redémarrage de service n'est nécessaire après un build. Le `git pull` nécessite un token tant que le dépôt reste privé (réinjecté à chaque fois pour l'instant, pas stocké en permanence sur le serveur).

## Parcours de candidature "Devenir vendeur / société de livraison" (façon Amazon/AliExpress)

Constat : aucun moyen pour un vendeur ou une société de livraison de s'auto-inscrire — l'inscription publique ne donne qu'un rôle client vide, et la modale admin "Add Delivery Partner" ne crée qu'une config API, jamais un vrai compte de connexion. Toute attribution de rôle se faisait à la main par SQL (comme pour le compte de test Amana). Construit un vrai parcours :

- **Nouvelle table `role_requests`** (migration `20260628100000_role_requests.sql`) : `user_id`, `requested_role` (seller/delivery), `company_name`, `phone`, `message`, `status` (pending/approved/rejected). RLS : un utilisateur ne voit/crée que sa propre demande, seul un admin peut lire toutes les demandes et les faire évoluer.
- **`SignUpForm.jsx`** : ajout d'un sélecteur "Je m'inscris en tant que : Client / Vendeur / Société de livraison". Pour client (par défaut), rien ne change. Pour vendeur/livraison, des champs apparaissent (nom d'entreprise obligatoire, téléphone, message libre) et une demande est soumise — **le rôle n'est jamais accordé directement à l'inscription**, volontairement, pour ne pas laisser n'importe qui s'auto-déclarer vendeur ou société de livraison sans validation.
- **RPC `approve_role_request`** : vérifie que l'appelant est admin, passe `profiles.role` au rôle demandé, et pour une société de livraison crée automatiquement la ligne `delivery_companies` correspondante (avec le même email que le profil, pour que `DeliveryDashboard.jsx` la retrouve immédiatement sans configuration manuelle). **RPC `reject_role_request`** : marque la demande refusée avec un motif optionnel.
- **Nouvel onglet admin "Candidatures"** (`RoleRequestsSection.jsx`) : liste les demandes en attente avec nom d'entreprise, email, téléphone, message, et boutons Valider/Refuser. Badge avec le nombre de demandes en attente sur l'onglet, même principe que les autres badges existants (factures, produits retournés).

Traductions ajoutées dans les 3 langues. Déployé sur le VPS.

**Bug trouvé en testant la candidature vendeur jusqu'au bout :** la soumission de la demande échouait avec `new row violates row-level security policy for table "role_requests"`. Cause : juste après `supabase.auth.signUp()`, tant que l'email n'est pas confirmé, il n'y a **aucune session active** — `auth.uid()` est vide, donc la policy RLS `auth.uid() = user_id` bloque systématiquement l'insertion. Corrigé avec une nouvelle RPC `submit_role_request()` (`SECURITY DEFINER`, contourne le besoin de session active, valide juste que l'utilisateur existe) appelée depuis `SignUpForm.jsx` à la place de l'insert direct.

**Rappel utile :** le cache mémoire de l'API Supabase (PostgREST) peut nécessiter `NOTIFY pgrst, 'reload schema';` après un changement de structure — déjà vu plus tôt dans la session, revérifié ici. Aussi croisé la limite d'envoi d'email gratuite de Supabase (`email rate limit exceeded`) en testant l'inscription plusieurs fois de suite — argument de plus pour brancher Resend en SMTP personnalisé (pas encore fait).

## Renommage du VPS et bug de persistance du hostname (cloud-init)

Le panel client NindoHost affichait "Server: server.sesa.ma" alors que le nom voulu est lié à "ATLAUCUS". Vérification : le hostname Linux réel était déjà correctement `atlaucus`, seul `/etc/hosts` gardait une entrée `127.0.1.1 server.sesa.ma server` issue d'une image par défaut. Corrigé une première fois à la main, mais **ce correctif ne survivait pas à un redémarrage** : le VPS utilise cloud-init avec `manage_etc_hosts` actif, qui régénère `/etc/hosts` depuis un template à chaque boot. Fix permanent : ajout de `manage_etc_hosts: false` dans `/etc/cloud/cloud.cfg`, puis re-fixation du hostname et de `/etc/hosts`. Testé avec un redémarrage complet du serveur (qui avait justement des mises à jour en attente) — le hostname `atlaucus` a bien survécu cette fois. Reste un point purement cosmétique : l'étiquette "server.sesa.ma" affichée dans l'interface client NindoHost elle-même ne dépend pas du serveur et nécessite un ticket support pour être renommée (ticket déjà ouvert côté client).

## Bug majeur trouvé : impossible d'ajouter un produit depuis le site, depuis le début

En testant le parcours vendeur de bout en bout (création de compte → ajout de produit), `AddProductForm.jsx`/`EditProductForm.jsx` échouaient systématiquement avec `new row for relation "products" violates check constraint "products_condition_check"`. Cause : les formulaires envoient `condition` sous la forme `'new'` / `'opened_like_new'` / `'damaged'`, mais la contrainte CHECK en base n'autorisait que `'A'`/`'B'`/`'C'`/`'D'` (un ancien système de notation par lettre). **Les 38 produits existants en base avaient tous été insérés par un autre moyen que le formulaire** (import/seed direct) — personne n'avait donc jamais réussi à ajouter un produit via l'interface depuis sa création.

Complication découverte en cours de correction : `'A'` n'est pas qu'un vestige, une autre contrainte (`products_returned_sealed_only`) exige `condition = 'A'` spécifiquement pour les produits **retournés/scellés** (`source_type = 'returned'`, le badge "Sealed" du marketplace). Sur les 38 lignes en `'A'`, seulement 3 étaient réellement des retours scellés, les 35 autres étaient de simples produits "neufs" mal catégorisés par l'ancien système. Migration finale : suppression de l'ancienne contrainte (il fallait le faire *avant* la mise à jour des données, pas après — la contrainte encore active pendant l'`UPDATE` bloquait l'écriture de `'new'`), conversion des 35 produits non-retournés vers `'new'`, conservation de `'A'` pour les 3 retours scellés, et nouvelle contrainte autorisant `['new', 'opened_like_new', 'damaged', 'A']`.

**Deuxième bug trouvé juste après, en testant l'ajout pour de vrai :** une fois la contrainte corrigée, le produit s'ajoutait bien, mais l'écran affichait `fetchProducts is not defined`. `SellerDashboard.jsx` appelait une fonction `fetchProducts()` qui n'a jamais existé dans ce fichier — la vraie fonction de rafraîchissement s'appelle `fetchDashboardData()`. Corrigé aux 2 endroits concernés (ajout et modification de produit).

---

### 14. Refonte mobile complète (style Amazon/AliExpress)

**Problème de départ :** Le site n'était pas utilisable sur téléphone (Oppo Reno 4, iPhone 17). Menu burger invisible pour les non-connectés, stats en 1 colonne qui prennent toute la page, pas de navigation bas, tableaux illisibles sur petit écran.

**Ce qu'on a fait :**

- **Burger menu** : bouton désormais visible pour tous les utilisateurs (y compris non-connectés). Le sidebar affiche "Marketplace" et "Connexion" pour les visiteurs, "Mes commandes" pour les clients connectés, les liens dashboard pour vendeurs/admins.
- **Barre de navigation bas** (`src/components/BottomNav.jsx`) : fixée en bas de l'écran sur mobile (cachée sur lg+). Contient Accueil / Panier (avec badge) / Commandes (clients) ou Dashboard (vendeurs/admins) / Compte. Style identique à Amazon/AliExpress.
- **Smart scroll navbar** : la navbar se masque automatiquement en scrollant vers le bas (libère de l'espace écran) et réapparaît dès qu'on scrolle vers le haut, même d'un pixel. Implémenté via un `useEffect` scroll listener avec seuil de 4px et `translate-y` CSS.
- **App.jsx** : suppression du `pl-16` inutile qui décalait tout le contenu de 64px sur mobile. Ajout de `pb-14 lg:pb-0` pour laisser la place à la bottom nav.
- **Marketplace ProductCard** : image réduite (`h-36 sm:h-44`), nom du produit sur 2 lignes (`line-clamp-2`), prix en rouge Amazon (`#B12704`), boutons "Voir détails" et "Ajouter" côte-à-côte (texte lisible, pas juste des icônes).
- **AdminDashboard OverviewSection** : stats en `grid-cols-2 lg:grid-cols-3` (avant : 1 colonne sur mobile), titre compact (`text-base sm:text-2xl`), cartes plus denses sur mobile.
- **DeliveryDashboard** : stats en `grid-cols-2 lg:grid-cols-4`, header réduit (`text-xl sm:text-3xl`), et surtout **vue en cartes sur mobile** (liste `sm:hidden`) au lieu du tableau qui scrollait horizontalement. Le tableau reste sur desktop (`hidden sm:block`). Les boutons d'action sont pleine largeur et bien tactiles.
- **SellerDashboard** : `StatCard` plus dense sur mobile (`p-3 sm:p-5`, `text-base sm:text-2xl`), 2ème grille de métriques en `grid-cols-2` sur mobile.
- **CartPage** : padding réduit sur mobile (`px-3 py-4 sm:px-4 sm:py-8`), titre plus compact.
- **SignUpForm** : padding `p-4 sm:p-8`, arrondi `rounded-xl`.

**Déploiement :** build local + `scp -r dist/ root@138.199.196.209:/var/www/dealtock/` depuis hotspot mobile (le WiFi école bloque SSH port 22).

### 15. Correction de 3 bugs GitHub (issues #2, #3, #4)

**Problème :** 4 bugs signalés sur GitHub. Le #1 (dark mode reset password) était déjà résolu. On a corrigé les 3 autres.

**Bug #4 — Lien Marketplace en double dans le menu latéral**
- **Cause :** Le lien `/marketplace` était déclaré deux fois : une fois codé en dur dans le sidebar (ligne 619, visible pour tous), et une seconde fois dans le tableau `sidebarNavItems` avec `roles: ['seller', 'admin', 'dropshipper']`. Les vendeurs et admins voyaient donc "Marketplace" deux fois.
- **Fix :** Suppression de l'entrée `/marketplace` dans `sidebarNavItems` (`src/components/Navbar.jsx`). Le lien hardcodé reste — il couvre tous les cas.

**Bug #2 — Prix B2C sur la marketplace → prix B2B dans le panier**
- **Cause :** La fonction `getRoleBasedPrice` dans `useCart.jsx` utilisait `sale_price` en priorité pour les clients. Or `sale_price` dans la base de données est souvent identique à `purchase_price` (prix d'achat B2B, sans marge). La marketplace elle calcule `purchase_price × commission (30%)` — d'où un écart visible.
- **Fix :** Suppression du raccourci `sale_price` pour les clients. `getRoleBasedPrice` calcule désormais toujours le prix B2C depuis `purchase_price × commission`, aligné sur la logique de `getPriceForRole` dans `useMarketplaceProducts.js`.

**Bug #3 — Frais de livraison affichés à 0 MAD sur la page de confirmation**
- **Cause :** Si les règles dans la table `delivery_fee_rules` ont `base_fee = 0` ou si aucune règle ne correspond à la ville, le calcul pouvait renvoyer `0` au lieu du fallback de 30 MAD.
- **Fix :** Dans `OrderConfirmation.jsx`, après le calcul, on applique un plancher : `fee > 0 ? fee : 30`. Les frais ne peuvent plus afficher 0 MAD si une ville est sélectionnée et une société de livraison choisie.
