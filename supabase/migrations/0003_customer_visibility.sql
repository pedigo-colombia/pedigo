-- =============================================================================
-- PediGo · Migración 0003 · Visibilidad de clientes para el comercio
-- =============================================================================
-- Permite que los miembros de una organización vean (solo lectura) los datos
-- de los clientes que tienen al menos un pedido en esa organización.
-- El cliente sigue gestionando sus propios datos vía `customers_self`.

create policy customers_org_select on customers
  for select
  using (
    exists (
      select 1 from orders o
       where o.customer_id = customers.id
         and o.organization_id = public.current_org_id()
    )
  );
