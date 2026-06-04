import { describe, expect, it } from "vitest";

import { calculateTaxes } from "./tax-calculator";

describe("calculateTaxes", () => {
  it("calcula subtotal, IVA y total para una línea con IVA 19%", () => {
    const { money, taxLines } = calculateTaxes([
      { description: "Pizza", quantity: 2, unitPrice: 1000, taxRate: 0.19 },
    ]);
    expect(money.subtotal).toBe(2000);
    expect(money.taxTotal).toBe(380);
    expect(money.total).toBe(2380);
    expect(taxLines).toHaveLength(1);
    expect(taxLines[0].rate).toBe(0.19);
  });

  it("aplica descuento de línea a la base gravable", () => {
    const { money } = calculateTaxes([
      { description: "Combo", quantity: 1, unitPrice: 10000, taxRate: 0.19, discount: 2000 },
    ]);
    // base gravable = 8000 → IVA 1520 → total = 8000 + 1520
    expect(money.subtotal).toBe(10000);
    expect(money.discountTotal).toBe(2000);
    expect(money.taxTotal).toBe(1520);
    expect(money.total).toBe(9520);
  });

  it("agrupa impuestos por tarifa y excluye 0%", () => {
    const { taxLines } = calculateTaxes([
      { description: "Gaseosa", quantity: 1, unitPrice: 5000, taxRate: 0.19 },
      { description: "Agua", quantity: 1, unitPrice: 3000, taxRate: 0 },
    ]);
    expect(taxLines).toHaveLength(1);
    expect(taxLines[0].rate).toBe(0.19);
  });

  it("maneja carrito vacío sin romper", () => {
    const { money } = calculateTaxes([]);
    expect(money.total).toBe(0);
  });
});
