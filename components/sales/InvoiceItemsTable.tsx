import { SaleItem } from "@/types";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";

interface InvoiceItemsTableProps {
  items: SaleItem[];
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  items,
}) => {
  return (
    <Card style={styles.card}>
      <ThemedText style={styles.sectionTitle}>Items</ThemedText>

      <View style={styles.tableHeader}>
        <ThemedText style={[styles.tableHeaderText, styles.noCol]}>
          No.
        </ThemedText>
        <ThemedText style={[styles.tableHeaderText, styles.productCol]}>
          Product
        </ThemedText>
        <ThemedText style={[styles.tableHeaderText, styles.qtyCol]}>
          Qty
        </ThemedText>
        <ThemedText style={[styles.tableHeaderText, styles.priceCol]}>
          Price
        </ThemedText>
        <ThemedText style={[styles.tableHeaderText, styles.totalCol]}>
          Total
        </ThemedText>
      </View>

      {items.map((item, index) => (
        <View
          key={item.productId?.toString() ?? `item-${item.productName}`}
          style={styles.tableRow}
        >
          <ThemedText style={styles.noCol}>{index + 1}.</ThemedText>
          <ThemedText style={styles.productCol}>{item.productName}</ThemedText>
          <ThemedText style={styles.qtyCol}>{item.quantity}</ThemedText>
          <ThemedText style={styles.priceCol}>
            {item.unitPrice.toFixed(2)}
          </ThemedText>
          <ThemedText style={styles.totalCol}>
            {item.lineTotal.toFixed(2)}
          </ThemedText>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  noCol: {
    width: "5%",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  productCol: {
    width: "40%",
    paddingHorizontal: 2,
  },
  qtyCol: {
    width: "15%",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  priceCol: {
    width: "17.5%",
    textAlign: "right",
    paddingHorizontal: 2,
  },
  totalCol: {
    width: "17.5%",
    textAlign: "right",
    paddingHorizontal: 2,
  },
});
