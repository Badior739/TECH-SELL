-- Migration des droits d'administration multi-roles.
-- A executer dans Supabase SQL Editor apres le schema.sql existant.

alter table public.admins
  add column if not exists role text not null default 'manager';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admins_role_check'
      and conrelid = 'public.admins'::regclass
  ) then
    alter table public.admins
      add constraint admins_role_check
      check (role in ('super_admin', 'manager', 'catalog', 'orders'));
  end if;
end
$$;

alter table public.admins enable row level security;

drop policy if exists "admins: lire sa propre ligne" on public.admins;
create policy "admins: lire sa propre ligne" on public.admins
  for select using (user_id = auth.uid());

create or replace function public.has_admin_role(allowed_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_admin_role(array['super_admin', 'manager', 'catalog', 'orders']);
$$;

create or replace function public.set_admin_role(p_actor_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  if not exists (
    select 1 from public.admins
    where user_id = p_actor_id and role = 'super_admin'
  ) then
    raise exception 'Seul un super administrateur peut gérer les rôles.';
  end if;
  if p_role not in ('super_admin', 'manager', 'catalog', 'orders') then
    raise exception 'Niveau d’accès invalide.';
  end if;

  perform pg_advisory_xact_lock(hashtext('admins-super-admin-count')::bigint);

  select role into current_role
  from public.admins
  where user_id = p_user_id
  for update;
  if not found then
    raise exception 'Compte administrateur introuvable.';
  end if;

  if current_role = 'super_admin' and p_role <> 'super_admin'
     and (select count(*) from public.admins where role = 'super_admin') <= 1 then
    raise exception 'Impossible de rétrograder le dernier super administrateur.';
  end if;
  if p_actor_id = p_user_id and p_role <> 'super_admin' then
    raise exception 'Vous ne pouvez pas réduire votre propre niveau d’accès.';
  end if;

  update public.admins set role = p_role where user_id = p_user_id;
end;
$$;

create or replace function public.remove_admin_role(p_actor_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
begin
  if not exists (
    select 1 from public.admins
    where user_id = p_actor_id and role = 'super_admin'
  ) then
    raise exception 'Seul un super administrateur peut gérer les rôles.';
  end if;
  if p_actor_id = p_user_id then
    raise exception 'Vous ne pouvez pas révoquer votre propre accès.';
  end if;

  perform pg_advisory_xact_lock(hashtext('admins-super-admin-count')::bigint);

  select role into target_role
  from public.admins
  where user_id = p_user_id
  for update;
  if not found then
    raise exception 'Compte administrateur introuvable.';
  end if;
  if target_role = 'super_admin'
     and (select count(*) from public.admins where role = 'super_admin') <= 1 then
    raise exception 'Impossible de révoquer le dernier super administrateur.';
  end if;

  delete from public.admins where user_id = p_user_id;
end;
$$;

revoke all on function public.set_admin_role(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.remove_admin_role(uuid, uuid) from public, anon, authenticated;
grant execute on function public.set_admin_role(uuid, uuid, text) to service_role;
grant execute on function public.remove_admin_role(uuid, uuid) to service_role;

drop policy if exists "categories: admin" on public.categories;
create policy "categories: admin" on public.categories
  for all using (public.has_admin_role(array['super_admin', 'manager', 'catalog']))
  with check (public.has_admin_role(array['super_admin', 'manager', 'catalog']));

drop policy if exists "products: admin" on public.products;
create policy "products: admin" on public.products
  for all using (public.has_admin_role(array['super_admin', 'manager', 'catalog']))
  with check (public.has_admin_role(array['super_admin', 'manager', 'catalog']));

drop policy if exists "costs: admin" on public.product_costs;
create policy "costs: admin" on public.product_costs
  for all using (public.has_admin_role(array['super_admin', 'manager']))
  with check (public.has_admin_role(array['super_admin', 'manager']));

drop policy if exists "offers: admin" on public.offers;
create policy "offers: admin" on public.offers
  for all using (public.has_admin_role(array['super_admin', 'manager']))
  with check (public.has_admin_role(array['super_admin', 'manager']));

drop policy if exists "orders: admin" on public.orders;
create policy "orders: admin" on public.orders
  for all using (public.has_admin_role(array['super_admin', 'manager', 'orders']))
  with check (public.has_admin_role(array['super_admin', 'manager', 'orders']));

drop policy if exists "order_items: admin" on public.order_items;
create policy "order_items: admin" on public.order_items
  for all using (public.has_admin_role(array['super_admin', 'manager', 'orders']))
  with check (public.has_admin_role(array['super_admin', 'manager', 'orders']));

drop policy if exists "subscribers: admin" on public.subscribers;
create policy "subscribers: admin" on public.subscribers
  for all using (public.has_admin_role(array['super_admin', 'manager', 'orders']))
  with check (public.has_admin_role(array['super_admin', 'manager', 'orders']));

drop policy if exists "images: écriture admin" on storage.objects;
create policy "images: écriture admin" on storage.objects
  for all using (
    bucket_id = 'products'
    and public.has_admin_role(array['super_admin', 'manager', 'catalog'])
  )
  with check (
    bucket_id = 'products'
    and public.has_admin_role(array['super_admin', 'manager', 'catalog'])
  );

create or replace function public.set_order_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
begin
  if not public.has_admin_role(array['super_admin', 'manager', 'orders']) then
    raise exception 'Accès refusé';
  end if;
  if p_status not in ('nouvelle', 'validee', 'livree', 'annulee') then
    raise exception 'Statut invalide';
  end if;

  select status into v_current from public.orders where id = p_id for update;
  if v_current is null then raise exception 'Commande introuvable'; end if;
  if v_current = p_status then return; end if;

  if v_current = 'nouvelle' and p_status in ('validee', 'livree') then
    update public.products p
       set stock = greatest(p.stock - oi.quantity, 0)
      from public.order_items oi
     where oi.order_id = p_id and oi.product_id = p.id;
  end if;
  if v_current in ('validee', 'livree') and p_status in ('annulee', 'nouvelle') then
    update public.products p
       set stock = p.stock + oi.quantity
      from public.order_items oi
     where oi.order_id = p_id and oi.product_id = p.id;
  end if;

  update public.orders set status = p_status where id = p_id;
end;
$$;

create or replace function public.dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r json;
begin
  if not public.has_admin_role(array['super_admin', 'manager', 'orders']) then
    raise exception 'Accès refusé';
  end if;

  select json_build_object(
    'sales_month', coalesce((select sum(total) from public.orders
        where status in ('validee', 'livree') and created_at >= date_trunc('month', now())), 0),
    'sales_week', coalesce((select sum(total) from public.orders
        where status in ('validee', 'livree') and created_at >= date_trunc('week', now())), 0),
    'orders_month', (select count(*) from public.orders where created_at >= date_trunc('month', now())),
    'pending_orders', (select count(*) from public.orders where status = 'nouvelle'),
    'margin_month', coalesce((
        select sum((oi.unit_price - coalesce(pc.cost, 0)) * oi.quantity)
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        left join public.product_costs pc on pc.product_id = oi.product_id
        where o.status in ('validee', 'livree') and o.created_at >= date_trunc('month', now())
      ), 0),
    'top_products', coalesce((
        select json_agg(t) from (
          select oi.name, sum(oi.quantity)::int as qty
          from public.order_items oi
          join public.orders o on o.id = oi.order_id
          where o.status in ('validee', 'livree') and o.created_at >= date_trunc('month', now())
          group by oi.name order by qty desc limit 5
        ) t), '[]'::json),
    'low_stock', coalesce((
        select json_agg(t) from (
          select id, name, stock from public.products
          where is_active and stock <= 3 order by stock asc, name asc limit 8
        ) t), '[]'::json),
    'daily', coalesce((
        select json_agg(t) from (
          select to_char(d::date, 'DD/MM') as day, coalesce(sum(o.total), 0)::int as total
          from generate_series(current_date - 6, current_date, interval '1 day') d
          left join public.orders o
            on o.created_at::date = d::date and o.status in ('validee', 'livree')
          group by d order by d
        ) t), '[]'::json)
  ) into r;
  return r;
end;
$$;

grant execute on function public.set_order_status(uuid, text) to authenticated;
grant execute on function public.dashboard_stats() to authenticated;
