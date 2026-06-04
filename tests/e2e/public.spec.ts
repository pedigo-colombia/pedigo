import { expect, test } from "@playwright/test";

/**
 * E2E a nivel HTTP contra el servidor de Next en ejecución.
 * (El navegador no tiene red en este entorno sandbox; estos tests validan SSR,
 * estados HTTP y contenido sin depender de Chromium.)
 */
test.describe("Páginas públicas (HTTP)", () => {
  test("la landing renderiza el hero y el nombre del producto", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain("PediGo");
    expect(html.toLowerCase()).toContain("plataforma de comida");
  });

  test("el healthcheck responde ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("pedigo");
  });

  test("una ruta desconocida sin sesión queda protegida (redirige al login)", async ({
    request,
  }) => {
    // Por seguridad, el middleware intercepta cualquier ruta no pública antes
    // de llegar al 404. La página 404 (not-found.tsx) se ve estando autenticado.
    const res = await request.get("/ruta-que-no-existe-xyz", { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308]).toContain(res.status());
    expect(res.headers()["location"] ?? "").toContain("sign-in");
  });
});
