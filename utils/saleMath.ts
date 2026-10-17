import { DiscountType, SaleItem } from "@/types";

// All sale money maths in one place, so the sale screens, receipt, details
// and server payload always agree.
// Discount is on the whole line: lineTotal = quantity * unitPrice - discount.

const round2 = (value: number) => Math.round(value * 100) / 100;

// Price before discount
export const lineGross = (item: Pick<SaleItem, "quantity" | "unitPrice">) =>
  round2(item.quantity * item.unitPrice);

// Money taken off for a discount entered as an amount or a percentage,
// never below 0 or above the line price
export const discountAmount = (
  gross: number,
  type: DiscountType | undefined,
  value: number | undefined,
) => {
  if (!type || !value || value <= 0) return 0;
  const raw = type === "percent" ? (gross * Math.min(value, 100)) / 100 : value;
  return round2(Math.min(Math.max(raw, 0), gross));
};

// Recalculate discount + lineTotal (call after quantity or discount changes)
export const withLineTotal = (item: SaleItem): SaleItem => {
  const gross = lineGross(item);
  const discount = discountAmount(gross, item.discountType, item.discountValue);
  return {
    ...item,
    discount,
    lineTotal: round2(gross - discount),
  };
};

export const setItemQuantity = (item: SaleItem, quantity: number) =>
  withLineTotal({ ...item, quantity });

// type null removes the discount
export const setItemDiscount = (item: SaleItem, type: DiscountType | null, value: number) =>
  withLineTotal({
    ...item,
    discountType: type && value > 0 ? type : undefined,
    discountValue: type && value > 0 ? value : undefined,
  });

// Sale totals: subtotal before discounts, total after
export const saleTotals = (items: SaleItem[]) => {
  const subtotal = round2(items.reduce((sum, item) => sum + lineGross(item), 0));
  const total = round2(items.reduce((sum, item) => sum + item.lineTotal, 0));
  return { subtotal, total, discountTotal: round2(subtotal - total) };
};
