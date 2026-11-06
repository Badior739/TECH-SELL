-- Creez d'abord l'utilisateur dans Supabase > Authentication > Users.
-- Remplacez l'adresse ci-dessous, puis executez ce script dans SQL Editor.
-- Ne mettez jamais un mot de passe ou une cle API dans ce fichier.

do $$
declare
  admin_email text := 'admin@mindgraphix.com';
begin
  if not exists (
    select 1
    from auth.users
    where lower(email) = lower(admin_email)
  ) then
    raise exception 'Aucun utilisateur Auth ne correspond a cette adresse. Creez-le d''abord dans Authentication > Users.';
  end if;

  insert into public.admins (user_id, role)
  select id, 'super_admin'
  from auth.users
  where lower(email) = lower(admin_email)
  on conflict (user_id) do update set role = 'super_admin';
end;
$$;
