import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  legalName: z.string().min(2, "La razón social es obligatoria"),
  nit: z.string().min(5, "NIT inválido"),
  invoicePrefix: z.string().min(1).max(8).default("FE"),
  adminEmail: z.string().email("Email del administrador inválido"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
