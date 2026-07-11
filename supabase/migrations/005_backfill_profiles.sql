-- Backfill missing profiles for auth users created before the trigger existed

alter table public.profiles
  add column if not exists email text;

insert into public.profiles (id, full_name, email, role, customer_tag)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.email),
  u.email,
  'user',
  'new'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Ensure seeded admin account has admin role
update public.profiles
set
  role = 'admin',
  full_name = coalesce(full_name, 'Admin User'),
  email = coalesce(email, 'admin@doterra.com'),
  phone = coalesce(phone, '+359 888 333 444'),
  address = coalesce(address, 'бул. България 100'),
  city = coalesce(city, 'София'),
  updated_at = now()
where email = 'admin@doterra.com';

-- Ensure seeded demo account has user role and VIP tag
update public.profiles
set
  role = 'user',
  customer_tag = 'vip',
  full_name = coalesce(full_name, 'Demo User'),
  email = coalesce(email, 'demo@doterra.com'),
  phone = coalesce(phone, '+359 888 111 222'),
  address = coalesce(address, 'ул. Витоша 12'),
  city = coalesce(city, 'София'),
  updated_at = now()
where email = 'demo@doterra.com';
