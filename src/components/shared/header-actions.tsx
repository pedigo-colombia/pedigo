"use client";

import { UserButton } from "@clerk/nextjs";

import { ThemeToggle } from "./theme-toggle";

/** Acciones de cabecera: tema + usuario Clerk. */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <UserButton />
    </div>
  );
}
