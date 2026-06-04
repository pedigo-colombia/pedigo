import { listPlatformUsers } from "@/modules/admin/queries";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Usuarios de la plataforma</h2>
        <p className="text-sm text-muted-foreground">
          Espejo de usuarios sincronizados desde Clerk (webhook). Para roles de
          plataforma, edita la metadata en el dashboard de Clerk.
        </p>
      </div>

      <Card className="p-0">
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
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  Aún no hay usuarios sincronizados. Regístrate o espera el
                  webhook de Clerk.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.fullName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
