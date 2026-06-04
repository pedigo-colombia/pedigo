"use client";

import { type ReactNode } from "react";

import { CustomerCartProvider } from "@/contexts/customer-cart-context";
import { CustomerCartPeekBar } from "@/components/customer/customer-cart-peek-bar";
import { CustomerCartSheet } from "@/components/customer/customer-cart-sheet";
import { CustomerMobileNav } from "@/components/shared/customer-mobile-nav";

export function CustomerLayoutShell({ children }: { children: ReactNode }) {
  return (
    <CustomerCartProvider>
      {children}
      <CustomerCartPeekBar />
      <CustomerCartSheet />
      <CustomerMobileNav />
    </CustomerCartProvider>
  );
}
