import {
  getCategories,
  getInventoryProducts,
  getPromotions,
} from "@/modules/inventory/queries";
import { InventoryClient } from "./inventory-client";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const [products, categories, promotions] = await Promise.all([
    getInventoryProducts(),
    getCategories(),
    getPromotions(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Inventario</h2>
        <p className="text-sm text-muted-foreground">
          Productos, stock, categorías, promociones y reglas por horario.
        </p>
      </div>
      <InventoryClient
        products={products}
        categories={categories}
        promotions={promotions}
      />
    </div>
  );
}
