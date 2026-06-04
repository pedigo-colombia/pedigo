import type { OrderChannel, OrderStatus } from "@/types/database";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  listo: "Listo",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
  rechazado: "Rechazado",
  incidencia: "Incidencia",
  reprogramado: "Reprogramado",
  devuelto: "Devuelto",
};

export const CHANNEL_LABELS: Record<OrderChannel, string> = {
  app: "App",
  pos: "Presencial",
  whatsapp: "WhatsApp",
};

/** Color del badge por estado (clases de Tailwind). */
export const STATUS_CLASSES: Record<OrderStatus, string> = {
  recibido: "bg-blue-100 text-blue-700",
  en_preparacion: "bg-amber-100 text-amber-700",
  listo: "bg-violet-100 text-violet-700",
  en_camino: "bg-cyan-100 text-cyan-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-gray-200 text-gray-600",
  rechazado: "bg-red-100 text-red-700",
  incidencia: "bg-orange-100 text-orange-700",
  reprogramado: "bg-indigo-100 text-indigo-700",
  devuelto: "bg-rose-100 text-rose-700",
};

/** Transiciones sugeridas para el flujo operativo. */
export const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  recibido: ["en_preparacion", "rechazado", "cancelado"],
  en_preparacion: ["listo", "incidencia"],
  listo: ["en_camino", "entregado"],
  en_camino: ["entregado", "incidencia"],
  incidencia: ["reprogramado", "devuelto", "cancelado"],
  reprogramado: ["en_preparacion"],
};
