import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Middleware de seguridad (capa 1 / defensa en profundidad).
 *
 * Usamos `middleware.ts` (nombre estándar) para máxima compatibilidad con
 * Vercel; Next.js 16 también acepta `proxy.ts`, pero en Vercel puede dejar
 * el deployment en 404 sitewide si el manifiesto de rutas no se genera bien.
 *
 *  - Rutas públicas: landing, auth, webhooks.
 *  - Resto: requiere sesión.
 *  - /admin: requiere superadmin (claim platform_role).
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/acceso",
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
