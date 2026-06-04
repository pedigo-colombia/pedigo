/**
 * Configuración de navegación (datos puros, seguros para Server Components).
 *
 * El ícono se referencia por NOMBRE (string), no por componente, porque en
 * Next.js 16 / React 19 no se pueden pasar funciones/componentes como props
 * desde un Server Component a un Client Component. El sidebar (cliente) mapea
 * cada nombre a su componente de Lucide.
 */

export type IconName =
  | "Home"
  | "LayoutGrid"
  | "ListOrdered"
  | "Users"
  | "Wallet"
  | "Package"
  | "ChefHat"
  | "Truck"
  | "MapPin"
  | "Receipt"
  | "Settings"
  | "Building2";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

/** Navegación del panel de comercio (POS como pantalla principal). */
export const commerceNav: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: "Home" },
  { href: "/pos", label: "POS / Ventas", icon: "LayoutGrid" },
  { href: "/pedidos", label: "Pedidos", icon: "ListOrdered" },
  { href: "/clientes", label: "Clientes", icon: "Users" },
  { href: "/caja", label: "Caja", icon: "Wallet" },
  { href: "/inventario", label: "Inventario", icon: "Package" },
  { href: "/cocina", label: "Cocina (KDS)", icon: "ChefHat" },
  { href: "/repartidores", label: "Repartidores", icon: "Truck" },
  { href: "/mapa", label: "Mapa operativo", icon: "MapPin" },
  { href: "/facturacion", label: "Facturación", icon: "Receipt" },
  { href: "/configuracion/fiscal", label: "Config. fiscal", icon: "Settings" },
];

/** Navegación del panel de superadmin (plataforma). */
export const adminNav: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: "LayoutGrid" },
  { href: "/admin/comercios", label: "Comercios", icon: "Building2" },
  { href: "/admin/usuarios", label: "Usuarios", icon: "Users" },
  { href: "/admin/mapa-global", label: "Mapa global", icon: "MapPin" },
];
