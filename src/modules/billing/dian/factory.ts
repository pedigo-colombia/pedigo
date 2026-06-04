import type { DianAdapter } from "./dian-adapter.interface";
import { MockDianAdapter } from "./adapters/mock-dian.adapter";

/**
 * Fábrica del adaptador DIAN según el entorno configurado.
 *
 * Único punto que decide qué implementación usar. Cambiar de `mock` a software
 * propio = agregar el caso `prod`/`test` aquí, sin tocar el motor.
 */
export function getDianAdapter(): DianAdapter {
  const env = (process.env.DIAN_ENVIRONMENT ?? "mock") as
    | "mock"
    | "test"
    | "prod";

  switch (env) {
    case "test":
    case "prod":
      // TODO(fase DIAN): return new RealDianAdapter(env)
      console.warn(
        `[dian] Entorno '${env}' aún no implementado. Usando MockDianAdapter.`,
      );
      return new MockDianAdapter();
    case "mock":
    default:
      return new MockDianAdapter();
  }
}
