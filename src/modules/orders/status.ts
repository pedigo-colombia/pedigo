import type { OrderChannel, OrderStatus } from "@/types/database";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  recibido: "Nuevo",
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

/** Badges alineados con la guía PediGo (nuevo=naranja, prep=verde suave, camino=azul). */
export const STATUS_CLASSES: Record<OrderStatus, string> = {
  recibido: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
  en_preparacion:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  listo: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  en_camino: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  entregado: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
  cancelado: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  rechazado: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  incidencia: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
  reprogramado: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  devuelto: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
};

export const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  recibido: ["en_preparacion", "rechazado", "cancelado"],
  en_preparacion: ["listo", "incidencia"],
  listo: ["en_camino", "entregado"],
  en_camino: ["entregado", "incidencia"],
  incidencia: ["reprogramado", "devuelto", "cancelado"],
  reprogramado: ["en_preparacion"],
};
