import { expect, test } from "@playwright/test";

/**
 * Valida el middleware de seguridad: las rutas protegidas redirigen al login
 * cuando no hay sesión. Se prueba a nivel HTTP (sin seguir el redirect).
 */
test.describe("Seguridad de rutas (middleware)", () => {
  const protectedRoutes = [
    "/pos",
    "/caja",
    "/inventario",
    "/facturacion",
    "/admin",
    "/cuenta",
    "/courier",
  ];

  for (const route of protectedRoutes) {
    test(`${route} sin sesión redirige al login`, async ({ request }) => {
      const res = await request.get(route, { maxRedirects: 0 });
      expect([301, 302, 303, 307, 308]).toContain(res.status());
      const location = res.headers()["location"] ?? "";
      expect(location).toContain("sign-in");
    });
  }
});
