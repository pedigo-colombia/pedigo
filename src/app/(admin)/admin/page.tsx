import { Building2, Receipt, Truck, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const kpis = [
  { label: "Comercios", value: "0", icon: Building2 },
  { label: "Usuarios", value: "0", icon: Users },
  { label: "Repartidores", value: "0", icon: Truck },
  { label: "Facturas emitidas", value: "0", icon: Receipt },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Resumen de la plataforma</h2>
        <p className="text-sm text-muted-foreground">
          Control global. El superadmin crea comercios e invita a sus usuarios.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
