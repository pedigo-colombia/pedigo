import { listPlatformUsers } from "@/modules/admin/queries";
import { Badge } from "@/components/ui/badge";
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

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const users = await listPlatformUsers();

  return (
    <DashboardPage>
      <PageHeader
        title="Usuarios de la plataforma"
        description="Espejo de usuarios sincronizados desde Clerk (webhook). Para roles de plataforma, edita la metadata en el dashboard de Clerk."
      />

      {users.length === 0 ? (
        <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Aún no hay usuarios sincronizados. Regístrate o espera el webhook de Clerk.
        </p>
      ) : (
        <>
          <DataCardList>
            {users.map((u) => (
              <DataCard key={u.id}>
                <p className="font-semibold">{u.fullName ?? "Sin nombre"}</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {u.email ?? "—"}
                </p>
                <DataCardRow label="Rol">
                  {u.platformRole === "superadmin" ? (
                    <Badge>Superadmin</Badge>
                  ) : (
                    <Badge variant="outline">Usuario</Badge>
                  )}
                </DataCardRow>
                <DataCardRow label="Registro">
                  {new Date(u.createdAt).toLocaleDateString("es-CO")}
                </DataCardRow>
              </DataCard>
            ))}
          </DataCardList>

          <DataTableDesktop>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol plataforma</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.fullName ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] text-muted-foreground">
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {u.platformRole === "superadmin" ? (
                        <Badge>Superadmin</Badge>
                      ) : (
                        <Badge variant="outline">Usuario</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("es-CO")}
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
