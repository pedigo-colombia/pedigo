import { AlertTriangle, CheckCircle2, Clock3, Info } from "lucide-react";

import { cn } from "@/lib/utils";

export type FiscalUiStatus = "active" | "process" | "error";

const config: Record<
  FiscalUiStatus,
  { label: string; desc: string; icon: typeof CheckCircle2; className: string }
> = {
  active: {
    label: "Facturación electrónica activa",
    desc: "Tus documentos se emiten con trazabilidad DIAN.",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
  },
  process: {
    label: "Facturación en configuración",
    desc: "Completa datos fiscales o revisa documentos en borrador.",
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
  },
  error: {
    label: "Revisa la facturación",
    desc: "Hay documentos rechazados o con error. Corrígelos antes de seguir.",
    icon: AlertTriangle,
    className: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100",
  },
};

export function FiscalStatusBanner({ status }: { status: FiscalUiStatus }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4", c.className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-heading text-sm font-bold">{c.label}</p>
        <p className="mt-0.5 text-sm opacity-90">{c.desc}</p>
      </div>
      {status === "process" && (
        <Info className="ml-auto hidden h-4 w-4 shrink-0 opacity-60 sm:block" />
      )}
    </div>
  );
}
