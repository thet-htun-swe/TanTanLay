import { Ionicons } from "@expo/vector-icons";
import React, { ComponentProps, ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Sale } from "@/types";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";

const money = (value: number) => value.toFixed(2);

// e.g. "17 Oct 2026, 5:26 PM"
const formatDateTime = (value: string) => {
  const date = new Date(value);
  const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
};

const InfoRow = ({
  icon,
  label,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  children: ReactNode;
}) => {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={theme.muted} style={styles.infoIcon} />
      <ThemedText style={[styles.infoLabel, { color: theme.muted }]}>{label}</ThemedText>
      <View style={styles.infoValue}>{children}</View>
    </View>
  );
};

// Sale details for shop staff (not the customer receipt): includes who made
// the sale. The customer-facing receipt is components/sales/ReceiptView.tsx.
export function SaleDetailsView({ sale }: { sale: Sale & { id: number } }) {
  const theme = Colors[useColorScheme() ?? "light"];
  const pieces = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Card>
        <ThemedText style={[styles.invoice, { color: theme.muted }]}>
          Invoice #{sale.invoiceNumber ?? sale.id}
        </ThemedText>
        <ThemedText style={[styles.total, { color: theme.tint }]}>{money(sale.total)}</ThemedText>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <InfoRow icon="calendar-outline" label="Order date">
          <ThemedText style={styles.value}>{formatDateTime(sale.orderDate)}</ThemedText>
        </InfoRow>
        <InfoRow icon="person-circle-outline" label="Created by">
          <ThemedText style={styles.valueStrong}>{sale.createdByName || "Unknown"}</ThemedText>
          <ThemedText style={[styles.subValue, { color: theme.muted }]}>
            {formatDateTime(sale.date)}
          </ThemedText>
        </InfoRow>
      </Card>

      <Card>
        <ThemedText style={styles.sectionTitle}>Customer</ThemedText>
        <ThemedText style={styles.valueStrong}>{sale.customer.name || "Walk-in customer"}</ThemedText>
        {!!sale.customer.contact && (
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={15} color={theme.muted} />
            <ThemedText style={[styles.value, { color: theme.muted }]}>{sale.customer.contact}</ThemedText>
          </View>
        )}
        {!!sale.customer.address && (
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={15} color={theme.muted} />
            <ThemedText style={[styles.value, styles.flex, { color: theme.muted }]}>
              {sale.customer.address}
            </ThemedText>
          </View>
        )}
      </Card>

      <Card>
        <ThemedText style={styles.sectionTitle}>
          Items · {sale.items.length} {sale.items.length === 1 ? "product" : "products"}, {pieces}{" "}
          {pieces === 1 ? "pc" : "pcs"}
        </ThemedText>
        {sale.items.map((item, index) => (
          <View
            key={`${item.productId}-${index}`}
            style={[
              styles.item,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.itemNumber, { color: theme.muted }]}>{index + 1}.</ThemedText>
            <View style={styles.flex}>
              <ThemedText style={styles.itemName}>{item.productName}</ThemedText>
              <ThemedText style={[styles.subValue, { color: theme.muted }]}>
                {item.quantity} × {money(item.unitPrice)}
              </ThemedText>
            </View>
            <ThemedText style={styles.itemTotal}>{money(item.lineTotal)}</ThemedText>
          </View>
        ))}

        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        {sale.subtotal !== sale.total && (
          <View style={styles.totalRow}>
            <ThemedText style={{ color: theme.muted }}>Subtotal</ThemedText>
            <ThemedText>{money(sale.subtotal)}</ThemedText>
          </View>
        )}
        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Total</ThemedText>
          <ThemedText style={[styles.totalLabel, { color: theme.tint }]}>{money(sale.total)}</ThemedText>
        </View>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  invoice: {
    fontSize: 14,
  },
  total: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  infoLabel: {
    width: 92,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
  },
  value: {
    fontSize: 14,
  },
  valueStrong: {
    fontSize: 15,
    fontWeight: "600",
  },
  subValue: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.7,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: 8,
  },
  itemNumber: {
    minWidth: 22,
    fontSize: 15,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
});
