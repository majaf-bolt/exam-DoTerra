-- doTERRA Shop — initial schema, RLS, and auth trigger

-- ---------------------------------------------------------------------------
-- Tables (profiles first, then all others)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  address text,
  city text,
  customer_tag text not null default 'new',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  category text,
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  total_price numeric(10, 2) not null check (total_price >= 0),
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
  ),
  seller_note text,
  shipping_phone text,
  shipping_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now()
);

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  note text not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.order_status_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  old_status text,
  new_status text not null,
  note text,
  changed_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_orders_user_id on public.orders (user_id);
create index idx_orders_status on public.orders (status);
create index idx_order_items_order_id on public.order_items (order_id);
create index idx_order_items_product_id on public.order_items (product_id);
create index idx_customer_notes_customer_id on public.customer_notes (customer_id);
create index idx_order_status_log_order_id on public.order_status_log (order_id);

-- ---------------------------------------------------------------------------
-- Helper: is_admin() (after profiles table exists)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Trigger: auto-create profile on auth.users insert
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customer_notes enable row level security;
alter table public.order_status_log enable row level security;

-- profiles: users manage own row, admins manage all
create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own_or_admin"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles_delete_admin"
  on public.profiles
  for delete
  to authenticated
  using (public.is_admin());

-- products: SELECT all, INSERT/UPDATE/DELETE admin only
create policy "products_select_all"
  on public.products
  for select
  to anon, authenticated
  using (true);

create policy "products_insert_admin"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

create policy "products_update_admin"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_delete_admin"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

-- orders: users own rows, admin all
create policy "orders_select_own_or_admin"
  on public.orders
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "orders_insert_own"
  on public.orders
  for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "orders_update_own_or_admin"
  on public.orders
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "orders_delete_admin"
  on public.orders
  for delete
  to authenticated
  using (public.is_admin());

-- order_items: users access items for their orders, admin all
create policy "order_items_select_own_or_admin"
  on public.order_items
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

create policy "order_items_insert_own_or_admin"
  on public.order_items
  for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

create policy "order_items_update_admin"
  on public.order_items
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_items_delete_admin"
  on public.order_items
  for delete
  to authenticated
  using (public.is_admin());

-- customer_notes: admin only
create policy "customer_notes_select_admin"
  on public.customer_notes
  for select
  to authenticated
  using (public.is_admin());

create policy "customer_notes_insert_admin"
  on public.customer_notes
  for insert
  to authenticated
  with check (public.is_admin());

create policy "customer_notes_update_admin"
  on public.customer_notes
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "customer_notes_delete_admin"
  on public.customer_notes
  for delete
  to authenticated
  using (public.is_admin());

-- order_status_log: admin only
create policy "order_status_log_select_admin"
  on public.order_status_log
  for select
  to authenticated
  using (public.is_admin());

create policy "order_status_log_insert_admin"
  on public.order_status_log
  for insert
  to authenticated
  with check (public.is_admin());

create policy "order_status_log_update_admin"
  on public.order_status_log
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_status_log_delete_admin"
  on public.order_status_log
  for delete
  to authenticated
  using (public.is_admin());
