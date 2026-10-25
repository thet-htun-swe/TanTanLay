import { Sale } from "@/types";

// Sales totals per day / month for the Home dashboard.
// A sale counts on its ORDER date, in the phone's local time (same day the
// invoice number uses).

export type Period = "day" | "month";

// Only what the dashboard needs from a sale (a full Sale also fits)
export type StatsSale = Pick<Sale, "orderDate" | "subtotal" | "total"> & {
  items: { quantity: number }[];
};

export interface PeriodStats {
  total: number; // after discounts
  count: number; // number of sales
  pieces: number; // items sold
  discount: number;
}

export interface SeriesPoint {
  start: Date; // first moment of the day / month
  label: string; // short x-axis label
  total: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export const startOf = (date: Date, period: Period) =>
  period === "day"
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
    : new Date(date.getFullYear(), date.getMonth(), 1);

// Move a period start by n days / months (n can be negative)
export const shift = (start: Date, period: Period, n: number) =>
  period === "day"
    ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + n)
    : new Date(start.getFullYear(), start.getMonth() + n, 1);

const keyOf = (date: Date, period: Period) =>
  period === "day"
    ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    : `${date.getFullYear()}-${date.getMonth()}`;

// Totals for every day (or month) that has sales, by key
const groupSales = (sales: StatsSale[], period: Period) => {
  const groups = new Map<string, PeriodStats>();
  for (const sale of sales) {
    const key = keyOf(new Date(sale.orderDate), period);
    const stats = groups.get(key) ?? { total: 0, count: 0, pieces: 0, discount: 0 };
    stats.total += sale.total;
    stats.count += 1;
    stats.pieces += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    stats.discount += Math.max(0, sale.subtotal - sale.total);
    groups.set(key, stats);
  }
  return groups;
};

export const statsFor = (sales: StatsSale[], period: Period, start: Date): PeriodStats => {
  const stats = groupSales(sales, period).get(keyOf(start, period));
  return stats
    ? { ...stats, total: round2(stats.total), discount: round2(stats.discount) }
    : { total: 0, count: 0, pieces: 0, discount: 0 };
};

// The `count` periods ending with `end` (oldest first), for the chart
export const seriesEnding = (sales: StatsSale[], period: Period, end: Date, count: number): SeriesPoint[] => {
  const groups = groupSales(sales, period);
  return Array.from({ length: count }, (_, i) => {
    const start = shift(end, period, i - (count - 1));
    return {
      start,
      label:
        period === "day"
          ? start.toLocaleDateString("en-US", { weekday: "short" })
          : start.toLocaleDateString("en-US", { month: "short" }),
      total: round2(groups.get(keyOf(start, period))?.total ?? 0),
    };
  });
};

// Change vs the previous period, in percent (null when there is nothing to compare)
export const changePercent = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

// e.g. "Today", "Yesterday", "Mon, 13 Oct" / "October 2026"
export const periodLabel = (start: Date, period: Period, now = new Date()) => {
  if (period === "month") {
    return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const today = startOf(now, "day").getTime();
  if (start.getTime() === today) return "Today";
  if (start.getTime() === shift(startOf(now, "day"), "day", -1).getTime()) return "Yesterday";
  return start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

// 3675000 -> "3,675,000", 1234.5 -> "1,234.50"
export const formatAmount = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });

// Short axis label: 1250000 -> "1.3M", 45000 -> "45K"
export const formatCompact = (value: number) =>
  value >= 1_000_000
    ? `${+(value / 1_000_000).toFixed(1)}M`
    : value >= 1_000
      ? `${+(value / 1_000).toFixed(1)}K`
      : String(Math.round(value));
