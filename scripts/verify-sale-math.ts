import { SaleItem } from "../types";
import {
  discountAmount,
  saleTotals,
  setItemDiscount,
  setItemQuantity,
  withLineTotal,
} from "../utils/saleMath";

const expect = (label: string, actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const shirt: SaleItem = withLineTotal({
  productId: 1,
  productName: "Shirt",
  quantity: 3,
  unitPrice: 24500,
  lineTotal: 0,
});
expect("no discount", [shirt.discount, shirt.lineTotal], [0, 73500]);

// Percent on the whole line: 10% of 73500
const percent = setItemDiscount(shirt, "percent", 10);
expect("10% discount", [percent.discount, percent.lineTotal], [7350, 66150]);

// Percent follows the quantity
const percentMore = setItemQuantity(percent, 4);
expect("10% after qty 4", [percentMore.discount, percentMore.lineTotal], [9800, 88200]);

// Amount stays the same when quantity changes
const amount = setItemDiscount(shirt, "amount", 2000);
expect("2000 off", [amount.discount, amount.lineTotal], [2000, 71500]);
expect("2000 off after qty 1", setItemQuantity(amount, 1).lineTotal, 22500);

// Never more than the line price
expect("amount capped", setItemQuantity(setItemDiscount(shirt, "amount", 30000), 1).lineTotal, 0);
expect("percent capped at 100", discountAmount(1000, "percent", 150), 1000);

// Removing a discount
const removed = setItemDiscount(percent, null, 0);
expect("removed", [removed.discount, removed.discountType, removed.lineTotal], [0, undefined, 73500]);

// Rounding to 2 decimals: 15% of 3 x 333.33
expect("rounding", setItemDiscount({ ...shirt, unitPrice: 333.33 }, "percent", 15).discount, 150);

// Sale totals: subtotal before discounts, total after
const pants = setItemDiscount(
  withLineTotal({ productId: 2, productName: "Pants", quantity: 1, unitPrice: 36500, lineTotal: 0 }),
  "amount",
  2000,
);
expect("totals", saleTotals([percent, pants]), { subtotal: 110000, total: 100650, discountTotal: 9350 });

console.log("Sale maths check passed");
