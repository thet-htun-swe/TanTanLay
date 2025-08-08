import { Product, SaleItem } from "@/types";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";
import { ProductSelectorModal } from "./ProductSelectorModal";

interface ProductSelectorProps {
  products: (Product & { id: number })[];
  onAddItem: (item: SaleItem) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  onAddItem,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Add Products</ThemedText>

      <TouchableOpacity onPress={() => setIsModalVisible(true)}>
        <ThemedText style={styles.selectProductText}>
          + select product
        </ThemedText>
      </TouchableOpacity>

      <ProductSelectorModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        products={products}
        onAddItem={onAddItem}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  selectProductText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
    color: "#007AFF",
  },
});
