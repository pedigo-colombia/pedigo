import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(120),
  categoryId: z.string().uuid().nullable().optional(),
  basePrice: z.number().min(0, "Precio inválido"),
  taxRate: z.number().min(0).max(1).default(0.19),
  isFavorite: z.boolean().default(false),
  isActive: z.boolean().default(true),
  initialStock: z.number().min(0).default(0),
  minAlert: z.number().min(0).default(0),
});
export type ProductInput = z.infer<typeof productSchema>;

export const updateProductSchema = productSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Nombre obligatorio").max(80),
  sortOrder: z.number().int().min(0).default(0),
});

export const stockAdjustSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["in", "out", "adjust"]),
  qty: z.number().positive("Cantidad inválida"),
  reason: z.string().max(200).optional(),
});

export const promotionSchema = z.object({
  name: z.string().min(2, "Nombre obligatorio").max(120),
  type: z.enum(["percent", "fixed", "combo"]).default("percent"),
  value: z.number().min(0),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const scheduleSchema = z.object({
  productId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
});

export const variantSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(80),
  priceDelta: z.number().default(0),
  sku: z.string().max(60).optional(),
});

export const extraSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(80),
  price: z.number().min(0).default(0),
});
