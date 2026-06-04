import type { AppRole } from "./roles";

/**
 * Matriz de permisos (RBAC) centralizada.
 *
 * Las llaves son acciones del dominio; el valor es el conjunto de roles
 * autorizados. Esto se evalúa SIEMPRE en servidor (server actions / route
 * handlers). El frontend puede usarlo para mostrar/ocultar, pero la
 * autorización real ocurre en servidor + RLS en la base de datos.
 */

export const PERMISSIONS = {
  // Plataforma
  "platform.manage_organizations": ["superadmin"],
  "platform.view_all": ["superadmin"],

  // POS / ventas
  "pos.create_sale": ["superadmin", "commerce_admin", "commerce_employee"],
  "pos.apply_discount": ["superadmin", "commerce_admin"],

  // Caja
  "cash.open_session": ["superadmin", "commerce_admin", "commerce_employee"],
  "cash.close_session": ["superadmin", "commerce_admin", "commerce_employee"],
  "cash.view_all_sessions": ["superadmin", "commerce_admin"],

  // Pedidos
  "orders.read": [
    "superadmin",
    "commerce_admin",
    "commerce_employee",
    "courier",
    "customer",
  ],
  "orders.update_status": [
    "superadmin",
    "commerce_admin",
    "commerce_employee",
  ],
  "orders.create_app": ["superadmin", "customer"],

  // Inventario
  "inventory.manage": ["superadmin", "commerce_admin", "commerce_employee"],

  // Cocina / KDS
  "kitchen.operate": ["superadmin", "commerce_admin", "commerce_employee"],

  // Repartidores / delivery
  "delivery.assign": ["superadmin", "commerce_admin", "commerce_employee"],
  "delivery.update_location": ["superadmin", "courier"],
  "delivery.view_route": ["superadmin", "courier"],

  // Facturación
  "billing.issue_invoice": [
    "superadmin",
    "commerce_admin",
    "commerce_employee",
  ],
  "billing.manage_fiscal_settings": ["superadmin", "commerce_admin"],

  // Configuración del comercio
  "settings.manage": ["superadmin", "commerce_admin"],
} as const satisfies Record<string, readonly AppRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: AppRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[permission] as readonly AppRole[];
  return allowed.includes(role);
}
