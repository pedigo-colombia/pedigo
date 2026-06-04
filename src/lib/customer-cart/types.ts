import type { CatalogExtra } from "@/modules/pos/types";

export interface CartLine {
  key: string;
  productId: string;
  label: string;
  variantId: string | null;
  unitPrice: number;
  taxRate: number;
  quantity: number;
  extras: CatalogExtra[];
}

export interface StoredCart {
  commerceSlug: string;
  commerceName: string;
  lines: CartLine[];
}

const STORAGE_KEY = "pedigo-cart-v1";

export function loadStoredCart(): StoredCart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCart;
    if (!parsed.commerceSlug || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredCart(cart: StoredCart | null) {
  if (typeof window === "undefined") return;
  try {
    if (!cart || cart.lines.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
  } catch {
    /* ignore quota */
  }
}

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  const tax = lines.reduce(
    (acc, l) => acc + l.unitPrice * l.quantity * l.taxRate,
    0,
  );
  return { subtotal, tax, total: subtotal + tax };
}

export function cartItemCount(lines: CartLine[]) {
  return lines.reduce((acc, l) => acc + l.quantity, 0);
}
