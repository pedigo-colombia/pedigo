export type AccessTipo = "cliente" | "comercio" | "admin";

export const ACCESS_LABELS: Record<
  AccessTipo,
  { title: string; subtitle: string; signInHint: string }
> = {
  cliente: {
    title: "Cliente PediGo",
    subtitle: "Pide a domicilio, sigue tu pedido y guarda tus direcciones.",
    signInHint: "¿Primera vez? Crea tu cuenta gratis.",
  },
  comercio: {
    title: "Panel del comercio",
    subtitle: "POS, cocina, inventario, repartidores y facturación DIAN.",
    signInHint: "Acceso solo para equipos invitados por tu restaurante.",
  },
  admin: {
    title: "Administración PediGo",
    subtitle: "Gestión de comercios, usuarios y mapa global de la plataforma.",
    signInHint: "Solo personal autorizado de PediGo.",
  },
};

export function parseAccessTipo(raw: string | null | undefined): AccessTipo | null {
  if (raw === "cliente" || raw === "comercio" || raw === "admin") return raw;
  return null;
}

export function signInPath(tipo: AccessTipo): string {
  return `/sign-in?tipo=${tipo}`;
}

export function signUpPath(tipo: AccessTipo = "cliente"): string {
  return tipo === "cliente" ? "/sign-up" : signInPath(tipo);
}
