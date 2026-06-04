import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/modules/auth/guards";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Comercios</h2>
          <p className="text-sm text-muted-foreground">
            Crea comercios e invita a sus administradores.
          </p>
        </div>
        <CreateOrganizationForm />
      </div>

      <Card className="p-0">
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  Aún no hay comercios. Crea el primero.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.slug}
                  </TableCell>
                  <TableCell>{o.plan}</TableCell>
                  <TableCell>
                    <Badge
                      variant={o.status === "active" ? "default" : "secondary"}
                    >
                      {o.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
