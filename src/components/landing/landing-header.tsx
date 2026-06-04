import Link from "next/link";

import { PedigoLogo } from "@/components/brand/pedigo-logo";
import { ButtonLink } from "@/components/ui/button-link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { signInPath } from "@/lib/auth/access-types";

export function LandingHeader({
  isSignedIn,
}: {
  isSignedIn: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <PedigoLogo size="md" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#ecosistema"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Ecosistema
          </a>
          <a
            href="#funciones"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Funciones
          </a>
          <a
            href="#como-funciona"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Cómo funciona
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isSignedIn ? (
            <ButtonLink href="/post-login" size="sm">
              Ir a mi panel
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href={signInPath("cliente")} variant="ghost" size="sm" className="hidden sm:inline-flex">
                Entrar
              </ButtonLink>
              <ButtonLink href="/acceso" variant="outline" size="sm">
                Acceso
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
