import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getCatalogByCommerceSlug } from "@/modules/orders/catalog-public";
import { listMyAddresses } from "@/modules/customers/queries";
import { ShopClient } from "./shop-client";

export const dynamic = "force-dynamic";

export default async function PedirComercioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCatalogByCommerceSlug(slug);
  if (!data) notFound();

  const addresses = await listMyAddresses();

  return (
    <div className="space-y-4">
      <Link
        href="/pedir"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Todos los comercios
      </Link>
      <ShopClient
        commerceName={data.commerce.name}
        commerceSlug={data.commerce.slug}
        catalog={data.catalog}
        addresses={addresses}
      />
    </div>
  );
}
