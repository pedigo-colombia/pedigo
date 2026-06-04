-- =============================================================================
-- PediGo · Migración 0005 · Visibilidad de repartidores para el comercio
-- =============================================================================
-- Un comercio puede ver (solo lectura) los repartidores vinculados a su
-- organización (propios o compartidos). La gestión de datos del repartidor
-- (alta, activar/desactivar) se hace vía server actions con service_role.

create policy couriers_org_select on couriers
  for select
  using (
    exists (
      select 1 from courier_organization_links l
       where l.courier_id = couriers.id
         and l.organization_id = public.current_org_id()
    )
  );

-- El cliente dueño del pedido puede ver al repartidor asignado (para tracking).
create policy couriers_customer_select on couriers
  for select
  using (
    exists (
      select 1 from orders o
       where o.courier_id = couriers.id
         and o.customer_id = public.current_customer_id()
    )
  );

-- El cliente dueño del pedido puede ver las ubicaciones en vivo de su entrega.
create policy live_locations_customer_select on live_locations
  for select
  using (
    exists (
      select 1 from orders o
       where o.id = live_locations.order_id
         and o.customer_id = public.current_customer_id()
    )
  );
