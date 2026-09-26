import { Product, SaleItem } from "@/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ProductSelectorModal } from "./ProductSelectorModal";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

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
  const theme = Colors[useColorScheme() ?? "light"];
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <Card style={styles.card}>
      {/* Header with title and select button */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Sale Items</ThemedText>
        <Button
          title="+ select product"
          onPress={() => setIsModalVisible(true)}
          variant="primary"
          style={styles.selectButton}
        />
      </View>

      {/* Items table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <ThemedText style={[styles.headerText, styles.productColumn, { color: theme.muted }]}>
            Product
          </ThemedText>
          <ThemedText style={[styles.headerText, styles.priceColumn, { color: theme.muted }]}>
            Price
          </ThemedText>
          <ThemedText style={[styles.headerText, styles.quantityColumn, { color: theme.muted }]}>
            Qty
          </ThemedText>
          <ThemedText style={[styles.headerText, styles.totalColumn, { color: theme.muted }]}>
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
                style={[styles.tableRow, { borderBottomColor: theme.border }]}
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
                    style={[styles.quantityButton, { backgroundColor: theme.tint }]}
                    onPress={() =>
                      onUpdateQuantity(item.productId, item.quantity - 1)
                    }
                  >
                    <ThemedText style={[styles.quantityButtonText, { color: theme.onTint }]}>-</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.quantityText}>
                    {item.quantity}
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.quantityButton, { backgroundColor: theme.tint }]}
                    onPress={() =>
                      onUpdateQuantity(item.productId, item.quantity + 1)
                    }
                  >
                    <ThemedText style={[styles.quantityButtonText, { color: theme.onTint }]}>+</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.totalColumn}>
                  <ThemedText style={[styles.totalText, { color: theme.tint }]}>
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
                      color={theme.danger}
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
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  table: {
    borderRadius: 6,
    overflow: "hidden",
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  tableBody: {
    maxHeight: 300,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    alignItems: "center",
    minHeight: 36,
  },
  headerText: {
    fontWeight: "600",
    fontSize: 14,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
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
