import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Configuración E2E de PediGo.
 *
 * Levanta el servidor de Next (producción) y corre los flujos deterministas
 * que NO requieren sesión real de Clerk: landing, healthcheck, 404 y la
 * redirección de rutas protegidas hacia el login (valida el middleware).
 *
 * Para flujos autenticados, configura credenciales reales y un usuario de
 * prueba (storageState) en un proyecto aparte.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    launchOptions: {
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--no-proxy-server",
        "--disable-features=NetworkServiceSandbox",
        "--host-resolver-rules=MAP localhost 127.0.0.1",
      ],
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
