# Boutique informatique (Next.js + Supabase)

Boutique e-commerce avec espace administrateur, pensée pour les revendeurs d'équipements informatiques au Burkina Faso (FCFA, Mobile Money, paiement à la livraison, WhatsApp).

Voir aussi : `docs/CAHIER_DES_CHARGES.md` et `docs/STRATEGIE_DE_VENTE.md`.

## Fonctionnalités

- Boutique : accueil, catalogue avec filtres (marque, tri, recherche), fiche produit avec caractéristiques, panier, commande sans compte, commande WhatsApp.
- Admin (`/auth` puis `/admin`) : tableau de bord (ventes semaine/mois, marge, commandes en cours, stock bas), produits (créer, modifier, supprimer, images, étiquettes), catégories, commandes (valider, livrer, annuler avec gestion du stock), offres avec compte à rebours, clients et promotions WhatsApp.
- Sécurité : RLS Supabase, prix d'achat privé, prix et stock recalculés côté base.

## Installation (en local)

Prérequis : Node.js 18+ et un compte Supabase (gratuit).

```bash
npm install
cp .env.example .env.local   # puis remplissez les valeurs
npm run dev
```

## Mise en place de Supabase

1. Créez un projet sur supabase.com.
2. **SQL Editor** → New query → collez tout `supabase/schema.sql` → Run.
3. **Authentication → Users → Add user** : créez le compte admin (e-mail + mot de passe).
4. Dans **SQL Editor**, exécutez `supabase/admin-roles.sql` pour appliquer les rôles et les permissions.
5. Vérifiez l'adresse dans `supabase/grant-admin.sql`, puis exécutez ce script dans SQL Editor pour attribuer le rôle `super_admin` au compte principal.
6. **Project Settings → API** : copiez l'URL du projet et la clé `anon public` dans `.env.local`.
7. Pour gérer des comptes depuis `/admin/utilisateurs`, ajoutez aussi `SUPABASE_SERVICE_ROLE_KEY` à `.env.local` en copiant la clé `service_role`/`secret` depuis **Project Settings → API**. Elle doit rester côté serveur : ne la préfixez jamais par `NEXT_PUBLIC_` et ne la commitez jamais. Redémarrez `npm run dev` après l'avoir ajoutée.
8. Facultatif : **Authentication → Providers → Email** : désactivez « Allow new users to sign up » pour que personne d'autre ne puisse créer de compte.

### Rôles d'administration

- **Super administrateur** : toutes les pages et gestion des comptes.
- **Gestionnaire** : produits, catégories, offres, commandes et clients, sans gestion des comptes.
- **Catalogue** : produits et catégories uniquement.
- **Commandes** : tableau de bord, commandes et clients.

Les permissions sont contrôlées dans l'interface et par les politiques RLS. `/admin/utilisateurs` permet au super administrateur de créer un compte Auth avec un mot de passe temporaire, de changer le rôle, d'exporter la liste en CSV et de supprimer un compte Auth. Aucun e-mail d'invitation n'est envoyé automatiquement : transmettez le mot de passe au destinataire par un canal privé. Le dernier super administrateur et le compte actuellement connecté ne peuvent pas être supprimés ou rétrogradés.

Pour une base existante : exécutez une fois `supabase/admin-roles.sql`, puis `supabase/grant-admin.sql` pour promouvoir le compte principal en super administrateur.

> Sur l'offre gratuite, Supabase met un projet en pause après une semaine d'inactivité. Pour un client payant, vérifiez l'activité régulière ou passez à l'offre Pro.

## Tester avec des données de démonstration

L'application lancée sur `localhost` utilise le projet Supabase indiqué par `NEXT_PUBLIC_SUPABASE_URL` dans `.env`. Cela peut être un projet distant : vérifiez dans le tableau de bord Supabase que c'est bien votre projet de développement avant d'ajouter des données.

1. Dans **Supabase → SQL Editor**, exécutez `supabase/seed-demo.sql`. Ce script ajoute des produits fictifs, leurs catégories, des coûts de démonstration et une offre. Il peut être relancé sans créer de doublons. Ne l'exécutez pas sur la base de production.
2. Créez votre utilisateur de test dans **Authentication → Users** (ou utilisez le compte de test déjà créé).
3. Configurez `SUPABASE_SERVICE_ROLE_KEY` comme décrit ci-dessus pour activer la gestion des comptes.
4. Connectez-vous sur `http://localhost:3000/auth`, puis testez la gestion du catalogue sur `/admin/produits`.

L'accès admin est associé à l'utilisateur Auth par son UUID dans `admins`; `grant-admin.sql` retrouve le compte par son adresse e-mail. Pour un compte admin déjà créé, réutilisez son adresse Auth existante.

## Déploiement sur Vercel

1. Poussez le dossier sur GitHub.
2. Vercel → Add New → Project → importez le dépôt (framework Next.js détecté).
3. Dans **Environment Variables**, ajoutez les variables publiques de `.env.example` et `SUPABASE_SERVICE_ROLE_KEY` comme variable serveur privée (sans préfixe `NEXT_PUBLIC_`).
4. Deploy. Plus tard : Settings → Domains pour brancher le nom de domaine du client.

## Un client = un déploiement

Pour chaque nouveau client : nouveau projet Supabase, `schema.sql`, compte admin, nouveau projet Vercel avec ses variables (nom, WhatsApp, ville, texte de livraison). Le code reste identique.

## Structure

```
app/(shop)/         boutique publique (accueil, categorie, produit, panier, privacy)
app/auth/           connexion administrateur
app/admin/          tableau de bord, produits, commandes, catégories, offres, clients, utilisateurs
components/         composants de la boutique et de l'admin
lib/                config, accès aux données, client Supabase, types
supabase/schema.sql tables, vues, fonctions, politiques de sécurité, stockage
supabase/admin-roles.sql migration des rôles et permissions
```

## Points à connaître

- Les pages publiques sont mises en cache 60 s : une modification admin apparaît au plus tard après une minute.
- Les frais de livraison ne sont pas enregistrés dans la commande : ils sont annoncés par texte et confirmés avec le client.
- L'envoi de promotions passe par des liens WhatsApp pré-remplis (un clic par contact). L'envoi de masse automatique demande l'API WhatsApp Business.
- Les comptes créés par l'administration reçoivent un mot de passe temporaire que le super administrateur doit transmettre de façon sécurisée.
