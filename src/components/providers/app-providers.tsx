"use client";

import { useTheme } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { dark } from "@clerk/themes";

import { Toaster } from "@/components/ui/sonner";

/**
 * Clerk y Sonner sincronizados con el tema activo (claro/oscuro/sistema).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ClerkProvider
      localization={esES}
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: "#ea580c",
          borderRadius: "0.625rem",
        },
      }}
    >
      {children}
      <Toaster richColors position="top-right" theme={isDark ? "dark" : "light"} />
    </ClerkProvider>
  );
}
