import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="font-heading text-5xl font-extrabold text-brand-orange">404</span>
      <h2 className="text-xl font-semibold">Página no encontrada</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        La página que buscas no existe o fue movida.
      </p>
      <Link href="/" className={buttonVariants()}>
        Volver al inicio
      </Link>
    </div>
  );
}
