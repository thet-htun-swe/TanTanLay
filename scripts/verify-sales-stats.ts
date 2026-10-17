import { Sale } from "../types";
import {
  changePercent,
  formatAmount,
  formatCompact,
  periodLabel,
  seriesEnding,
  shift,
  startOf,
  statsFor,
} from "../utils/salesStats";

const expect = (label: string, actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

// Local times (sales count on their order date in the phone's time zone)
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString();
const sale = (orderDate: string, total: number, subtotal = total, pieces = 1): Sale => ({
  date: orderDate,
  orderDate,
  customer: { name: "", contact: "", address: "" },
  items: [{ productId: 1, productName: "x", quantity: pieces, unitPrice: 1, lineTotal: total }],
  subtotal,
  total,
});

const sales = [
  sale(at(2026, 10, 17, 9), 1000, 1200, 2),
  sale(at(2026, 10, 17, 23), 500), // late evening still counts on the 17th
  sale(at(2026, 10, 16), 2000, 2000, 3),
  sale(at(2026, 10, 1, 0), 300), // first minute of the month
  sale(at(2026, 9, 30, 23), 700), // last day of September
  sale(at(2026, 8, 15), 4000),
];

const oct17 = startOf(new Date(2026, 9, 17, 15), "day");
expect("day stats", statsFor(sales, "day", oct17), { total: 1500, count: 2, pieces: 3, discount: 200 });
expect("empty day", statsFor(sales, "day", shift(oct17, "day", 1)), { total: 0, count: 0, pieces: 0, discount: 0 });

const october = startOf(oct17, "month");
expect("month stats", statsFor(sales, "month", october), { total: 3800, count: 4, pieces: 7, discount: 200 });
expect("september", statsFor(sales, "month", shift(october, "month", -1)).total, 700);

expect(
  "7-day series",
  seriesEnding(sales, "day", oct17, 7).map((point) => point.total),
  [0, 0, 0, 0, 0, 2000, 1500],
);
expect(
  "6-month series",
  seriesEnding(sales, "month", october, 6).map((point) => point.total),
  [0, 0, 0, 4000, 700, 3800],
);
// Month shift across the year boundary
expect("jan -> dec", shift(new Date(2027, 0, 1), "month", -1).getMonth(), 11);

expect("change up", changePercent(1500, 2000), -25);
expect("change from zero", changePercent(500, 0), null);

expect("today", periodLabel(oct17, "day", new Date(2026, 9, 17, 8)), "Today");
expect("yesterday", periodLabel(shift(oct17, "day", -1), "day", new Date(2026, 9, 17, 8)), "Yesterday");
expect("month label", periodLabel(october, "month"), "October 2026");

expect("amount", formatAmount(3675000), "3,675,000");
expect("amount decimals", formatAmount(1234.5), "1,234.50");
expect("compact", [formatCompact(1250000), formatCompact(45000), formatCompact(800)], ["1.3M", "45K", "800"]);

console.log("Sales stats check passed");
