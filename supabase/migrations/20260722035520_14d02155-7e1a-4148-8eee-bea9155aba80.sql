create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role public.app_role not null,
    unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view their own roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role can manage roles"
  on public.user_roles
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Policies for products: public read, admin write
-- Keep existing public SELECT policy working with the new rules

drop policy if exists "Products are viewable by everyone" on public.products;

create policy "Products are viewable by everyone"
  on public.products
  for select
  to public
  using (true);

create policy "Admins can insert products"
  on public.products
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update products"
  on public.products
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete products"
  on public.products
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Add/update grants for products
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

-- Update orders policies to use authenticated users for reads (optional admin read)
drop policy if exists "Anyone can create an order" on public.orders;

create policy "Anyone can create an order"
  on public.orders
  for insert
  to public
  with check (true);

create policy "Admins can view orders"
  on public.orders
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

grant select on public.orders to authenticated;
grant insert on public.orders to anon;
grant insert on public.orders to authenticated;
grant all on public.orders to service_role;