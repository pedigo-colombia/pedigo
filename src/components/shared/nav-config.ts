import {
  Building2,
  ChefHat,
  LayoutGrid,
  ListOrdered,
  MapPin,
  Package,
  Receipt,
  Settings,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
}

/** Navegación del panel de comercio (POS como pantalla principal). */
export const commerceNav: NavItem[] = [
  { href: "/pos", label: "POS / Ventas", icon: LayoutGrid },
  { href: "/pedidos", label: "Pedidos", icon: ListOrdered },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/caja", label: "Caja", icon: Wallet },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/cocina", label: "Cocina (KDS)", icon: ChefHat },
  { href: "/repartidores", label: "Repartidores", icon: Truck },
  { href: "/mapa", label: "Mapa operativo", icon: MapPin },
  { href: "/facturacion", label: "Facturación", icon: Receipt },
  { href: "/configuracion/fiscal", label: "Config. fiscal", icon: Settings },
];

/** Navegación del panel de superadmin (plataforma). */
export const adminNav: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutGrid },
  { href: "/admin/comercios", label: "Comercios", icon: Building2 },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/mapa-global", label: "Mapa global", icon: MapPin },
];
