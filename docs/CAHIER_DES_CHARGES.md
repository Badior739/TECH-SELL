# Cahier des charges — Boutique en ligne pour revendeurs d'équipements informatiques

Version 1.0 · Stack : Next.js 14 (App Router) + Supabase + Tailwind · Hébergement : Vercel
Marché cible : Burkina Faso (FCFA, Mobile Money, paiement à la livraison, WhatsApp)

---

## 1. Objectif

Fournir à un commerçant d'équipements informatiques (ordinateurs, écrans, périphériques, réseau, consommables) :

1. une **vitrine e-commerce** rapide, claire et rassurante pour ses clients ;
2. un **espace d'administration** simple pour gérer seul son catalogue, ses commandes, ses promotions et ses clients ;
3. un **canal de vente WhatsApp** intégré, car c'est là que se concluent la majorité des ventes locales.

Principe de commercialisation : **un seul code source, un déploiement par client**, personnalisé par variables d'environnement (nom, logo, numéro WhatsApp, ville, texte de livraison). Modèle par abonnement.

## 2. Utilisateurs

| Rôle | Description | Accès |
|---|---|---|
| Visiteur / client | Navigue, commande sans créer de compte | Boutique publique |
| Administrateur (commerçant) | Gère tout | `/auth` puis `/admin` |

Un seul rôle admin en v1 (table `admins`). Évolution possible : rôle « employé » sans accès aux marges.

## 3. Parcours client (boutique publique)

### 3.1 Pages
- **Accueil** : bandeau livraison, recherche, catégories, bannière d'offre avec compte à rebours (si offre active), bloc Promos, Nouveautés, Meilleures ventes, bloc « Entreprise / devis en gros », rassurance, inscription aux promos WhatsApp.
- **Catalogue** `/categorie/[slug]` (et `/categorie/tous`) : filtres par marque, recherche texte, tri (prix, nouveautés), badges sur chaque produit.
- **Fiche produit** `/produit/[id]` : galerie d'images, prix (avec remise éventuelle), stock, garantie, tableau de caractéristiques techniques, ajout au panier, bouton « Commander via WhatsApp », produits similaires.
- **Panier et commande** `/panier` : quantités modifiables, formulaire (nom, téléphone, quartier/adresse, ville, note), choix du paiement (à la livraison / Mobile Money), confirmation avec numéro de commande et message WhatsApp pré-rempli.
- **Confidentialité** `/privacy`.

### 3.2 Règles métier
- Pas de compte client en v1 : le téléphone est l'identifiant naturel.
- Le **prix et le stock sont revérifiés côté serveur** à la création de la commande (jamais confiance au navigateur).
- Une commande est créée au statut `nouvelle`. Le stock n'est décrémenté qu'à la **validation** par l'admin.
- Les numéros de clients passés commande ou inscrits sont ajoutés à la liste de diffusion (désinscription possible via l'admin).
- Étiquettes affichées : Promo (auto si remise active), Best-seller, Nouveau, Recommandé, Rupture.
- Remise = meilleure offre active (par catégorie ou sur tout le catalogue), calculée par la base de données.

## 4. Espace administrateur

Accès par e-mail + mot de passe (Supabase Auth). Seuls les utilisateurs présents dans `admins` passent la porte ; la sécurité réelle est assurée par les politiques RLS de la base, pas seulement par l'interface.

### 4.1 Tableau de bord
- Ventes du mois et de la semaine (commandes validées/livrées).
- Marge estimée du mois (prix de vente − prix d'achat).
- Commandes en attente de validation (compteur cliquable).
- Graphique des ventes sur 7 jours.
- Top 5 produits du mois.
- Alertes de stock bas (≤ 3 unités).

### 4.2 Produits (CRUD)
Créer, modifier, supprimer, activer/désactiver. Champs : nom, marque, catégorie, prix de vente, prix d'achat (privé), stock, garantie (mois), description, caractéristiques (paires clé/valeur libres : RAM, CPU, stockage...), étiquettes, images multiples (envoi vers Supabase Storage).

### 4.3 Catégories
CRUD avec nom, identifiant d'URL, icône (emoji), ordre d'affichage.

### 4.4 Commandes
Liste filtrable par statut (nouvelle, validée, livrée, annulée). Détail : client, contact direct (appel et WhatsApp), lignes, total. Actions : **valider** (décrémente le stock), **marquer livrée**, **annuler** (restitue le stock si déjà validée). Message WhatsApp pré-rempli au client.

### 4.4bis Statuts
`nouvelle → validee → livree`, avec `annulee` possible à tout moment.

### 4.5 Offres et promotions
Créer une offre : titre, pourcentage, portée (tout le catalogue ou une catégorie), date de début, date de fin, actif/inactif. Raccourcis : « 24 h », « Fin de semaine ». Le compte à rebours s'affiche automatiquement sur l'accueil pour l'offre qui se termine en premier, et le prix remisé s'applique partout, y compris dans la commande.

### 4.6 Clients et diffusion de promotions
Liste des numéros collectés. Composition d'un message (modèles prêts à l'emploi, reprise d'une offre active) puis envoi un à un via WhatsApp (lien pré-rempli), avec suivi « envoyé » dans la session, et copie de tous les numéros. *Envoi automatique de masse* : nécessite l'API WhatsApp Business (payante, validation Meta) ; prévu en option v2.

## 5. Exigences non fonctionnelles

- **Mobile d'abord** : la majorité des clients naviguent sur téléphone, connexion limitée. Pages légères, images compressées, rendu serveur.
- **Sécurité** : RLS sur toutes les tables, prix d'achat inaccessible au public, création de commande par fonction serveur, aucune clé secrète côté navigateur.
- **Performance** : pages publiques mises en cache (revalidation 60 s).
- **SEO** : balises titre/description par page, rendu serveur.
- **Coût** : démarre sur les offres gratuites de Vercel et Supabase.
- **Maintenance** : un code, plusieurs clients ; configuration par variables d'environnement.

## 6. Améliorations par rapport au site d'origine

1. Fiches techniques structurées (indispensable en informatique) et filtres par marque.
2. Gestion du stock avec alertes et décrémentation automatique à la validation.
3. Prix d'achat et marge dans le tableau de bord.
4. Remises calculées côté base : un seul prix de vérité, impossible à falsifier depuis le navigateur.
5. Commande rapide par WhatsApp avec panier pré-rempli.
6. Bloc « entreprise » pour demandes de devis en gros (cible : écoles, ONG, administrations, cybercafés).

## 7. Évolutions possibles (v2)

- Paiement Mobile Money automatisé (agrégateur local), facture PDF, numéros de série et garantie.
- Envoi de promotions par l'API WhatsApp Business ou SMS.
- Comptes clients, historique, liste de souhaits.
- Multi-boutiques dans une seule base (vrai SaaS multi-locataire).
- Import de catalogue par fichier Excel/CSV.

## 8. Livrables

Code source complet, script SQL d'initialisation, guide d'installation et de déploiement, stratégie de vente (voir `STRATEGIE_DE_VENTE.md`).
