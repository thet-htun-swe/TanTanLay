import { generateUUID } from "@/utils/uuid";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store";
import { Product } from "@/types";

export default function ProductsScreen() {
  const { products, fetchProducts, addProduct, removeProduct } = useAppStore();
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockQty, setStockQty] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setName("");
    setPrice("");
    setStockQty("");
    setEditingProduct(null);
    setIsBottomSheetVisible(false);
  };

  const handleSaveProduct = () => {
    if (!name || !price || !stockQty) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (editingProduct) {
      // Update existing product
      const updatedProduct: Product = {
        ...editingProduct,
        name,
        price: parseFloat(price),
        stockQty: parseInt(stockQty, 10),
      };

      // Use the existing editProduct function from the store
      const { editProduct } = useAppStore.getState();
      editProduct(updatedProduct);
    } else {
      // Add new product
      const newProduct: Product = {
        id: generateUUID(),
        name,
        price: parseFloat(price),
        stockQty: parseInt(stockQty, 10),
      };

      addProduct(newProduct);
    }

    resetForm();
  };

  const openEditProductSheet = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setStockQty(product.stockQty.toString());
    setIsBottomSheetVisible(true);
  };

  const confirmDeleteProduct = (productId: string) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => removeProduct(productId),
          style: "destructive",
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <ThemedText style={styles.productName}>{item.name}</ThemedText>
        <ThemedText style={styles.productPrice}>
          {item.price.toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.productDetails}>
        <ThemedText>Stock: {item.stockQty}</ThemedText>
      </View>
      <View style={styles.productActions}>
        <Button
          title="Edit"
          variant="secondary"
          onPress={() => openEditProductSheet(item)}
          style={styles.actionButton}
        />
        <Button
          title="Delete"
          variant="danger"
          onPress={() => confirmDeleteProduct(item.id)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Products</ThemedText>
      </View>

      {/* Bottom Sheet for Add/Edit Product Form */}
      <BottomSheet
        isVisible={isBottomSheetVisible}
        onClose={resetForm}
        height={450}
      >
        <View style={styles.bottomSheetContent}>
          <ThemedText style={styles.formTitle}>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </ThemedText>
          <Input
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
          />
          <Input
            label="Price"
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Input
            label="Stock Quantity"
            value={stockQty}
            onChangeText={setStockQty}
            placeholder="0"
            keyboardType="number-pad"
          />
          <View style={styles.formActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={resetForm}
              style={styles.formButton}
            />
            <Button
              title={editingProduct ? "Save Changes" : "Add"}
              onPress={handleSaveProduct}
              style={styles.formButton}
            />
          </View>
        </View>
      </BottomSheet>

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No products found. Add your first product!
          </ThemedText>
        }
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsBottomSheetVisible(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  productList: {
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "600",
  },
  productDetails: {
    marginBottom: 12,
  },
  productActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  formButton: {
    marginLeft: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  // New styles for bottom sheet and FAB
  bottomSheetContent: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20,
    backgroundColor: "#0066cc",
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
