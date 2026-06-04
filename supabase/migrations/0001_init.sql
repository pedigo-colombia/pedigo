-- =============================================================================
-- PediGo · Migración 0001 · Esquema inicial
-- Postgres / Supabase
-- =============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "postgis";        -- geolocalización (tracking/mapa)

-- -----------------------------------------------------------------------------
-- Helper: organización activa desde el JWT de Clerk
-- El token de Clerk debe incluir el claim `organization_id` (UUID interno).
-- -----------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'organization_id', '')::uuid;
$$;

create or replace function public.current_clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '');
$$;

-- -----------------------------------------------------------------------------
-- Trigger genérico updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type order_channel as enum ('app', 'pos', 'whatsapp');

create type order_status as enum (
  'recibido', 'en_preparacion', 'listo', 'en_camino', 'entregado',
  'cancelado', 'rechazado', 'incidencia', 'reprogramado', 'devuelto'
);

create type payment_method as enum ('cash', 'transfer', 'datafono', 'online');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type cash_session_status as enum ('open', 'closed');
create type cash_movement_type as enum ('sale', 'in', 'out', 'withdrawal');
create type inventory_movement_type as enum ('in', 'out', 'adjust');
create type fiscal_doc_type as enum ('invoice', 'credit_note', 'debit_note', 'support_document');
create type invoice_status as enum ('draft', 'issued', 'sent', 'accepted', 'rejected', 'void');
create type courier_relationship as enum ('owned', 'shared');
create type assignment_method as enum ('manual', 'auto_proximity');
create type notification_channel as enum ('in_app', 'email', 'whatsapp');
create type org_role as enum ('commerce_admin', 'commerce_employee', 'courier');

-- =============================================================================
-- TENANCY & USUARIOS
-- =============================================================================
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  clerk_org_id  text unique,
  name          text not null,
  slug          text unique not null,
  status        text not null default 'active',
  plan          text not null default 'standard',
  currency      text not null default 'COP',
  locale        text not null default 'es',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table organization_settings (
  organization_id    uuid primary key references organizations(id) on delete cascade,
  business_hours     jsonb not null default '{}'::jsonb,
  pos_config         jsonb not null default '{}'::jsonb,
  delivery_config    jsonb not null default '{}'::jsonb,
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table organization_fiscal_settings (
  organization_id    uuid primary key references organizations(id) on delete cascade,
  legal_name         text not null default '',
  nit                text not null default '',
  regime             text not null default '',
  address            text not null default '',
  dian_environment   text not null default 'mock',
  invoice_prefix     text not null default 'FE',
  invoice_resolution jsonb not null default '{}'::jsonb,
  credit_note_prefix text not null default 'NC',
  debit_note_prefix  text not null default 'ND',
  support_doc_prefix text not null default 'DS',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Usuarios de back-office (espejo mínimo de Clerk users).
create table users (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text unique not null,
  email          text,
  full_name      text,
  phone          text,
  platform_role  text,                 -- 'superadmin' | null
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table user_organization_roles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role            org_role not null default 'commerce_employee',
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, organization_id)
);

-- Clientes finales (consumidores de la app).
create table customers (
  id                 uuid primary key default gen_random_uuid(),
  clerk_user_id      text unique,
  email              text,
  full_name          text,
  phone              text,
  default_address_id uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table customer_addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label       text,
  line1       text not null,
  city        text,
  lat         double precision,
  lng         double precision,
  notes       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table commerce_locations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  address         text,
  lat             double precision,
  lng             double precision,
  is_main         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- CATÁLOGO / INVENTARIO
-- =============================================================================
create table product_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  sort_order      int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table products (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category_id     uuid references product_categories(id) on delete set null,
  name            text not null,
  description     text,
  base_price      numeric(12,2) not null default 0,
  image_url       text,
  is_favorite     boolean not null default false,
  is_active       boolean not null default true,
  tax_rate        numeric(4,3) not null default 0.190,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name        text not null,
  price_delta numeric(12,2) not null default 0,
  sku         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table product_extras (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name        text not null,
  price       numeric(12,2) not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table product_combos (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  price           numeric(12,2) not null default 0,
  items           jsonb not null default '[]'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table product_schedules (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table inventory_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  product_id      uuid references products(id) on delete cascade,
  stock_qty       numeric(12,2) not null default 0,
  min_alert       numeric(12,2) not null default 0,
  unit            text not null default 'unidad',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table inventory_movements (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  type              inventory_movement_type not null,
  qty               numeric(12,2) not null,
  reason            text,
  ref_order_id      uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table promotions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  type            text not null default 'percent',  -- percent | fixed | combo
  value           numeric(12,2) not null default 0,
  conditions      jsonb not null default '{}'::jsonb,
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- REPARTIDORES (antes de orders por FK)
-- =============================================================================
create table couriers (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  full_name     text not null,
  phone         text,
  vehicle_type  text,
  is_active     boolean not null default true,
  current_lat   double precision,
  current_lng   double precision,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table courier_organization_links (
  id              uuid primary key default gen_random_uuid(),
  courier_id      uuid not null references couriers(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  relationship    courier_relationship not null default 'owned',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (courier_id, organization_id)
);

-- =============================================================================
-- PEDIDOS
-- =============================================================================
create table orders (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  customer_id      uuid references customers(id) on delete set null,
  location_id      uuid references commerce_locations(id) on delete set null,
  channel          order_channel not null default 'pos',
  status           order_status not null default 'recibido',
  subtotal         numeric(12,2) not null default 0,
  tax_total        numeric(12,2) not null default 0,
  discount_total   numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  address_snapshot jsonb,
  courier_id       uuid references couriers(id) on delete set null,
  invoice_id       uuid,
  notes            text,
  created_by       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  variant_id  uuid references product_variants(id) on delete set null,
  qty         numeric(12,2) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  extras      jsonb not null default '[]'::jsonb,
  line_total  numeric(12,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  text,
  created_at  timestamptz not null default now()
);

create table payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id        uuid references orders(id) on delete set null,
  method          payment_method not null,
  amount          numeric(12,2) not null default 0,
  status          payment_status not null default 'pending',
  provider_ref    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- CAJA
-- =============================================================================
create table cash_registers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id     uuid references commerce_locations(id) on delete set null,
  name            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table cash_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  register_id     uuid not null references cash_registers(id) on delete cascade,
  opened_by       text,
  opening_amount  numeric(12,2) not null default 0,
  closing_amount  numeric(12,2),
  expected_amount numeric(12,2),
  difference      numeric(12,2),
  status          cash_session_status not null default 'open',
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table cash_movements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  cash_session_id uuid not null references cash_sessions(id) on delete cascade,
  type            cash_movement_type not null,
  amount          numeric(12,2) not null default 0,
  ref_order_id    uuid references orders(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- COCINA / KDS
-- =============================================================================
create table kitchen_tickets (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id        uuid not null references orders(id) on delete cascade,
  priority        int not null default 0,
  station         text,
  status          order_status not null default 'recibido',
  started_at      timestamptz,
  ready_at        timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- DELIVERY / TRACKING
-- =============================================================================
create table courier_assignments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id        uuid not null references orders(id) on delete cascade,
  courier_id      uuid not null references couriers(id) on delete cascade,
  method          assignment_method not null default 'manual',
  status          text not null default 'active',
  assigned_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table live_locations (
  id          uuid primary key default gen_random_uuid(),
  courier_id  uuid not null references couriers(id) on delete cascade,
  order_id    uuid references orders(id) on delete set null,
  lat         double precision not null,
  lng         double precision not null,
  heading     double precision,
  speed       double precision,
  recorded_at timestamptz not null default now()
);
create index idx_live_locations_courier_time on live_locations (courier_id, recorded_at desc);

create table delivery_routes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id        uuid not null references orders(id) on delete cascade,
  courier_id      uuid references couriers(id) on delete set null,
  polyline        text,
  distance_m      numeric(12,2),
  eta_seconds     int,
  computed_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- FACTURACIÓN
-- =============================================================================
create table invoices (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  order_id          uuid references orders(id) on delete set null,
  type              text not null default 'sale',
  prefix            text not null,
  number            bigint not null,
  full_number       text not null,
  status            invoice_status not null default 'draft',
  customer_snapshot jsonb not null default '{}'::jsonb,
  fiscal_snapshot   jsonb not null default '{}'::jsonb,
  subtotal          numeric(12,2) not null default 0,
  tax_total         numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  cufe              text,
  issued_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, prefix, number)
);

create table invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  description text not null,
  qty         numeric(12,2) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  tax_rate    numeric(4,3) not null default 0,
  line_total  numeric(12,2) not null default 0,
  created_at  timestamptz not null default now()
);

create table invoice_status_history (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  from_status invoice_status,
  to_status   invoice_status not null,
  actor       text,
  created_at  timestamptz not null default now()
);

create table credit_notes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id      uuid not null references invoices(id) on delete cascade,
  prefix          text not null,
  number          bigint not null,
  reason          text,
  total           numeric(12,2) not null default 0,
  status          invoice_status not null default 'draft',
  cufe            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table debit_notes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id      uuid not null references invoices(id) on delete cascade,
  prefix          text not null,
  number          bigint not null,
  reason          text,
  total           numeric(12,2) not null default 0,
  status          invoice_status not null default 'draft',
  cufe            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table support_documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  order_id        uuid references orders(id) on delete set null,
  prefix          text not null,
  number          bigint not null,
  supplier_info   jsonb not null default '{}'::jsonb,
  total           numeric(12,2) not null default 0,
  status          invoice_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table dian_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  document_type    fiscal_doc_type not null,
  document_id      uuid,
  event            text not null,
  status           text not null,
  request_payload  jsonb,
  response_payload jsonb,
  created_at       timestamptz not null default now()
);

-- =============================================================================
-- NUMERACIÓN FISCAL (consecutivos seguros)
-- =============================================================================
create table fiscal_sequences (
  organization_id uuid not null references organizations(id) on delete cascade,
  doc_type        fiscal_doc_type not null,
  prefix          text not null,
  current_number  bigint not null default 0,
  range_from      bigint,
  range_to        bigint,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (organization_id, doc_type)
);

-- Reserva atómica del siguiente número (lock de fila dentro de la función).
create or replace function public.next_fiscal_number(
  p_organization_id uuid,
  p_doc_type fiscal_doc_type
)
returns table (prefix text, number bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_next bigint;
begin
  -- Lock pesimista de la fila de secuencia.
  update fiscal_sequences
     set current_number = current_number + 1,
         updated_at = now()
   where organization_id = p_organization_id
     and doc_type = p_doc_type
  returning fiscal_sequences.prefix, fiscal_sequences.current_number
       into v_prefix, v_next;

  if not found then
    raise exception 'No existe secuencia fiscal para org % y tipo %', p_organization_id, p_doc_type;
  end if;

  prefix := v_prefix;
  number := v_next;
  return next;
end;
$$;

-- =============================================================================
-- TRANSVERSAL
-- =============================================================================
create table audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  actor_id        text,
  action          text not null,
  entity          text,
  entity_id       text,
  diff            jsonb,
  created_at      timestamptz not null default now()
);

create table notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  recipient_type  text not null,         -- user | customer | courier
  recipient_id    text,
  channel         notification_channel not null default 'in_app',
  template        text,
  payload         jsonb not null default '{}'::jsonb,
  status          text not null default 'pending',
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Índices por tenant (rendimiento de filtros RLS)
-- -----------------------------------------------------------------------------
create index idx_products_org on products (organization_id);
create index idx_orders_org_status on orders (organization_id, status);
create index idx_orders_org_created on orders (organization_id, created_at desc);
create index idx_order_items_order on order_items (order_id);
create index idx_invoices_org on invoices (organization_id);
create index idx_kitchen_org_status on kitchen_tickets (organization_id, status);
create index idx_inventory_org on inventory_items (organization_id);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','organization_settings','organization_fiscal_settings','users',
    'user_organization_roles','customers','customer_addresses','commerce_locations',
    'product_categories','products','product_variants','product_extras','product_combos',
    'product_schedules','inventory_items','inventory_movements','promotions','couriers',
    'courier_organization_links','orders','order_items','payments','cash_registers',
    'cash_sessions','kitchen_tickets','courier_assignments','delivery_routes','invoices',
    'credit_notes','debit_notes','support_documents','fiscal_sequences','notifications'
  ]
  loop
    execute format(
      'create trigger trg_%I_updated_at before update on %I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end$$;
