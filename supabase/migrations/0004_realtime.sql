-- =============================================================================
-- PediGo · Migración 0004 · Publicación Realtime
-- =============================================================================
-- Habilita Supabase Realtime para las tablas que alimentan pantallas en vivo:
--  - orders            → KDS (cocina) y pedidos
--  - kitchen_tickets    → KDS por estación
--  - live_locations     → tracking de repartidores (Fase 5)
--  - courier_assignments→ asignaciones en vivo (Fase 5)
--
-- RLS sigue aplicando a los eventos Realtime, por lo que cada cliente solo
-- recibe cambios de su propia organización.

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table kitchen_tickets;
alter publication supabase_realtime add table live_locations;
alter publication supabase_realtime add table courier_assignments;
