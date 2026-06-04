import type {
  InvoiceLineInput,
  MoneyBreakdown,
  TaxLine,
} from "./types";

/**
 * Calculadora de impuestos.
 *
 * Diseñada para Colombia (IVA 19% / 5% / 0% e INC futuro) pero parametrizable
 * por línea. Trabaja en pesos (COP) sin decimales por defecto, redondeando al
 * peso más cercano. Mantener PURA (sin side-effects) facilita los tests.
 */

const round = (n: number) => Math.round(n);

export interface TaxResult {
  money: MoneyBreakdown;
  taxLines: TaxLine[];
}

export function calculateTaxes(lines: InvoiceLineInput[]): TaxResult {
  const byRate = new Map<number, { base: number; amount: number }>();

  let subtotal = 0;
  let discountTotal = 0;

  for (const line of lines) {
    const gross = line.unitPrice * line.quantity;
    const discount = line.discount ?? 0;
    const taxableBase = Math.max(gross - discount, 0);

    subtotal += gross;
    discountTotal += discount;

    const taxAmount = taxableBase * line.taxRate;
    const entry = byRate.get(line.taxRate) ?? { base: 0, amount: 0 };
    entry.base += taxableBase;
    entry.amount += taxAmount;
    byRate.set(line.taxRate, entry);
  }

  const taxLines: TaxLine[] = [...byRate.entries()]
    .filter(([rate]) => rate > 0)
    .map(([rate, { base, amount }]) => ({
      rate,
      taxableBase: round(base),
      amount: round(amount),
    }));

  const taxTotal = taxLines.reduce((acc, t) => acc + t.amount, 0);
  const netSubtotal = round(subtotal - discountTotal);

  return {
    taxLines,
    money: {
      subtotal: round(subtotal),
      discountTotal: round(discountTotal),
      taxTotal: round(taxTotal),
      total: netSubtotal + taxTotal,
    },
  };
}
