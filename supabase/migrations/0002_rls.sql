-- =============================================================================
-- PediGo · Migración 0002 · Row Level Security
-- =============================================================================
-- Estrategia:
--  - El cliente de servidor usa el JWT de Clerk (claim `organization_id`).
--  - El superadmin opera con `service_role`, que BYPASSEA RLS (decisión de
--    arquitectura: operaciones de plataforma vía server actions auditadas).
--  - Tablas con `organization_id`: acceso si coincide con la org activa.
--  - Clientes finales: acceso a sus propios pedidos/facturas/direcciones.
-- =============================================================================

-- Helper: customer interno del usuario Clerk actual.
create or replace function public.current_customer_id()
returns uuid
language sql
stable
as $$
  select id from public.customers
   where clerk_user_id = public.current_clerk_user_id()
   limit 1;
$$;

-- -----------------------------------------------------------------------------
-- Habilitar RLS en tablas tenant-scoped
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','organization_settings','organization_fiscal_settings',
    'user_organization_roles','commerce_locations','product_categories','products',
    'product_variants','product_extras','product_combos','product_schedules',
    'inventory_items','inventory_movements','promotions','courier_organization_links',
    'orders','order_items','order_status_history','payments','cash_registers',
    'cash_sessions','cash_movements','kitchen_tickets','courier_assignments',
    'delivery_routes','invoices','credit_notes','debit_notes','support_documents',
    'dian_logs','fiscal_sequences','notifications','audit_logs'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end$$;

-- También en tablas globales por usuario.
alter table users enable row level security;
alter table customers enable row level security;
alter table customer_addresses enable row level security;
alter table couriers enable row level security;
alter table invoice_items enable row level security;
alter table invoice_status_history enable row level security;
alter table live_locations enable row level security;

-- -----------------------------------------------------------------------------
-- Política estándar por organización (tablas con organization_id)
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organization_settings','organization_fiscal_settings','user_organization_roles',
    'commerce_locations','product_categories','products','product_variants',
    'product_extras','product_combos','product_schedules','inventory_items',
    'inventory_movements','promotions','courier_organization_links','payments',
    'cash_registers','cash_sessions','cash_movements','kitchen_tickets',
    'courier_assignments','delivery_routes','credit_notes','debit_notes',
    'support_documents','dian_logs','fiscal_sequences','notifications'
  ]
  loop
    execute format($f$
      create policy %1$I_tenant_all on %1$I
        for all
        using (organization_id = public.current_org_id())
        with check (organization_id = public.current_org_id());
    $f$, t);
  end loop;
end$$;

-- organizations: el miembro ve su propia organización.
create policy organizations_member_select on organizations
  for select using (id = public.current_org_id());

-- -----------------------------------------------------------------------------
-- ORDERS: miembros de la org O el cliente dueño del pedido
-- -----------------------------------------------------------------------------
create policy orders_tenant_all on orders
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy orders_customer_select on orders
  for select
  using (customer_id = public.current_customer_id());

-- order_items / order_status_history: vía pertenencia del pedido
create policy order_items_tenant_all on order_items
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy order_items_customer_select on order_items
  for select
  using (exists (
    select 1 from orders o
     where o.id = order_items.order_id
       and o.customer_id = public.current_customer_id()
  ));

create policy osh_tenant_all on order_status_history
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- -----------------------------------------------------------------------------
-- INVOICES: miembros de la org O el cliente dueño (vía pedido)
-- -----------------------------------------------------------------------------
create policy invoices_tenant_all on invoices
  for all
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy invoices_customer_select on invoices
  for select
  using (exists (
    select 1 from orders o
     where o.id = invoices.order_id
       and o.customer_id = public.current_customer_id()
  ));

create policy invoice_items_select on invoice_items
  for select
  using (exists (
    select 1 from invoices i
     where i.id = invoice_items.invoice_id
       and (i.organization_id = public.current_org_id()
            or exists (select 1 from orders o
                        where o.id = i.order_id
                          and o.customer_id = public.current_customer_id()))
  ));

create policy invoice_status_history_select on invoice_status_history
  for select
  using (exists (
    select 1 from invoices i
     where i.id = invoice_status_history.invoice_id
       and i.organization_id = public.current_org_id()
  ));

-- -----------------------------------------------------------------------------
-- Usuarios / clientes / couriers (registros propios)
-- -----------------------------------------------------------------------------
create policy users_self on users
  for all
  using (clerk_user_id = public.current_clerk_user_id())
  with check (clerk_user_id = public.current_clerk_user_id());

create policy customers_self on customers
  for all
  using (clerk_user_id = public.current_clerk_user_id())
  with check (clerk_user_id = public.current_clerk_user_id());

create policy customer_addresses_self on customer_addresses
  for all
  using (customer_id = public.current_customer_id())
  with check (customer_id = public.current_customer_id());

create policy couriers_self on couriers
  for all
  using (clerk_user_id = public.current_clerk_user_id())
  with check (clerk_user_id = public.current_clerk_user_id());

-- live_locations: el courier escribe las suyas; la org las lee vía assignment.
create policy live_locations_courier on live_locations
  for all
  using (exists (
    select 1 from couriers c
     where c.id = live_locations.courier_id
       and c.clerk_user_id = public.current_clerk_user_id()
  ))
  with check (exists (
    select 1 from couriers c
     where c.id = live_locations.courier_id
       and c.clerk_user_id = public.current_clerk_user_id()
  ));

create policy live_locations_org_select on live_locations
  for select
  using (exists (
    select 1 from courier_assignments a
     where a.courier_id = live_locations.courier_id
       and a.organization_id = public.current_org_id()
  ));

-- audit_logs: solo lectura por org (escritura vía service_role).
create policy audit_logs_tenant_select on audit_logs
  for select using (organization_id = public.current_org_id());
