-- Evita "stack depth limit exceeded" al evaluar políticas RLS que llaman
-- current_customer_id() mientras customers/orders se referencian mutuamente.
create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.customers
   where clerk_user_id = public.current_clerk_user_id()
   limit 1;
$$;
