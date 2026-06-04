import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export function DashboardTopbar({ heading }: { heading: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{heading}</h1>
      <div className="flex items-center gap-4">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/post-login"
        />
        <UserButton />
      </div>
    </header>
  );
}
