# doTERRA Shop

A full-stack single-page application for browsing and purchasing doTERRA essential oils, blends, and creams. Built as a SoftUni exam project with a customer storefront, shopping cart, user profiles, and an admin CRM panel.

The UI is in Bulgarian. The app uses client-side routing, Supabase for auth and data, and Netlify for production hosting.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Seed data](#seed-data)
- [Available scripts](#available-scripts)
- [Sample accounts](#sample-accounts)
- [Routes](#routes)
- [Database schema](#database-schema)
- [Product catalog](#product-catalog)
- [Netlify deployment](#netlify-deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

### Customer (public & authenticated)

- **Home page** — hero section, category cards, featured products from Supabase
- **Products** — filter by category (oils, blends, creams), search, sort, product cards with skeleton loaders
- **Product details** — full description, price, stock, add to cart, related products
- **Authentication** — register, login, logout via Supabase Auth (Bootstrap tabs)
- **Profile** — edit name, phone, address, city; upload avatar to Supabase Storage
- **Cart** — `localStorage`-based cart, quantity controls, shipping calculation (free over 100 лв, otherwise 8 лв), checkout creates an order in Supabase
- **Order history** — view past orders in profile accordion

### Admin (`admin@doterra.com`)

- **Products** — CRUD table with create/edit/delete modals
- **Orders** — status updates (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`), seller notes, expandable line items
- **Customers (CRM)** — list with avatar, search/filter, customer tags (`new`, `vip`, `regular`), private notes, order history per customer

### Security

- Row Level Security (RLS) on all Supabase tables
- Route guards for protected (`/profile`, `/cart`) and admin-only (`/admin`) pages
- `is_admin()` Postgres function for admin policies
- Auto-created `profiles` row on user sign-up via database trigger

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript (ES modules), Bootstrap 5 |
| Build tool | Vite 8 |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Hosting | Netlify |
| Package manager | npm |

**Node.js requirement:** `>= 20.19.0` (Vite 8). Use Node 22 for Netlify builds (configured in `netlify.toml` and `.nvmrc`).

---

## Project structure

```
exam-DoTerra/
├── index.html                 # App entry point
├── netlify.toml               # Netlify build & SPA redirect config
├── .nvmrc                     # Node version for Netlify
├── .env.example               # Environment variable template
├── package.json
├── vite.config.js
│
├── src/
│   ├── main.js                # Router, auth init, layout shell
│   ├── styles/main.css        # Global styles
│   │
│   ├── pages/                 # One folder per page (.html, .js, .css)
│   │   ├── home/
│   │   ├── products/
│   │   ├── product-details/
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── cart/
│   │   └── admin/
│   │
│   ├── components/            # Reusable UI (header, footer, modal, toast)
│   ├── services/              # Supabase API layer (auth, products, orders, cart, customers)
│   └── utils/                 # Router, helpers, auth guards
│
├── scripts/
│   └── seed.js                # Demo users, products, orders, notes
│
└── supabase/migrations/       # SQL migrations (run manually in Supabase SQL Editor)
    ├── 001_initial_schema.sql
    ├── 002_avatars_storage.sql
    ├── 003_profiles_email.sql
    ├── 003_product_images.sql
    ├── 004_admin_rls_policies.sql
    ├── 005_backfill_profiles.sql
    └── 006_product_images.sql
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ (22 recommended)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) project (free tier is sufficient)
- (Optional) A [Netlify](https://www.netlify.com/) account for deployment

---

## Local setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd exam-DoTerra
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials (see [Environment variables](#environment-variables)).

### 3. Set up the database

Open your Supabase project → **SQL Editor** and run each migration file **in order**:

| # | File | Purpose |
|---|------|---------|
| 1 | `001_initial_schema.sql` | Tables, indexes, RLS policies, `is_admin()`, auth trigger |
| 2 | `002_avatars_storage.sql` | `avatars` storage bucket and upload policies |
| 3 | `003_profiles_email.sql` | Adds `email` column to `profiles` |
| 4 | `003_product_images.sql` | Sets doTERRA placeholder images on all products |
| 5 | `004_admin_rls_policies.sql` | Admin SELECT policies, `is_admin()` fix |
| 6 | `005_backfill_profiles.sql` | Backfills missing profiles from `auth.users` |

> **Note:** `006_product_images.sql` is an older duplicate — use `003_product_images.sql` instead.

### 4. Seed demo data (recommended)

```bash
npm run seed
```

This creates demo users, 12 products, sample orders, and admin notes. Safe to re-run after clearing tables.

### 5. Start development server

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

---

## Environment variables

Copy `.env.example` to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

| Variable | Required | Used by | Description |
|----------|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Yes | App (`src/services/supabase.js`) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | App | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_KEY` | Local only | `npm run seed` | Service role key — bypasses RLS. **Never expose in the frontend or Netlify.** |

Find keys in Supabase → **Project Settings → API**.

---

## Database setup

All schema changes live in `supabase/migrations/`. There is no Supabase CLI linked to this repo — apply SQL manually in the Supabase SQL Editor.

After running migrations, verify in **Table Editor** that these tables exist:

- `profiles`
- `products`
- `orders`
- `order_items`
- `customer_notes`
- `order_status_log`

Also check **Storage** for the `avatars` bucket.

---

## Seed data

```bash
npm run seed
```

The seed script (`scripts/seed.js`) uses the service role key to:

1. Create or update two users (`demo@doterra.com`, `admin@doterra.com`)
2. Upsert matching `profiles` rows (role, customer tag, contact info)
3. Insert 12 products across 3 categories
4. Create sample orders with line items for the demo user
5. Add private admin notes on the demo customer

**Clear existing seed data** (optional, in SQL Editor) before re-seeding:

```sql
truncate public.order_status_log, public.order_items, public.customer_notes, public.orders, public.products cascade;
```

Then delete users in **Authentication → Users** if you need a clean re-seed.

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run seed` | Populate Supabase with demo data |

---

## Sample accounts

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `demo@doterra.com` | `demo123` | Customer | VIP tag, has order history |
| `admin@doterra.com` | `admin123` | Admin | Full admin panel access |

Run `npm run seed` if these accounts are missing.

---

## Routes

| Path | Access | Page |
|------|--------|------|
| `/` | Public | Home — categories & featured products |
| `/products` | Public | Product catalog with filters |
| `/products/:id` | Public | Product details |
| `/auth` | Public | Login / Register |
| `/profile` | Authenticated | User profile & orders |
| `/cart` | Authenticated | Shopping cart & checkout |
| `/admin` | Admin only | Products, orders, CRM |

Unauthenticated users hitting protected routes are redirected to `/auth`. Non-admins hitting `/admin` are redirected to `/`.

---

## Database schema

### `profiles`

Extends Supabase Auth users with app-specific data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | FK → `auth.users` |
| `full_name` | `text` | Display name |
| `email` | `text` | User email |
| `avatar_url` | `text` | Supabase Storage URL |
| `phone` | `text` | Phone number |
| `address` | `text` | Street address |
| `city` | `text` | City |
| `customer_tag` | `text` | `new` / `vip` / `regular` |
| `role` | `text` | `user` / `admin` |

### `products`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Product name |
| `description` | `text` | Product description |
| `price` | `numeric` | Price in BGN (лв) |
| `category` | `text` | `oils` / `blends` / `creams` / `other` |
| `image_url` | `text` | Product image URL |
| `stock` | `integer` | Available quantity |

### `orders`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → `profiles` |
| `total_price` | `numeric` | Order total |
| `status` | `text` | `pending` / `confirmed` / `shipped` / `delivered` / `cancelled` |
| `seller_note` | `text` | Admin-only note |
| `shipping_phone` | `text` | Shipping phone |
| `shipping_address` | `text` | Shipping address |

### `order_items`

| Column | Type | Description |
|--------|------|-------------|
| `order_id` | `uuid` | FK → `orders` |
| `product_id` | `uuid` | FK → `products` |
| `quantity` | `integer` | Item quantity |
| `price` | `numeric` | Price at time of order |

### `customer_notes`

Private admin notes on customers.

| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | `uuid` | FK → `profiles` |
| `note` | `text` | Note content |
| `created_by` | `uuid` | FK → `profiles` (admin) |

### `order_status_log`

Audit trail for order status changes.

| Column | Type | Description |
|--------|------|-------------|
| `order_id` | `uuid` | FK → `orders` |
| `old_status` | `text` | Previous status |
| `new_status` | `text` | New status |
| `changed_by` | `uuid` | FK → `profiles` |

---

## Product catalog

12 seeded products across three categories:

| Category | Products |
|----------|----------|
| **Масла (oils)** | Лавандула, Мента, Лимон, Чаено дърво |
| **Смеси (blends)** | Deep Blue, On Guard, Balance, Breathe |
| **Кремове (creams)** | Deep Blue Rub, HD Clear, Correct-X, Immortelle |

All products use the doTERRA placeholder image:

```
https://placehold.co/400x400/198754/white?text=doTERRA
```

---

## Netlify deployment

### 1. Push to GitHub

Ensure `node_modules/` and `dist/` are **not** committed (they are in `.gitignore`).

### 2. Create a Netlify site

Connect your GitHub repo. Build settings are read automatically from `netlify.toml`:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | `22` |
| SPA redirect | `/*` → `/index.html` (200) |

### 3. Set environment variables

In **Site settings → Environment variables**, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do **not** add `SUPABASE_SERVICE_KEY` to Netlify.

### 4. Deploy

Push to `main` or trigger a manual deploy. After a successful build, all client-side routes work (e.g. `/products`, `/admin`).

---

## Troubleshooting

### Build failed on Netlify (exit code 2)

- Vite 8 requires **Node 20.19+**. This project pins Node 22 via `netlify.toml` and `.nvmrc`.
- Make sure `node_modules/` and `dist/` are not in git — Netlify must install fresh Linux dependencies.

### App loads but shows no data / auth fails

- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Netlify environment variables.
- Trigger a new deploy after adding env vars (Vite bakes them in at build time).

### Admin panel shows empty lists

- Run migration `004_admin_rls_policies.sql` if not applied.
- Log in as `admin@doterra.com`.

### Profile shows "Guest User"

- Run `npm run seed` or migration `005_backfill_profiles.sql`.
- Ensure you are logged in (not using stub data).

### Seed script fails

- Verify `.env` has `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
- New Supabase secret keys (`sb_secret_...`) are supported — the seed script extracts the embedded JWT automatically.

### Product images broken

- Run `003_product_images.sql` in the Supabase SQL Editor to reset all images to the doTERRA placeholder.

---

## License

This project was created as a SoftUni exam assignment.
