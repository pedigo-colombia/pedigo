import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/modules/auth/guards";
import {
  DataCard,
  DataCardList,
  DataCardRow,
  DataTableDesktop,
} from "@/components/shared/data-card";
import { DashboardPage } from "@/components/shared/dashboard-page";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { CreateOrganizationForm } from "./create-organization-form";

export default async function ComerciosPage() {
  await requireSuperadmin();

  const db = createSupabaseAdminClient();
  const { data: orgs } = await db
    .from("organizations")
    .select("id, name, slug, status, plan, created_at")
    .order("created_at", { ascending: false });

  const rows = (orgs ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    created_at: string;
  }>;

  return (
    <DashboardPage>
      <PageHeader
        title="Comercios"
        description="Crea comercios e invita a sus administradores."
        action={<CreateOrganizationForm />}
      />

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Aún no hay comercios. Crea el primero.
        </p>
      ) : (
        <>
          <DataCardList>
            {rows.map((o) => (
              <DataCard key={o.id}>
                <p className="font-semibold">{o.name}</p>
                <DataCardRow label="Slug">
                  <span className="break-all font-mono text-xs">{o.slug}</span>
                </DataCardRow>
                <DataCardRow label="Plan">{o.plan}</DataCardRow>
                <DataCardRow label="Estado">
                  <Badge variant={o.status === "active" ? "default" : "secondary"}>
                    {o.status}
                  </Badge>
                </DataCardRow>
              </DataCard>
            ))}
          </DataCardList>

          <DataTableDesktop>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell className="text-muted-foreground">{o.slug}</TableCell>
                    <TableCell>{o.plan}</TableCell>
                    <TableCell>
                      <Badge
                        variant={o.status === "active" ? "default" : "secondary"}
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableDesktop>
        </>
      )}
    </DashboardPage>
  );
}
