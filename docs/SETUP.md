# PediGo · Guía de integración paso a paso (detallada)

Esta guía te lleva de cero a producción en `pedigo.lat`. Orden:
**GitHub → Supabase → Clerk → Mapbox → Vercel → cableado final → verificación**.

> Wompi y DIAN quedan para una fase posterior. El adapter DIAN está en modo
> `mock` (no requiere nada).

Leyenda: 🖱️ acción en una web · ⌨️ comando en tu terminal · 📋 valor a copiar.

---

## 0. Preparación

Cuentas necesarias (gratuitas para empezar): **GitHub**, **Supabase**, **Clerk**,
**Mapbox**, **Vercel**. Ten a mano el dominio **pedigo.lat** y acceso a su DNS.

⌨️ En la carpeta del proyecto crea tu archivo de entorno local:

```bash
cp .env.example .env.local
```

Irás pegando valores en `.env.local` a lo largo de la guía. Este archivo está
en `.gitignore`, así que **nunca se sube** a GitHub.

---

## 1. GitHub (subir el código)

### 1.1 Crear el repositorio
1. 🖱️ Entra a https://github.com/new
2. **Repository name**: `pedigo`
3. **Visibility**: Private (recomendado).
4. **NO** marques "Add a README", ".gitignore" ni "license" (el repo local ya los tiene).
5. 🖱️ **Create repository**. Copia la URL HTTPS, p. ej. `https://github.com/tu-usuario/pedigo.git`.

### 1.2 Primer commit y push
El repo local ya está inicializado y con los archivos en *stage*. ⌨️:

```bash
git config user.name "Tu Nombre"
git config user.email "tu-email@dominio.com"
git commit -m "PediGo: MVP fases 1-7 + pruebas"
git remote add origin https://github.com/tu-usuario/pedigo.git
git branch -M main
git push -u origin main
```

### 1.3 Autenticación al hacer push
- Si te pide usuario/contraseña: GitHub ya **no** acepta la contraseña de la cuenta.
  Crea un **Personal Access Token**: 🖱️ GitHub → Settings → Developer settings →
  Personal access tokens → **Tokens (classic)** → Generate new token → marca el scope
  **`repo`** → genera → 📋 cópialo y úsalo como "contraseña" en el push.
- Alternativa: instala **GitHub CLI** (`winget install GitHub.cli`), luego `gh auth login`
  y el push usará esa sesión.

✅ Verifica: recarga la página del repo en GitHub y deben aparecer las carpetas `src/`, `supabase/`, etc.

---

## 2. Supabase (PostgreSQL + RLS + Realtime)

### 2.1 Crear el proyecto
1. 🖱️ https://supabase.com/dashboard → **New project**.
2. **Name**: `pedigo`. **Database Password**: genera una fuerte y **guárdala**.
3. **Region**: la más cercana a tus usuarios (Colombia → *East US (North Virginia)*).
4. 🖱️ **Create new project** y espera ~2 min a que aprovisione.

### 2.2 Copiar llaves de API
1. 🖱️ Menú lateral → **Project Settings** (engranaje) → **API**.
2. Copia a `.env.local`:
   - 📋 **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - 📋 **Project API keys → `anon` `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 📋 **Project API keys → `service_role` `secret`** → `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ Esta última es de **servidor**, nunca la expongas en el cliente.

### 2.3 Ejecutar las migraciones (crear las tablas)
1. 🖱️ Menú lateral → **SQL Editor** → **+ New query**.
2. Abre el archivo `supabase/migrations/0001_init.sql` del proyecto, copia **todo** su contenido, pégalo y 🖱️ **Run** (Ctrl/Cmd+Enter).
3. Repite, **uno por uno y EN ORDEN**, con:
   - `0002_rls.sql`
   - `0003_customer_visibility.sql`
   - `0004_realtime.sql`
   - `0005_courier_visibility.sql`
   - `0006_indexes.sql`
4. Cada uno debe terminar con "Success. No rows returned".

> Si un script falla, no sigas con el siguiente: corrige y reejecuta. El más
> común es ejecutar fuera de orden (las tablas de `0001` deben existir antes que
> el RLS de `0002`).

### 2.4 Verificar
1. 🖱️ **Table Editor**: deben verse `organizations`, `products`, `orders`, `invoices`, etc.
2. 🖱️ **Database → Publications**: la publicación `supabase_realtime` debe incluir
   `orders`, `kitchen_tickets`, `live_locations`, `courier_assignments`.

> Alternativa por CLI (opcional): `npx supabase link --project-ref <REF>` y
> `npx supabase db push`. El `<REF>` está en Project Settings → General.

---

## 3. Clerk (autenticación + organizaciones) — la parte más importante

### 3.1 Crear la aplicación
1. 🖱️ https://dashboard.clerk.com → **Create application**.
2. **Application name**: `PediGo`.
3. **Sign-in options**: activa **Email** (con password) y **Google**.
4. 🖱️ **Create application**.

### 3.2 Copiar llaves
1. 🖱️ Sidebar → **API keys**.
2. Copia a `.env.local`:
   - 📋 **Publishable key** (`pk_test_…`) → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - 📋 **Secret key** (`sk_test_…`) → `CLERK_SECRET_KEY`

### 3.3 Google OAuth (para clientes)
- En desarrollo, Clerk trae credenciales compartidas de Google (funciona de una).
- Para producción: 🖱️ **User & Authentication → Social Connections → Google** →
  activa **Use custom credentials** y pega tu Client ID/Secret de Google Cloud
  (Authorized redirect URI te la da Clerk).

### 3.4 Activar Organizations
1. 🖱️ **Organizations** (sidebar) → **Enable Organizations**.
2. (Opcional, recomendado) **Roles & Permissions** → crea estos roles de organización:
   - `org:commerce_admin`
   - `org:commerce_employee`
   - `org:courier`
   Si no los creas, el código usa los por defecto: `org:admin` → admin del comercio,
   `org:member` → empleado.

### 3.5 Personalizar el token de sesión (⚠️ imprescindible para la RLS)
1. 🖱️ **Sessions** → pestaña **Customize session token** → **Edit**.
2. Pega exactamente:

   ```json
   {
     "organization_id": "{{org.public_metadata.organization_id}}",
     "email": "{{user.primary_email_address}}",
     "publicMetadata": "{{user.public_metadata}}",
     "org_public_metadata": "{{org.public_metadata}}"
   }
   ```

3. 🖱️ **Save**.

> Esto inyecta el `organization_id` interno (UUID de Supabase) en el JWT. Las
> políticas RLS leen ese claim para aislar los datos de cada comercio.

### 3.6 Integración Clerk ↔ Supabase (third-party auth)
**Lado Clerk:**
1. 🖱️ **Configure → Integrations** (o **Connect → Supabase**) → activa **Supabase**.
2. Clerk te mostrará tu **Clerk domain / issuer** (algo como `https://<tu-app>.clerk.accounts.dev`). 📋 cópialo.

**Lado Supabase:**
1. 🖱️ Supabase → **Authentication → Sign In / Providers** → sección **Third-Party Auth** → **Add provider → Clerk**.
2. Pega el **issuer/domain** de Clerk. **Save**.

> Resultado: el token de sesión de Clerk que la app envía (vía `accessToken`)
> es validado por Supabase y sus claims quedan disponibles en `auth.jwt()`.

### 3.7 Webhook (sincroniza usuarios y organizaciones)
1. 🖱️ Clerk → **Configure → Webhooks → Add Endpoint**.
2. **Endpoint URL**: por ahora usa la de Vercel (la tendrás en el paso 5) o vuelve aquí
   después. Formato final: `https://pedigo.lat/api/webhooks/clerk`.
3. **Subscribe to events**: marca `user.created`, `user.updated`,
   `organization.created`, `organization.updated`.
4. 🖱️ **Create**. Abre el endpoint → 📋 copia el **Signing Secret** (`whsec_…`) → `CLERK_WEBHOOK_SECRET`.

### 3.8 Crear tu usuario superadmin
1. Regístrate una vez en la app (en local: `npm run dev` → http://localhost:3000/sign-up)
   o crea el usuario desde Clerk → **Users → Create user** (puede ser con Google).
2. Agrega el correo en `src/lib/auth/platform-access.ts` (`PLATFORM_SUPERADMIN_EMAILS`
   y opcionalmente `COMMERCE_ACCESS_BY_EMAIL` para un comercio).
3. Ejecuta `npm run user:grant-access` (aplica superadmin en Clerk y membresía al comercio).

   Alternativa manual: Clerk → **Users** → **Public metadata**:

   ```json
   { "platform_role": "superadmin" }
   ```

4. Cierra sesión y vuelve a entrar; ahora entras a `/admin`.

> Desde `/admin/comercios` el superadmin crea cada comercio (eso crea la org en
> Clerk + la fila en Supabase + su configuración fiscal + numeración, y guarda el
> `organization_id` interno en la metadata pública de la org → alimenta el claim del 3.5).

---

## 4. Mapbox (mapas, rutas, tracking)

1. 🖱️ https://account.mapbox.com → crea la cuenta.
2. 🖱️ **Tokens** → usa el **Default public token** (`pk.…`) o crea uno nuevo →
   📋 → `NEXT_PUBLIC_MAPBOX_TOKEN`.
3. Producción (recomendado): edita el token → **URL restrictions** → agrega
   `https://pedigo.lat/*` para que no pueda usarse desde otros sitios.

---

## 5. Vercel (despliegue)

### 5.1 Importar el proyecto
1. 🖱️ https://vercel.com → inicia sesión con GitHub.
2. **Add New… → Project** → selecciona el repo `pedigo` → **Import**.
3. **Framework Preset**: Next.js (autodetectado). No cambies Build Command ni Output.

### 5.2 Variables de entorno
🖱️ En **Environment Variables**, agrega cada una (para *Production* y *Preview*):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://pedigo.lat` |
| `NEXT_PUBLIC_APP_NAME` | `PediGo` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `es` |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | `COP` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | tu `pk_…` |
| `CLERK_SECRET_KEY` | tu `sk_…` |
| `CLERK_WEBHOOK_SECRET` | tu `whsec_…` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/post-login` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/post-login` |
| `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | tu service_role |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | tu `pk.…` |
| `DIAN_ENVIRONMENT` | `mock` |

### 5.3 Desplegar
1. 🖱️ **Deploy**. Espera el build (~1–2 min).
2. Tendrás una URL `https://pedigo-xxxx.vercel.app`. Pruébala.

> Si cambias variables de entorno después, debes **Redeploy** (Deployments → … → Redeploy).

### 5.4 Dominio pedigo.lat
1. 🖱️ Proyecto → **Settings → Domains** → escribe `pedigo.lat` → **Add**.
2. Vercel te dará los registros DNS. En el panel DNS de tu dominio crea:
   - **A** `@` → `76.76.21.21`
   - **CNAME** `www` → `cname.vercel-dns.com`
   (usa exactamente los valores que muestre Vercel; pueden variar).
3. Espera la propagación (minutos a unas horas). El SSL lo emite Vercel automáticamente.

---

## 6. Cableado final (tras el primer deploy)

1. **Clerk → Webhooks**: edita el endpoint y deja la URL definitiva
   `https://pedigo.lat/api/webhooks/clerk`. Reenvía un evento de prueba ("Send example").
2. **Clerk → Domains**: agrega `pedigo.lat`. Para producción real, cambia a llaves
   `pk_live_…`/`sk_live_…` (Clerk → API keys → *Production*) y actualízalas en Vercel.
3. **Supabase → Third-Party Auth**: confirma que el issuer de Clerk (el de producción
   si migraste a live) esté permitido.
4. **Mapbox**: aplica la restricción de URL al dominio final.
5. **Datos demo** (opcional). En tu `.env.local` deben estar `NEXT_PUBLIC_SUPABASE_URL`
   y `SUPABASE_SERVICE_ROLE_KEY` del proyecto real, luego ⌨️:

   ```bash
   npm run db:seed
   ```

---

## 7. Verificación final

⌨️ En local (calidad):

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

🖱️ En producción:
- `https://pedigo.lat/api/health` → `{"status":"ok"}`.
- `https://pedigo.lat` → landing.
- Inicia sesión como superadmin → `/admin/comercios` → crea un comercio → invita un admin.
- Como admin del comercio → `/pos` → registra una venta → revisa `/facturacion` y `/caja`.

### Checklist de aislamiento multi-tenant
- [ ] Crea 2 comercios.
- [ ] Como admin de A solo ves datos de A.
- [ ] Cambia de organización (selector arriba) → ves datos de B.
- [ ] Un cliente solo ve sus propios pedidos/facturas.

---

## 8. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| Tras login, no ves datos / errores de permiso | El token no trae `organization_id` | Revisa el **Customize session token** (3.5) y vuelve a iniciar sesión |
| "JWT" inválido en Supabase / RLS bloquea todo | Falta la integración third-party | Repite 3.6 en ambos lados (Clerk y Supabase) |
| El webhook no crea usuarios/orgs | URL o secret incorrectos | Verifica URL `…/api/webhooks/clerk` y `CLERK_WEBHOOK_SECRET` |
| El mapa muestra "Configura NEXT_PUBLIC_MAPBOX_TOKEN" | Falta el token o no se redeployó | Agrega el token en Vercel y **Redeploy** |
| Variables nuevas no aplican | Vercel cachea el build | **Redeploy** del último deployment |
| `npm install` falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | Inspección SSL de la red | `setx NODE_OPTIONS --use-system-ca` (ya configurado en este equipo) |
| El superadmin no entra a `/admin` | Falta metadata | Public metadata `{"platform_role":"superadmin"}` y re-login |

Seguridad y RLS en profundidad: ver `docs/SECURITY.md`.
