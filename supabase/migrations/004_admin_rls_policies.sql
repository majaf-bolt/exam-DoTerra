-- Fix admin RLS: ensure is_admin() works and admins can read all required data

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.role = 'admin'
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- profiles: admin can read all profiles
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- orders: admin can read all orders
drop policy if exists "orders_select_admin_all" on public.orders;
create policy "orders_select_admin_all"
  on public.orders
  for select
  to authenticated
  using (public.is_admin());

-- order_items: admin can read all order items
drop policy if exists "order_items_select_admin_all" on public.order_items;
create policy "order_items_select_admin_all"
  on public.order_items
  for select
  to authenticated
  using (public.is_admin());

-- customer_notes: admin can read all notes
drop policy if exists "customer_notes_select_admin_all" on public.customer_notes;
create policy "customer_notes_select_admin_all"
  on public.customer_notes
  for select
  to authenticated
  using (public.is_admin());

-- order_status_log: admin can read all logs
drop policy if exists "order_status_log_select_admin_all" on public.order_status_log;
create policy "order_status_log_select_admin_all"
  on public.order_status_log
  for select
  to authenticated
  using (public.is_admin());
