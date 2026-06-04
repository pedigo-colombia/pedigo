"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  cartItemCount,
  cartTotals,
  loadStoredCart,
  saveStoredCart,
  type CartLine,
} from "@/lib/customer-cart/types";
import type { CustomerAddress } from "@/modules/customers/queries";
import type { CatalogExtra, CatalogProduct } from "@/modules/pos/types";

export interface ShopCartHostState {
  fulfillment: "pickup" | "delivery";
  setFulfillment: (v: "pickup" | "delivery") => void;
  addresses: CustomerAddress[];
  addressId: string;
  setAddressId: (id: string) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onCheckout: () => void;
  isPending: boolean;
}

interface CustomerCartContextValue {
  commerceSlug: string | null;
  commerceName: string | null;
  setCommerce: (slug: string, name: string) => void;
  cart: CartLine[];
  itemCount: number;
  totals: ReturnType<typeof cartTotals>;
  addLine: (
    product: CatalogProduct,
    variantId: string | null,
    extras: CatalogExtra[],
  ) => void;
  changeQty: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  openCart: () => void;
  badgePulse: boolean;
  hasItems: boolean;
  shopHost: ShopCartHostState | null;
  setShopHost: (host: ShopCartHostState | null) => void;
}

const CustomerCartContext = createContext<CustomerCartContextValue | null>(null);

export function CustomerCartProvider({ children }: { children: ReactNode }) {
  const [commerceSlug, setCommerceSlug] = useState<string | null>(null);
  const [commerceName, setCommerceName] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [shopHost, setShopHost] = useState<ShopCartHostState | null>(null);
  const lineSeq = useRef(0);
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = loadStoredCart();
    if (stored) {
      setCommerceSlug(stored.commerceSlug);
      setCommerceName(stored.commerceName);
      setCart(stored.lines);
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (!commerceSlug) return;
    saveStoredCart(
      cart.length > 0
        ? { commerceSlug, commerceName: commerceName ?? commerceSlug, lines: cart }
        : null,
    );
  }, [cart, commerceSlug, commerceName]);

  const setCommerce = useCallback((slug: string, name: string) => {
    setCommerceSlug(slug);
    setCommerceName(name);
    const stored = loadStoredCart();
    if (stored?.commerceSlug === slug) {
      setCart(stored.lines);
      if (stored.commerceName) setCommerceName(stored.commerceName);
    } else {
      setCart([]);
    }
  }, []);

  const addLine = useCallback(
    (product: CatalogProduct, variantId: string | null, extras: CatalogExtra[]) => {
      const variant = product.variants.find((v) => v.id === variantId) ?? null;
      const unitPrice =
        product.basePrice +
        (variant?.priceDelta ?? 0) +
        extras.reduce((acc, e) => acc + e.price, 0);
      const label = variant ? `${product.name} (${variant.name})` : product.name;
      const key = `${product.id}-${variantId ?? "base"}-${extras
        .map((e) => e.id)
        .join("_")}-${(lineSeq.current += 1)}`;

      setCart((prev) => [
        ...prev,
        {
          key,
          productId: product.id,
          label,
          variantId,
          unitPrice,
          taxRate: product.taxRate,
          quantity: 1,
          extras,
        },
      ]);
      setBadgePulse(true);
      window.setTimeout(() => setBadgePulse(false), 1200);
    },
    [],
  );

  const changeQty = useCallback((key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.key === key ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartOpen(false);
  }, []);

  const openCart = useCallback(() => {
    if (cart.length > 0) setCartOpen(true);
  }, [cart.length]);

  const itemCount = useMemo(() => cartItemCount(cart), [cart]);
  const totals = useMemo(() => cartTotals(cart), [cart]);
  const hasItems = cart.length > 0;

  const value = useMemo(
    (): CustomerCartContextValue => ({
      commerceSlug,
      commerceName,
      setCommerce,
      cart,
      itemCount,
      totals,
      addLine,
      changeQty,
      removeLine,
      clearCart,
      cartOpen,
      setCartOpen,
      openCart,
      badgePulse,
      hasItems,
      shopHost,
      setShopHost,
    }),
    [
      commerceSlug,
      commerceName,
      setCommerce,
      cart,
      itemCount,
      totals,
      addLine,
      changeQty,
      removeLine,
      clearCart,
      cartOpen,
      openCart,
      badgePulse,
      hasItems,
      shopHost,
    ],
  );

  return (
    <CustomerCartContext.Provider value={value}>{children}</CustomerCartContext.Provider>
  );
}

export function useCustomerCart() {
  const ctx = useContext(CustomerCartContext);
  if (!ctx) {
    throw new Error("useCustomerCart debe usarse dentro de CustomerCartProvider");
  }
  return ctx;
}

export function useCustomerCartOptional() {
  return useContext(CustomerCartContext);
}
