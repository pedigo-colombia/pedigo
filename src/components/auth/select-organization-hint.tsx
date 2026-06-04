"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

/** Selector de restaurante tras login como comercio (p. ej. superadmin con varias orgs). */
export function SelectOrganizationHint() {
  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-card p-4 text-left shadow-sm">
      <p className="text-sm font-semibold">Selecciona tu restaurante</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Elige la organización activa en Clerk y te llevaremos al panel del comercio.
      </p>
      <div className="mt-4 flex justify-center">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/post-login?tipo=comercio"
        />
      </div>
    </div>
  );
}
