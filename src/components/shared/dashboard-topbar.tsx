import { OrganizationSwitcher } from "@clerk/nextjs";

import { HeaderActions } from "./header-actions";

export function DashboardTopbar({ heading }: { heading: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{heading}</h1>
      <div className="flex items-center gap-3">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/post-login"
        />
        <HeaderActions />
      </div>
    </header>
  );
}
