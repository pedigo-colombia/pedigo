import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Proxy de seguridad (capa 1 / defensa en profundidad).
 * (Next.js 16 renombró el antiguo `middleware` a `proxy`.)
 *
 *  - Rutas públicas: landing, auth, webhooks.
 *  - Resto: requiere sesión.
 *  - /admin: requiere superadmin (claim platform_role).
 *
 * La autorización fina (permisos por recurso) se valida además en servidor
 * (guards) y en la base de datos (RLS). Esta es solo la primera barrera.
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/health",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (isAdminRoute(req)) {
    const claims = (sessionClaims ?? {}) as Record<string, unknown>;
    const meta = (claims.publicMetadata ?? {}) as Record<string, unknown>;
    if (meta.platform_role !== "superadmin") {
      return NextResponse.redirect(new URL("/post-login", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Salta archivos estáticos e internos de Next.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
