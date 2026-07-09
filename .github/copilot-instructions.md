# doTERRA Shop Copilot Instructions

## Project Stack and Scope
- Build and maintain this app with Node.js, npm, and Vite.
- Use vanilla JavaScript only (no React, no TypeScript).
- Keep the app as a client-side rendered SPA with `index.html` shell and `<div id="app"></div>`.

## UI and Styling Rules
- Use Bootstrap 5 components and utilities from npm.
- Do not build custom UI widgets from scratch when Bootstrap already provides an equivalent component.
- Keep styling aligned with the green doTERRA theme, with primary color `#198754`.
- Prefer Bootstrap classes first; add custom CSS only when needed.

## Routing Rules
- Use client-side routing with History API.
- Maintain these routes:
  - `/`
  - `/products`
  - `/products/:id`
  - `/auth`
  - `/profile`
  - `/cart`
  - `/admin`

## Auth and Guard Rules
- Protect user routes with `requireAuth()`, redirecting unauthenticated users to `/auth`.
- Protect admin routes with `requireAdmin()`, redirecting unauthorized users to `/`.
- Keep auth logic in service/utility modules, not duplicated across pages.

## Data and Supabase Rules
- Expected database tables:
  - `profiles`
  - `products`
  - `orders`
  - `order_items`
  - `customer_notes`
  - `order_status_log`
- Enforce Row Level Security (RLS) on all Supabase tables.
- Do not suggest disabling RLS; write policies that explicitly allow required access paths.

## Architecture Preferences
- Keep page modules under `src/pages/<name>/` with separate `.html`, `.js`, and `.css`.
- Keep reusable UI in `src/components/`.
- Keep business/data logic in `src/services/`.
- Keep router and shared guards/helpers in `src/utils/`.
- Favor small, focused modules and clear import boundaries.
