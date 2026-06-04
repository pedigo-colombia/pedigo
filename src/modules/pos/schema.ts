import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().default(null),
  quantity: z.number().int().positive().max(99),
  extraIds: z.array(z.string().uuid()).default([]),
});

export const createSaleSchema = z.object({
  channel: z.enum(["pos", "app", "whatsapp"]).default("pos"),
  paymentMethod: z.enum(["cash", "transfer", "datafono", "online"]).default("cash"),
  lines: z.array(cartLineSchema).min(1, "Agrega al menos un producto"),
  discountTotal: z.number().min(0).default(0),
  customerName: z.string().optional(),
  notes: z.string().optional(),
  generateInvoice: z.boolean().default(true),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
