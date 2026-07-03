-- 1. Crie exatamente um usuário em Authentication > Users > Add user.
-- 2. Execute este arquivo uma única vez no SQL Editor.
do $$
declare
  owner_uuid uuid;
  owner_email text;
  user_count integer;
begin
  select count(*) into user_count from auth.users;
  if user_count <> 1 then
    raise exception 'Esperado exatamente 1 usuário em auth.users; encontrado: %', user_count;
  end if;

  select id, email into owner_uuid, owner_email from auth.users limit 1;

  insert into public.app_owner (singleton, user_id) values (true, owner_uuid)
  on conflict (singleton) do update set user_id = excluded.user_id;

  insert into public.profiles (user_id, full_name)
  values (owner_uuid, coalesce(split_part(owner_email, '@', 1), 'Proprietário'))
  on conflict (user_id) do nothing;

  insert into public.categories (user_id, name, type, icon, color) values
    (owner_uuid, 'Salário', 'income', 'WalletCards', '#89f0c4'),
    (owner_uuid, 'Freela', 'income', 'Laptop', '#b9a4ff'),
    (owner_uuid, 'Mercado', 'expense', 'ShoppingBasket', '#f5c76b'),
    (owner_uuid, 'Delivery', 'expense', 'Utensils', '#ff8b78'),
    (owner_uuid, 'Gasolina', 'expense', 'Fuel', '#8bd5ff'),
    (owner_uuid, 'Faculdade', 'expense', 'GraduationCap', '#b9a4ff'),
    (owner_uuid, 'Pet', 'expense', 'PawPrint', '#f5a4d4'),
    (owner_uuid, 'Lazer', 'expense', 'Gamepad2', '#9de37f'),
    (owner_uuid, 'Assinaturas', 'expense', 'Clapperboard', '#a9b2c3'),
    (owner_uuid, 'Saúde', 'expense', 'HeartPulse', '#ff8b78'),
    (owner_uuid, 'Transporte', 'expense', 'Bus', '#7ed6df'),
    (owner_uuid, 'Outros', 'expense', 'Shapes', '#9ba7b9')
  on conflict (user_id, name, type) do nothing;
end;
$$;
