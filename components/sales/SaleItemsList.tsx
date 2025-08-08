import { SaleItem } from "@/types";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";

interface SaleItemsListProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: number | string, quantity: number) => void;
  onRemoveItem: (productId: number | string) => void;
}

export const SaleItemsList: React.FC<SaleItemsListProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      {/* <ThemedText style={styles.title}>Sale Items</ThemedText> */}

      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <ThemedText style={[styles.headerText, styles.productColumn]}>
            Product
          </ThemedText>
          <ThemedText style={[styles.headerText, styles.priceColumn]}>
            Price
          </ThemedText>
          <ThemedText style={[styles.headerText, styles.quantityColumn]}>
            Qty
          </ThemedText>
          <ThemedText style={[styles.headerText, styles.totalColumn]}>
            Total
          </ThemedText>
          <View style={styles.actionColumn} />
        </View>

        {/* Table Body */}
        <ScrollView style={styles.tableBody} nestedScrollEnabled>
          {items.map((item) => (
            <View
              key={item.productId?.toString() ?? `item-${item.productName}`}
              style={styles.tableRow}
            >
              <View style={styles.productColumn}>
                <ThemedText style={styles.productName} numberOfLines={2}>
                  {item.productName}
                </ThemedText>
              </View>

              <View style={styles.priceColumn}>
                <ThemedText style={styles.cellText}>
                  ${item.unitPrice.toFixed(2)}
                </ThemedText>
              </View>

              <View style={[styles.quantityColumn, styles.quantityCell]}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    onUpdateQuantity(item.productId, item.quantity - 1)
                  }
                >
                  <ThemedText style={styles.quantityButtonText}>-</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.quantityText}>
                  {item.quantity}
                </ThemedText>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    onUpdateQuantity(item.productId, item.quantity + 1)
                  }
                >
                  <ThemedText style={styles.quantityButtonText}>+</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.totalColumn}>
                <ThemedText style={styles.totalText}>
                  ${item.lineTotal.toFixed(2)}
                </ThemedText>
              </View>

              <View style={styles.actionColumn}>
                <TouchableOpacity onPress={() => onRemoveItem(item.productId)}>
                  <ThemedText style={styles.removeText}>×</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  table: {
    // borderWidth: 1,
    // borderColor: "#e0e0e0",
    borderRadius: 6,
    overflow: "hidden",
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableBody: {
    maxHeight: 300,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
    minHeight: 36,
  },
  headerText: {
    fontWeight: "600",
    fontSize: 12,
    color: "#666",
    textAlign: "left",
  },
  cellText: {
    fontSize: 12,
    textAlign: "center",
  },
  productColumn: {
    width: "40%",
    paddingHorizontal: 2,
  },
  priceColumn: {
    width: "15%",
    paddingHorizontal: 2,
  },
  quantityColumn: {
    width: "20%",
    paddingHorizontal: 2,
  },
  totalColumn: {
    width: "15%",
    paddingHorizontal: 2,
  },
  actionColumn: {
    width: "10%",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 14,
  },
  totalText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: "#007AFF",
  },
  quantityCell: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButton: {
    backgroundColor: "#007AFF",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  quantityText: {
    marginHorizontal: 4,
    fontSize: 12,
    fontWeight: "500",
    minWidth: 16,
    textAlign: "center",
  },
  removeText: {
    color: "#ff6b6b",
    fontSize: 16,
    fontWeight: "bold",
    width: 20,
    height: 20,
    textAlign: "center",
    textAlignVertical: "center",
  },
});
