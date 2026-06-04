"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/** Tema resuelto (evita parpadeo en hidratación de mapas). */
export function useResolvedDark(): boolean {
  const { resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(resolvedTheme === "dark");
  }, [resolvedTheme]);

  return isDark;
}
