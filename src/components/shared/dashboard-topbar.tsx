import { OrganizationSwitcher } from "@clerk/nextjs";

import type { AccessTipo } from "@/lib/auth/access-types";
import { DashboardMobileMenu } from "./dashboard-mobile-menu";
import { HeaderActions } from "./header-actions";
import type { NavItem } from "./nav-config";

export function DashboardTopbar({
  heading,
  accessTipo = "comercio",
  menuItems,
  menuTitle,
}: {
  heading: string;
  accessTipo?: AccessTipo;
  menuItems?: NavItem[];
  menuTitle?: string;
}) {
  const afterOrgUrl = `/post-login?tipo=${accessTipo}`;

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {menuItems && menuTitle ? (
          <DashboardMobileMenu items={menuItems} title={menuTitle} />
        ) : null}
        <h1 className="truncate text-base font-semibold sm:text-lg">{heading}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl={afterOrgUrl}
        />
        <HeaderActions />
      </div>
    </header>
  );
}
