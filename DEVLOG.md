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

## En attente de décision
- Aucune société de livraison (`delivery_companies`) n'existe en base staging — une a été créée manuellement ("Test Delivery Co") uniquement pour permettre les tests, à nettoyer/remplacer par de vraies données plus tard.
- Vérifier le rôle du compte de l'associé pour l'erreur "access denied" sur les règles de commission (voir point 29).
- Warehouse MVP en place (pas de table dédiée — réutilise `products.user_id` + rôle `warehouse`). Une vraie modélisation (table `warehouses`, capacité, plusieurs entrepôts par partenaire...) pourra être envisagée plus tard si besoin.
- Automatisation du suivi de livraison (webhook transporteur) : à construire quand un vrai partenaire transporteur sera intégré, pas avant.
