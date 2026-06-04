# PediGo · Seguridad (checklist)

Modelo de **defensa en profundidad**: ninguna capa confía ciegamente en la anterior.

## Capas

1. **Proxy / middleware** (`src/proxy.ts`)
   - Rutas públicas explícitas (landing, auth, webhooks, healthcheck).
   - `/admin` exige `platform_role = superadmin`.
2. **Servidor** (Server Actions / Route Handlers)
   - `requireAuth`, `requireOrg`, `requireSuperadmin`, `requirePermission` (`src/modules/auth/guards.ts`).
   - Validación de entrada con **Zod** en cada acción.
   - Precios del POS **recalculados desde la DB** (no se confía en el cliente).
3. **Base de datos** (Row Level Security)
   - Todas las tablas tenant tienen RLS por `organization_id`.
   - Clientes finales solo ven sus pedidos/facturas/direcciones.
   - Repartidores y clientes ven solo lo que les corresponde (migraciones 0003/0005).
4. **Auditoría / trazabilidad**
   - `audit_logs`, `dian_logs`, `order_status_history`, `invoice_status_history`.

## Reglas de oro

- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` **solo en servidor** (`src/lib/supabase/admin.ts`). Jamás en el cliente.
- El superadmin opera con `service_role` **después** de `requireSuperadmin()`.
- Webhooks verificados por firma (Clerk/Svix; Wompi cuando se integre).
- Numeración fiscal vía RPC `next_fiscal_number` (lock transaccional) → sin huecos ni duplicados.
- La clave de RLS es el claim `organization_id` en el JWT de Clerk: revisa el JWT template antes de producción.

## Checklist previo a producción

- [ ] Migraciones 0001–0006 aplicadas.
- [ ] JWT template de Clerk incluye `organization_id`, `publicMetadata`, `org_public_metadata`, `email`.
- [ ] Clerk integrado como Third-party auth en Supabase.
- [ ] Probar aislamiento entre dos organizaciones (un usuario de A no ve datos de B).
- [ ] Variables de entorno completas en Vercel (sin secretos en el cliente).
- [ ] Revisar/activar CSP en `next.config.ts` con los orígenes de Clerk/Mapbox/Supabase.
- [ ] Rotar llaves de prueba por llaves de producción (Clerk/Supabase/Mapbox).
- [ ] `DIAN_ENVIRONMENT` correcto (`mock` hasta habilitación real).
