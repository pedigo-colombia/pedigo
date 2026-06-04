/** Inicio cliente: compensa padding del layout padre para mapa full-bleed. */
export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -mb-4 -mt-4 flex min-h-0 flex-1 flex-col sm:-mx-8 sm:-mb-8 sm:-mt-8">
      {children}
    </div>
  );
}
