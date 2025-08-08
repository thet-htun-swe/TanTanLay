import { Product, SaleItem } from "@/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";
import { ProductSelectorModal } from "./ProductSelectorModal";

interface SaleItemsListProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: number | string, quantity: number) => void;
  onRemoveItem: (productId: number | string) => void;
  onAddProduct: (item: SaleItem) => void;
  products: (Product & { id: number })[];
}

export const SaleItemsList: React.FC<SaleItemsListProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onAddProduct,
  products,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <Card style={styles.card}>
      {/* Header with title and select button */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Sale Items</ThemedText>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setIsModalVisible(true)}
        >
          <ThemedText style={styles.selectButtonText}>
            + select product
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Items table */}
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
        {items.length > 0 && (
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
                  <TouchableOpacity
                    onPress={() => onRemoveItem(item.productId)}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={16}
                      color="#ff6b6b"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        products={products}
        onAddItem={onAddProduct}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  selectButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  table: {
    borderRadius: 6,
    overflow: "hidden",
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
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
    fontSize: 14,
    color: "#666",
    textAlign: "left",
  },
  cellText: {
    fontSize: 14,
    textAlign: "left",
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
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 14,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "left",
    color: "#007AFF",
  },
  quantityCell: {
    alignItems: "center",
    justifyContent: "flex-start",
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
    fontSize: 14,
    fontWeight: "500",
    minWidth: 16,
    textAlign: "center",
  },
  removeButton: {
    padding: 4,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
