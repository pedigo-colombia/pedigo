# PediGo

SaaS web multicomercio para restaurantes y comercios de comida: **POS, pedidos
(app / presencial / WhatsApp), inventario, cocina (KDS), delivery con tracking
en tiempo real y facturación electrónica** preparada para software propio ante
la DIAN.

- **Dominio:** pedigo.lat
- **Idioma:** Español · **Moneda:** COP
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui ·
  Clerk (Auth + Organizations) · Supabase (Postgres + RLS + Realtime) ·
  Mapbox GL JS · listo para Vercel.

---

## Arquitectura

Multi-tenant con **una base de datos compartida** y aislamiento por
`organization_id` reforzado con **Row Level Security** en Postgres.

```
Next.js (RSC + Server Actions + Route Handlers)
   ├── Clerk            → Auth + Organizations (tenants) + JWT con claim organization_id
   ├── Supabase         → Postgres + RLS por organización + Realtime + Storage
   └── Mapbox           → mapas, rutas y tracking

src/
  app/            Rutas por rol: (public) (admin) (commerce) (courier) (customer)
  modules/        Lógica de dominio (auth, billing, tenancy, ...)
  components/     UI (shadcn) + shared
  lib/            supabase/, env, utils
  types/          tipos de la DB
supabase/
  migrations/     esquema SQL + RLS
  seed/           datos de prueba
```

### Seguridad (defensa en profundidad)

1. **Middleware** (Clerk): protege rutas; `/admin` exige superadmin.
2. **Server** (guards + Zod): valida sesión, rol y tenant en cada acción.
3. **Base de datos** (RLS): aísla por `organization_id` aunque la app falle.
4. **Auditoría**: `audit_logs`, `dian_logs`.

> El **superadmin** opera vía Server Actions con `service_role` (que bypassa
> RLS), siempre tras `requireSuperadmin()`. El `service_role` NUNCA se expone
> al cliente.

---

## Requisitos

- Node.js 20+ (probado con 24 LTS) y npm.
- Cuenta de **Clerk**, **Supabase** y **Mapbox**.

> ⚠️ Si tu red hace inspección SSL y `npm install` falla con
> `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, exporta `NODE_OPTIONS=--use-system-ca`.

---

## Puesta en marcha

> 📘 Guía detallada de integración (GitHub, Supabase, Clerk, Mapbox, Vercel) en
> [`docs/SETUP.md`](docs/SETUP.md).

```bash
# 1. Variables de entorno
cp .env.example .env.local   # y completa los valores

# 2. Dependencias
npm install

# 3. Base de datos (en Supabase: SQL Editor o psql)
#    Ejecuta EN ORDEN todas las migraciones de supabase/migrations/:
#    0001_init.sql · 0002_rls.sql · 0003_customer_visibility.sql
#    0004_realtime.sql · 0005_courier_visibility.sql · 0006_indexes.sql

# 4. Datos de prueba (opcional, solo desarrollo)
npm run db:seed

# 5. Desarrollo
npm run dev
```

### Pruebas

```bash
npm test          # pruebas unitarias (Vitest): tax-calculator, proximidad
npm run test:e2e  # pruebas E2E (Playwright): SSR, healthcheck, seguridad de rutas
npm run typecheck # verificación de tipos (tsc)
npm run lint      # ESLint
```

Las E2E levantan el servidor (`build` + `start` en el puerto 3100) y validan a
nivel HTTP: render de la landing, `/api/health`, y que las rutas protegidas
redirigen al login (middleware). Para E2E de UI con login real, configura
credenciales de Clerk y un `storageState` autenticado en un proyecto aparte.

### Despliegue en Vercel (checklist)

1. Importa el repo en Vercel (framework Next.js detectado automáticamente).
2. Define TODAS las variables de `.env.example` en Project Settings → Environment Variables.
3. Ejecuta las migraciones `0001`–`0006` en el proyecto de Supabase de producción.
4. En Clerk: configura el dominio de producción, el JWT template con `organization_id`, los roles de organización y el webhook → `https://pedigo.lat/api/webhooks/clerk`.
5. Integra Clerk como Third-party auth en Supabase (producción).
6. `DIAN_ENVIRONMENT=mock` hasta habilitar el software propio ante la DIAN.
7. Healthcheck disponible en `/api/health` para monitoreo/uptime.
8. Revisa el checklist de seguridad en `docs/SECURITY.md`.

### Configuración de Clerk (clave para RLS)

1. Habilita **Organizations** en el dashboard de Clerk.
2. En **Sessions → Customize session token**, agrega el claim para exponer el
   UUID interno de la organización a Supabase:

   ```json
   {
     "organization_id": "{{org.public_metadata.organization_id}}",
     "email": "{{user.primary_email_address}}",
     "publicMetadata": "{{user.public_metadata}}",
     "org_public_metadata": "{{org.public_metadata}}"
   }
   ```

3. Integra Clerk como **Third-party auth** en Supabase
   (Authentication → Sign In/Up → Third Party Auth → Clerk) para que
   `auth.jwt()` exponga los claims dentro de las políticas RLS.
4. Roles de organización personalizados sugeridos: `org:admin`,
   `org:commerce_employee`, `org:courier`.
5. Webhook → `POST /api/webhooks/clerk` con `CLERK_WEBHOOK_SECRET`.
6. Marca a un usuario como superadmin con `public_metadata.platform_role = "superadmin"`.

### Roles

| Rol | Acceso |
|-----|--------|
| `superadmin` | Plataforma completa (`/admin`) |
| `commerce_admin` | Panel del comercio + config fiscal (`/pos`) |
| `commerce_employee` | POS, caja, cocina, pedidos |
| `courier` | PWA repartidor (`/courier`) |
| `customer` | App cliente (`/cuenta`) |

---

## Estado por fases

- **Fase 1** ✅ Arquitectura, modelo de datos, estrategia multi-tenant y seguridad.
- **Fase 2** ✅ Auth, organizaciones, roles, onboarding de comercios, dashboards base.
- **Fase 3** ✅ POS (precios revalidados en servidor + factura), pedidos con flujo de estados, caja con arqueo, clientes.
- **Fase 4** ✅ Inventario (productos, stock, alertas, variantes/extras), KDS en tiempo real (Realtime), promociones, reglas por horario.
- **Fase 5** ✅ Repartidores (alta, asignación manual y por cercanía), mapa operativo (Mapbox + Realtime), PWA repartidor con ubicación cada 5s, tracking del cliente con ETA y ruta.
- **Fase 6** ✅ Config fiscal por comercio, listado de facturas con foto fiscal y trazabilidad (dian_logs), notas crédito/débito y documento soporte, adapter DIAN intercambiable.
- **Fase 7** ✅ Seeds enriquecidos, pruebas unitarias (Vitest), documentación + checklist de despliegue, hardening (error boundary, 404, healthcheck, security headers, índices).
