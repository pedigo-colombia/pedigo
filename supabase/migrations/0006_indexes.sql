-- =============================================================================
-- PediGo · Migración 0006 · Índices de rendimiento (hardening)
-- =============================================================================
-- Índices para los accesos más frecuentes de delivery, tracking y facturación.

create index if not exists idx_live_locations_order_time
  on live_locations (order_id, recorded_at desc);

create index if not exists idx_courier_assignments_courier_status
  on courier_assignments (courier_id, status);

create index if not exists idx_courier_assignments_order
  on courier_assignments (order_id);

create index if not exists idx_courier_org_links_org
  on courier_organization_links (organization_id);

create index if not exists idx_payments_order
  on payments (order_id);

create index if not exists idx_invoices_order
  on invoices (order_id);

create index if not exists idx_dian_logs_document
  on dian_logs (document_id);

create index if not exists idx_order_status_history_order
  on order_status_history (order_id);

create index if not exists idx_products_org_active
  on products (organization_id, is_active);

create index if not exists idx_cash_movements_session
  on cash_movements (cash_session_id);

create index if not exists idx_inventory_items_product
  on inventory_items (product_id);
