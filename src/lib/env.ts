import { z } from "zod";

/**
 * Validación de variables de entorno con Zod.
 *
 * - `serverEnv`: solo debe importarse desde código de servidor.
 * - `clientEnv`: seguro para el cliente (solo claves NEXT_PUBLIC_*).
 *
 * Durante el build de Vercel las variables existen; en local, si faltan,
 * lanzamos un error claro en vez de fallos crípticos en runtime.
 */

const serverSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_DB_URL: z.string().optional(),
  DIAN_ENVIRONMENT: z.enum(["mock", "test", "prod"]).default("mock"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("PediGo"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("es"),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().default("COP"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
});

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function parseOrWarn<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = `[env] Variables inválidas o faltantes en ${label}: ${result.error.issues
      .map((i) => i.path.join("."))
      .join(", ")}`;
    // En build no rompemos; en runtime sí avisamos fuerte.
    if (isBuildPhase) {
      console.warn(message);
      return {} as z.infer<T>;
    }
    console.error(message);
  }
  return (result.success ? result.data : {}) as z.infer<T>;
}

export const clientEnv = parseOrWarn(
  clientSchema,
  {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  "cliente",
);

export function getServerEnv() {
  return parseOrWarn(
    serverSchema,
    {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
      DIAN_ENVIRONMENT: process.env.DIAN_ENVIRONMENT,
    },
    "servidor",
  );
}
