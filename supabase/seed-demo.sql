-- Donnees fictives de demonstration. A executer uniquement sur un projet
-- Supabase de developpement/test, apres schema.sql.
-- Reexecution sans doublons : les categories, produits, couts et l'offre
-- sont mis a jour a partir de leurs identifiants stables.

begin;

insert into public.categories (name, slug, icon, position) values
  ('Ordinateurs portables', 'ordinateurs-portables', 'Laptop', 1),
  ('Ordinateurs de bureau', 'ordinateurs-bureau', 'Monitor', 2),
  ('Écrans / Moniteurs', 'ecrans', 'Monitor', 3),
  ('Périphériques', 'peripheriques', 'Keyboard', 4),
  ('Réseau', 'reseau', 'Router', 5),
  ('Stockage', 'stockage', 'HardDrive', 6),
  ('Imprimantes & consommables', 'imprimantes', 'Printer', 7),
  ('Accessoires', 'accessoires', 'Headphones', 8)
on conflict (slug) do update
set name = excluded.name,
    icon = excluded.icon,
    position = excluded.position;

with demo_products (
  id, category_slug, name, brand, description, price, stock,
  warranty_months, specs, images, tags
) as (
  values
    (
      'd0000000-0000-4000-8000-000000000001'::uuid, 'ordinateurs-portables',
      'ThinkPad E14 — Core i5, 16 Go, 512 Go SSD', 'Lenovo',
      'Ordinateur portable polyvalent pour le travail, les études et la mobilité.',
      425000, 8, 12,
      '{"Processeur":"Intel Core i5","Mémoire":"16 Go","Stockage":"512 Go SSD","Écran":"14 pouces"}'::jsonb,
      array['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'],
      array['bestseller','recommande']
    ),
    (
      'd0000000-0000-4000-8000-000000000002'::uuid, 'ordinateurs-portables',
      'EliteBook 840 — Core i5, 16 Go, 512 Go SSD', 'HP',
      'Portable professionnel compact avec stockage rapide et écran 14 pouces.',
      560000, 5, 12,
      '{"Processeur":"Intel Core i5","Mémoire":"16 Go","Stockage":"512 Go SSD","Écran":"14 pouces"}'::jsonb,
      array['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80'],
      array['nouveau','recommande']
    ),
    (
      'd0000000-0000-4000-8000-000000000003'::uuid, 'ordinateurs-portables',
      'Latitude 5420 — Core i5, 8 Go, 256 Go SSD', 'Dell',
      'Ordinateur portable professionnel pour les tâches du quotidien.',
      385000, 4, 6,
      '{"Processeur":"Intel Core i5","Mémoire":"8 Go","Stockage":"256 Go SSD","Écran":"14 pouces"}'::jsonb,
      array['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'],
      array['bestseller']
    ),
    (
      'd0000000-0000-4000-8000-000000000004'::uuid, 'ordinateurs-portables',
      'MacBook Air — 8 Go, 256 Go SSD', 'Apple',
      'Ordinateur ultraportable pour la création et le travail en déplacement.',
      695000, 3, 12,
      '{"Processeur":"Apple Silicon","Mémoire":"8 Go","Stockage":"256 Go SSD","Écran":"13 pouces"}'::jsonb,
      array['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'],
      array['nouveau']
    ),
    (
      'd0000000-0000-4000-8000-000000000005'::uuid, 'ecrans',
      'Écran 24 pouces Full HD', 'LG',
      'Écran Full HD pour le bureau, les études et le télétravail.',
      115000, 7, 12,
      '{"Taille":"24 pouces","Résolution":"1920 × 1080","Connectique":"HDMI"}'::jsonb,
      array['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80'],
      array['bestseller']
    ),
    (
      'd0000000-0000-4000-8000-000000000006'::uuid, 'peripheriques',
      'Clavier sans fil compact', 'Logitech',
      'Clavier sans fil compact pour travailler confortablement.',
      28000, 15, 3,
      '{"Connexion":"Bluetooth","Disposition":"AZERTY","Alimentation":"Piles"}'::jsonb,
      array['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80'],
      array['promo']
    ),
    (
      'd0000000-0000-4000-8000-000000000007'::uuid, 'peripheriques',
      'Souris sans fil', 'Logitech',
      'Souris sans fil simple et fiable, adaptée au bureau et aux déplacements.',
      12000, 20, 3,
      '{"Connexion":"USB sans fil","Capteur":"Optique","Compatibilité":"Windows, macOS"}'::jsonb,
      array['https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80'],
      array['bestseller']
    ),
    (
      'd0000000-0000-4000-8000-000000000008'::uuid, 'stockage',
      'SSD externe portable 1 To', 'Samsung',
      'Stockage externe portable pour sauvegarder et transporter vos fichiers.',
      85000, 6, 12,
      '{"Capacité":"1 To","Connexion":"USB-C","Type":"SSD externe"}'::jsonb,
      array['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80'],
      array['nouveau']
    ),
    (
      'd0000000-0000-4000-8000-000000000009'::uuid, 'reseau',
      'Routeur Wi-Fi double bande', 'TP-Link',
      'Routeur Wi-Fi double bande pour connecter les appareils de la maison ou du bureau.',
      32000, 9, 6,
      '{"Wi-Fi":"Double bande","Ports":"4 ports Ethernet","Installation":"Application mobile"}'::jsonb,
      array['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80'],
      array['recommande']
    ),
    (
      'd0000000-0000-4000-8000-000000000011'::uuid, 'accessoires',
      'Casque audio sans fil', 'JBL',
      'Casque sans fil confortable pour les appels, les cours et la musique.',
      39000, 10, 3,
      '{"Connexion":"Bluetooth","Microphone":"Intégré","Autonomie":"Jusqu’à 20 heures"}'::jsonb,
      array['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'],
      array['nouveau','bestseller']
    )
)
insert into public.products (
  id, category_id, name, brand, description, price, stock,
  warranty_months, specs, images, tags, is_active
)
select
  demo.id, category.id, demo.name, demo.brand, demo.description,
  demo.price, demo.stock, demo.warranty_months, demo.specs,
  demo.images, demo.tags, true
from demo_products as demo
join public.categories as category on category.slug = demo.category_slug
on conflict (id) do update
set category_id = excluded.category_id,
    name = excluded.name,
    brand = excluded.brand,
    description = excluded.description,
    price = excluded.price,
    stock = excluded.stock,
    warranty_months = excluded.warranty_months,
    specs = excluded.specs,
    images = excluded.images,
    tags = excluded.tags,
    is_active = excluded.is_active;

insert into public.product_costs (product_id, cost) values
  ('d0000000-0000-4000-8000-000000000001', 350000),
  ('d0000000-0000-4000-8000-000000000002', 470000),
  ('d0000000-0000-4000-8000-000000000003', 310000),
  ('d0000000-0000-4000-8000-000000000004', 590000),
  ('d0000000-0000-4000-8000-000000000005', 88000),
  ('d0000000-0000-4000-8000-000000000006', 19000),
  ('d0000000-0000-4000-8000-000000000007', 7500),
  ('d0000000-0000-4000-8000-000000000008', 68000),
  ('d0000000-0000-4000-8000-000000000009', 23000),
  ('d0000000-0000-4000-8000-000000000011', 27000)
on conflict (product_id) do update set cost = excluded.cost;

insert into public.offers (id, title, percent, category_id, starts_at, ends_at, is_active)
values (
  'd0000000-0000-4000-8000-000000000012',
  'Offre découverte',
  10,
  (select id from public.categories where slug = 'ordinateurs-portables'),
  now() - interval '1 day',
  now() + interval '30 days',
  true
)
on conflict (id) do update
set title = excluded.title,
    percent = excluded.percent,
    category_id = excluded.category_id,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    is_active = excluded.is_active;

commit;

select
  count(*) as products_seeded,
  count(*) filter (where discount_percent > 0) as products_on_sale
from public.v_products
where id::text like 'd0000000-0000-4000-8000-%';
