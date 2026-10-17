import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Sale } from "@/types";
import {
  changePercent,
  formatAmount,
  formatCompact,
  Period,
  periodLabel,
  seriesEnding,
  shift,
  startOf,
  statsFor,
} from "@/utils/salesStats";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";

const BARS: Record<Period, number> = { day: 7, month: 6 };
const CHART_HEIGHT = 110;
const MAX_BAR_WIDTH = 24;

// Home dashboard: total sales for a day or a month, with the recent trend.
// Tap a column (or use ‹ ›) to look at another day / month.
export function SalesDashboard({ sales }: { sales: Sale[] }) {
  const theme = Colors[useColorScheme() ?? "light"];
  const [period, setPeriod] = useState<Period>("day");
  const [selected, setSelected] = useState(() => startOf(new Date(), "day"));
  // Last column of the chart (moves when ‹ › go past the visible columns)
  const [windowEnd, setWindowEnd] = useState(() => startOf(new Date(), "day"));

  const current = startOf(new Date(), period);
  const isCurrent = selected.getTime() >= current.getTime();

  const stats = useMemo(() => statsFor(sales, period, selected), [sales, period, selected]);
  const previous = useMemo(
    () => statsFor(sales, period, shift(selected, period, -1)),
    [sales, period, selected],
  );
  const series = useMemo(
    () => seriesEnding(sales, period, windowEnd, BARS[period]),
    [sales, period, windowEnd],
  );
  const maxTotal = Math.max(...series.map((point) => point.total), 0);
  const change = changePercent(stats.total, previous.total);

  const choosePeriod = (next: Period) => {
    const start = startOf(new Date(), next);
    setPeriod(next);
    setSelected(start);
    setWindowEnd(start);
  };

  const step = (direction: -1 | 1) => {
    const next = shift(selected, period, direction);
    if (next.getTime() > current.getTime()) return;
    setSelected(next);
    const windowStart = shift(windowEnd, period, -(BARS[period] - 1));
    if (next.getTime() > windowEnd.getTime()) setWindowEnd(next);
    else if (next.getTime() < windowStart.getTime()) setWindowEnd(shift(windowEnd, period, -1));
  };

  return (
    <Card style={styles.card}>
      {/* Day | Month */}
      <View style={[styles.segment, { backgroundColor: theme.surface }]}>
        {(["day", "month"] as const).map((option) => {
          const active = option === period;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => choosePeriod(option)}
              style={[styles.segmentButton, active && { backgroundColor: theme.cardBackground }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, { color: active ? theme.text : theme.muted }]}>
                {option === "day" ? "Daily" : "Monthly"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ‹ Today › */}
      <View style={styles.periodRow}>
        <TouchableOpacity onPress={() => step(-1)} hitSlop={10} accessibilityLabel="Previous">
          <Ionicons name="chevron-back" size={22} color={theme.tint} />
        </TouchableOpacity>
        <ThemedText style={styles.periodLabel}>{periodLabel(selected, period)}</ThemedText>
        <TouchableOpacity
          onPress={() => step(1)}
          disabled={isCurrent}
          hitSlop={10}
          accessibilityLabel="Next"
          style={isCurrent && styles.faded}
        >
          <Ionicons name="chevron-forward" size={22} color={theme.tint} />
        </TouchableOpacity>
      </View>

      {/* Headline: total sales */}
      <ThemedText style={[styles.caption, { color: theme.muted }]}>Total sales</ThemedText>
      <Text style={[styles.hero, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatAmount(stats.total)}
      </Text>
      {change !== null && (
        <View style={styles.changeRow}>
          <Ionicons
            name={change >= 0 ? "arrow-up" : "arrow-down"}
            size={14}
            color={change >= 0 ? theme.success : theme.danger}
          />
          <Text style={[styles.changeText, { color: change >= 0 ? theme.success : theme.danger }]}>
            {Math.abs(change)}%
          </Text>
          <Text style={[styles.changeText, { color: theme.muted }]}>
            vs {period === "day" ? "previous day" : "previous month"}
          </Text>
        </View>
      )}

      {/* Sales · Items · Discount */}
      <View style={[styles.kpis, { borderColor: theme.border }]}>
        {[
          { label: "Sales", value: String(stats.count) },
          { label: "Items sold", value: String(stats.pieces) },
          { label: "Discounts", value: formatAmount(stats.discount) },
        ].map((kpi) => (
          <View key={kpi.label} style={styles.kpi}>
            <Text style={[styles.kpiValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {kpi.value}
            </Text>
            <Text style={[styles.kpiLabel, { color: theme.muted }]}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Columns: last 7 days / 6 months; the selected one is solid */}
      <View style={styles.chartHeader}>
        <ThemedText style={[styles.caption, { color: theme.muted }]}>
          {period === "day" ? "Last 7 days" : "Last 6 months"}
        </ThemedText>
        {maxTotal > 0 && (
          <Text style={[styles.axisText, { color: theme.muted }]}>max {formatCompact(maxTotal)}</Text>
        )}
      </View>
      <View style={styles.chart}>
        {series.map((point) => {
          const isSelected = point.start.getTime() === selected.getTime();
          const height = maxTotal > 0 ? Math.round((point.total / maxTotal) * CHART_HEIGHT) : 0;
          return (
            <Pressable
              key={point.start.toISOString()}
              style={styles.slot}
              onPress={() => setSelected(point.start)}
              accessibilityRole="button"
              accessibilityLabel={`${periodLabel(point.start, period)}: ${formatAmount(point.total)}`}
            >
              <View style={[styles.barArea, { borderBottomColor: theme.border }]}>
                {height > 0 && (
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(height, 4), backgroundColor: theme.chart },
                      !isSelected && styles.barMuted,
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.axisText,
                  { color: isSelected ? theme.text : theme.muted },
                  isSelected && styles.axisSelected,
                ]}
              >
                {point.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  faded: {
    opacity: 0.3,
  },
  caption: {
    fontSize: 13,
    marginTop: 14,
  },
  hero: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "700",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  kpis: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingVertical: 12,
  },
  kpi: {
    flex: 1,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  kpiLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  slot: {
    flex: 1,
    alignItems: "center",
  },
  // Bottom border of each column area = the chart baseline
  barArea: {
    height: CHART_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    width: "60%",
    maxWidth: MAX_BAR_WIDTH,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barMuted: {
    opacity: 0.35,
  },
  axisText: {
    fontSize: 12,
    marginTop: 6,
  },
  axisSelected: {
    fontWeight: "700",
  },
});
