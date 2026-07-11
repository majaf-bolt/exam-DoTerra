# doTERRA Shop

Single-page web shop for doTERRA essential oils, blends, and creams. Built as a SoftUni exam project with customer browsing, cart/checkout, profile management, and an admin panel.

## Tech stack

- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5
- **Build tool:** Vite
- **Backend / database:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Hosting:** Netlify

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase project URL, anon key, and service role key.

3. Apply database migrations in the Supabase SQL Editor (in order):

   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_avatars_storage.sql`
   - `supabase/migrations/003_profiles_email.sql`
   - `supabase/migrations/003_product_images.sql`
   - `supabase/migrations/004_admin_rls_policies.sql`
   - `supabase/migrations/005_backfill_profiles.sql`

4. (Optional) Seed demo data:

   ```bash
   npm run seed
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

   The app opens at `http://localhost:5173`.

## Sample accounts

| Email | Password | Role |
|-------|----------|------|
| `demo@doterra.com` | `demo123` | Customer (VIP tag) |
| `admin@doterra.com` | `admin123` | Admin |

Run `npm run seed` if these accounts are not present yet.

## Database tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (name, avatar, address, role, customer tag) |
| `products` | Product catalog (name, price, category, image, stock) |
| `orders` | Customer orders (total, status, shipping, seller notes) |
| `order_items` | Line items per order (product, quantity, price) |
| `customer_notes` | Private admin notes on customers |
| `order_status_log` | Audit log of order status changes |

Supabase Auth (`auth.users`) is used for login; a trigger auto-creates a matching `profiles` row on sign-up.

## Netlify deploy

1. Push the repository to GitHub (or connect your Git provider to Netlify).

2. In Netlify, create a new site from the repo.

3. Build settings are read from `netlify.toml`:

   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **SPA redirect:** `/*` → `/index.html` (200)

4. Add environment variables in **Site settings → Environment variables**:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   `SUPABASE_SERVICE_KEY` is only needed locally for `npm run seed` and is not required on Netlify.

5. Deploy the site. After deploy, client-side routing works on all paths (e.g. `/products`, `/admin`).

### Deploy troubleshooting

- **Build failed (exit code 2):** This project uses Vite 8, which requires **Node 20.19+**. `netlify.toml` and `.nvmrc` pin Node 22 for Netlify builds.
- **Do not commit `node_modules/` or `dist/`** — Netlify installs dependencies and builds on Linux; Windows binaries in git will break the build.
- **Blank app after deploy:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify environment variables, then trigger a new deploy.
