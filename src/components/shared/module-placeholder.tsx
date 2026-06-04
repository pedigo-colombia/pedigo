import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Placeholder para módulos cuya UI se construye en fases posteriores.
 * Documenta qué incluirá el módulo, de modo que la base sea navegable.
 */
export function ModulePlaceholder({
  title,
  description,
  phase,
  features,
}: {
  title: string;
  description: string;
  phase: string;
  features: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge variant="secondary">{phase}</Badge>
      </div>
      <p className="text-muted-foreground">{description}</p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incluirá</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
