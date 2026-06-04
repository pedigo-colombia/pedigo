/**
 * Tokens de marca PediGo (guía visual oficial).
 * Usar en JS/TS cuando haga falta el valor literal (Mapbox, Clerk, charts).
 */
export const brand = {
  orange: "#FF7A00",
  navy: "#1F2937",
  success: "#4CAF50",
  background: "#F9FAFB",
  muted: "#6B7280",
  border: "#E5E7EB",
  accentSoft: "#FFF4EB",
  info: "#3B82F6",
  warning: "#FF7A00",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  pill: "9999px",
} as const;
