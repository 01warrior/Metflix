# StreamVibe

> Plateforme de streaming d'agrégation — Films, Séries, Anime & Manga en VOSTFR

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Bun](https://img.shields.io/badge/Bun-1.3-F9F1E0?logo=bun)

---

## Installation locale

### Prérequis

- [Bun](https://bun.sh/) (v1.3+)
- Un compte [TMDB](https://www.themoviedb.org/) (gratuit) pour obtenir une clé API

### 1. Cloner et installer

```bash
git clone <url-du-repo>
cd streamvibe
bun install
```

### 2. Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Base de données SQLite
DATABASE_URL=file:./db/custom.db

# TMDB API (obtenir sur https://www.themoviedb.org/settings/api)
TMDB_API_KEY=votre_cle_api_ici
TMDB_READ_ACCESS_TOKEN=votre_bearer_token_ici
```

**Comment obtenir les clés TMDB :**
1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/)
2. Aller dans **Settings > API**
3. Demander une clé API (gratuit, approbation instantanée)
4. Copier l'**API Key** (v3) et le **Read Access Token** (v4 Bearer)

### 3. Initialiser la base de données

```bash
# Créer le dossier db s'il n'existe pas
mkdir -p db

# Pousser le schéma Prisma dans SQLite
bun run db:push

# (Optionnel) Peupler avec des données de démo
bun run prisma db seed
```

### 4. Lancer le serveur de développement

```bash
bun run dev
```

L'application est accessible sur **http://localhost:3000**

---

## Architecture

```
streamvibe/
├── .env                          # Variables d'environnement (clés API, DB)
├── .env.local                    # (alternative) Surcharge locale
│
├── db/
│   └── custom.db                 # Base de données SQLite (contenu + embeds)
│
├── prisma/
│   ├── schema.prisma             # Schéma de la base de données
│   └── seed.ts                   # Script de peuplement initial
│
├── public/
│   ├── logo.png                  # Logo StreamVibe
│   ├── logo.svg                  # Logo SVG (favicon)
│   └── robots.txt                # SEO robots
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Layout racine (html lang="fr", font Nunito, dark mode)
│   │   ├── globals.css           # Styles globaux Tailwind
│   │   ├── page.tsx              # Page principale (TOUT le frontend est ici)
│   │   │
│   │   └── api/                  # Routes API (backend)
│   │       ├── content/
│   │       │   ├── route.ts      # GET /api/content — Liste avec filtres (genre, type, tri)
│   │       │   ├── [id]/route.ts # GET /api/content/:id — Détail + embeds groupés
│   │       │   ├── random/route.ts
│   │       │   └── favorites/route.ts
│   │       ├── embeds/
│   │       │   └── regenerate/route.ts  # POST — Régénère tous les embeds
│   │       ├── providers/route.ts       # GET — Health-check de tous les providers
│   │       ├── featured/route.ts        # GET — Contenu mis en avant
│   │       ├── categories/route.ts      # GET — Catégories
│   │       ├── search/route.ts          # GET — Recherche texte
│   │       ├── tmdb/
│   │       │   ├── sync/route.ts        # POST — Sync depuis TMDB (trending/popular/top)
│   │       │   ├── search/route.ts      # GET — Recherche TMDB
│   │       │   ├── videos/route.ts      # GET — Bandes-annonces
│   │       │   └── fix-images/route.ts  # POST — Réparer les images cassées
│   │       ├── anime/
│   │       │   ├── sync/route.ts        # POST — Sync depuis AniList
│   │       │   ├── match-tmdb/route.ts  # POST — Associer anime AniList → TMDB
│   │       │   ├── reset/route.ts       # DELETE — Reset anime
│   │       │   └── stats/route.ts       # GET — Stats anime
│   │       └── manga/
│   │           ├── search/route.ts      # GET — Recherche MangaDex
│   │           ├── chapters/route.ts    # GET — Chapitres d'un manga
│   │           ├── pages/route.ts       # GET — Pages d'un chapitre
│   │           └── proxy/route.ts       # GET — Proxy images MangaDex
│   │
│   ├── components/ui/              # Composants shadcn/ui (30+ composants)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   │
│   ├── lib/                       # Logique métier et utilitaires
│   │   ├── db.ts                  # Client Prisma (SQLite)
│   │   ├── tmdb.ts                # Client TMDB API complet (v3+v4)
│   │   ├── anilist.ts             # Client AniList GraphQL
│   │   ├── embed-providers.ts     # Registre centralisé des 11 serveurs d'embed
│   │   ├── icons.tsx              # Wrapper icônes (HugeIcons)
│   │   ├── content-utils.ts       # Helpers URLs posters/backdrops
│   │   ├── utils.ts               # Utilitaires généraux (cn, etc.)
│   │   └── anime-tmdb-mapping.ts  # Mapping anime AniList ↔ TMDB
│   │
│   ├── store/
│   │   └── app-store.ts           # State global Zustand
│   │
│   └── hooks/
│       ├── use-toast.ts           # Hook toast notifications
│       └── use-mobile.ts          # Hook détection mobile
│
├── Caddyfile                      # Configuration reverse proxy Caddy
├── next.config.ts                 # Config Next.js (output: standalone)
├── tailwind.config.ts             # Config Tailwind CSS 4
├── package.json
└── bun.lock
```

---

## Base de données

**Engine :** SQLite via Prisma ORM
**Fichier :** `db/custom.db` — **base de données locale, fichier unique à la racine du projet**
**Schéma :** `prisma/schema.prisma`

> La base est un simple fichier SQLite stocké dans le dossier `db/`. Pas de serveur externe, pas de Docker, pas de configuration réseau. Le fichier est créé automatiquement au premier `bun run db:push`. Pour backup : copier `db/custom.db`. Pour reset : `bun run db:reset`.

### Tables

| Table | Rôle |
|-------|------|
| `Content` | Films, séries, anime, manga (titre, poster, note, genres, etc.) |
| `EmbedSource` | URLs d'embed pour chaque serveur/épisode/saison |
| `Category` | Catégories de contenu (ex: Tendances, Action, etc.) |
| `ContentCategory` | Relation many-to-many Content ↔ Category |

### Contenu actuel

| Type | Quantité | Source |
|------|----------|--------|
| Films | ~400+ | TMDB API (trending, popular, top rated) |
| Séries | ~400+ | TMDB API |
| Anime | ~300+ | AniList GraphQL + mapping TMDB |
| Manga | ~10+ | MangaDex API |
| **Embeds** | **~46 600** | Auto-générés depuis 11 providers |

---

## Serveurs d'embed (providers)

**Fichier de config :** `src/lib/embed-providers.ts`

11 serveurs actifs — tous basés sur TMDB (pas besoin d'upload de vidéos) :

| Provider | Domaine | Qualité | Note |
|----------|---------|---------|------|
| VidSrc PM | vidsrc.pm | 1080p | Fiable |
| VidSrc IN | vidsrc.in | 1080p | Ads Cloudflare |
| VidSrc Dev | vidsrc.dev | 1080p | Rapide, clean |
| VidSrc IO | vidsrc.io | 1080p | Stable |
| Embed.su | embed.su | 1080p | Sélecteur d'épisodes intégré |
| SmashyStream | embed.smashystream.com | 1080p | Redirige vers AnyEmbed |
| AnyEmbed | anyembed.xyz | 1080p | URL hyphenée |
| VidSrc Pro | vidsrc.pro | 1080p | Redirect → embed.su |
| VidSrc ME | vidsrcme.ru | 1080p | Domaine .ru |
| VidCore | vidcore.org | 1080p | HLS, sous-titres |
| VidLink | vidlink.pro | 1080p | Pas de /embed/ dans l'URL |

### Ajouter/retirer un provider

1. Éditer **uniquement** `src/lib/embed-providers.ts`
2. Tester le domaine : `curl -sI "https://DOMAIN/embed/movie/550" | head -1`
3. Régénérer les embeds : `curl -X POST http://localhost:3000/api/embeds/regenerate`

---

## API Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/content` | Liste contenu (filtres: type, genre, year, sort) |
| `GET` | `/api/content/:id` | Détail contenu + embeds groupés par saison/épisode |
| `GET` | `/api/content/random` | Contenu aléatoire |
| `GET/POST/DELETE` | `/api/content/favorites` | Favoris (stockés en localStorage) |
| `GET` | `/api/featured` | Contenu mis en avant (carousel) |
| `GET` | `/api/categories` | Catégories |
| `GET` | `/api/search` | Recherche texte |
| `GET` | `/api/providers` | Health-check des 11 serveurs |
| `POST` | `/api/embeds/regenerate` | Régénère tous les embeds dans la DB |
| `POST` | `/api/tmdb/sync` | Sync contenu depuis TMDB |
| `GET` | `/api/tmdb/search` | Recherche TMDB |
| `GET` | `/api/tmdb/videos` | Bandes-annonces YouTube |
| `POST` | `/api/anime/sync` | Sync anime depuis AniList |
| `POST` | `/api/anime/match-tmdb` | Associer anime → TMDB |
| `GET` | `/api/manga/search` | Recherche manga MangaDex |
| `GET` | `/api/manga/chapters` | Chapitres d'un manga |
| `GET` | `/api/manga/pages` | Pages d'un chapitre |

---

## Stack technique

| Catégorie | Technologie |
|-----------|-------------|
| **Framework** | Next.js 16 (App Router) |
| **Langage** | TypeScript 5 |
| **Runtime** | Bun |
| **Base de données** | SQLite + Prisma ORM |
| **UI** | shadcn/ui (New York style) + Tailwind CSS 4 |
| **Icônes** | HugeIcons (via wrapper `src/lib/icons.tsx`) |
| **Animations** | Framer Motion |
| **State client** | Zustand |
| **Police** | Nunito (Google Fonts) |
| **Thème** | Dark mode par défaut, support light via next-themes |

---

## Fonctionnalités

- **Catalogue** : Films, Séries, Anime, Manga
- **11 serveurs de streaming** par contenu (switch instantané)
- **Layout Netflix** pour les séries (épisodes à droite, dropdown saison)
- **Recherche** en temps réel
- **Filtres** par type, genre, année, tri
- **Favoris** (localStorage)
- **Carousel** de mise en avant
- **Lecteur manga** intégré (chapitres MangaDex en français)
- **Bandes-annonces** YouTube dans les modals
- **Panneau admin** (sync TMDB, sync AniList, gestion featured)
- **Mode sombre** par défaut
- **Responsive** (mobile + desktop)
- **Informations légales** (modal dans le footer)
- **Navigation mobile** (bottom nav + sheet menu)

---

## Scripts utiles

```bash
bun run dev          # Serveur de développement (port 3000)
bun run lint         # ESLint
bun run db:push      # Pousser le schéma Prisma dans SQLite
bun run db:generate  # Régénérer le client Prisma
bun run db:reset     # Reset la DB (supprime tout)
```

---

## Déploiement

### Build production

```bash
bun run build
bun run start
```

Le build génère un dossier `.next/standalone/` autonome.

### Variables d'environnement en production

Ne pas oublier de set les mêmes variables `.env` sur le serveur :
- `DATABASE_URL`
- `TMDB_API_KEY`
- `TMDB_READ_ACCESS_TOKEN`

### Reverse proxy

Un `Caddyfile` est inclus pour le routing multi-ports (gateway).