import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Product, SaleItem } from "../../types";
import { generateUUID } from "../../utils/uuid";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface ProductSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  products: (Product & { id: number })[];
  onAddItem: (item: SaleItem) => void;
}

export const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
  visible,
  onClose,
  products,
  onAddItem,
}) => {
  const [filteredProducts, setFilteredProducts] = useState<
    (Product & { id: number })[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState<{
    name: string;
    price: string;
  }>({
    name: "",
    price: "",
  });

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setShowCreateForm(false);
      setNewProduct({ name: "", price: "" });
      setFilteredProducts(products);
    }
  }, [visible, products]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
      setShowCreateForm(false);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowCreateForm(filtered.length === 0);
      if (filtered.length === 0) {
        setNewProduct((prev) => ({ ...prev, name: searchQuery }));
      }
    }
  }, [searchQuery, products]);

  const handleSelectProduct = (product: Product & { id: number }) => {
    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      lineTotal: product.price,
    };
    onAddItem(newItem);
    onClose();
  };

  const handleCreateProduct = () => {
    if (!newProduct.name.trim()) {
      Alert.alert("Error", "Please enter product name");
      return;
    }
    if (!newProduct.price.trim()) {
      Alert.alert("Error", "Please enter product price");
      return;
    }

    const price = parseFloat(newProduct.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    const customProduct = {
      id: `custom-${generateUUID()}`,
      name: newProduct.name,
      price: price,
      stockQty: 0,
    };

    const newItem: SaleItem = {
      productId: customProduct.id,
      productName: customProduct.name,
      quantity: 1,
      unitPrice: customProduct.price,
      lineTotal: customProduct.price,
    };

    onAddItem(newItem);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
        <ScrollView
          style={styles.modalScrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Product</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Input
              placeholder="Search products or create new..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={styles.searchInput}
            />
          </View>

          <View style={styles.contentContainer}>
            {showCreateForm ? (
              <View style={styles.createFormContainer}>
                <ThemedText style={styles.createFormTitle}>
                  Create New Product
                </ThemedText>
                <Input
                  label="Product Name"
                  value={newProduct.name}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="Enter product name"
                  containerStyle={styles.input}
                />
                <Input
                  label="Price"
                  value={newProduct.price}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, price: text }))
                  }
                  placeholder="Enter product price"
                  keyboardType="decimal-pad"
                  containerStyle={styles.input}
                />
                <Button
                  title="Add to Sale"
                  onPress={handleCreateProduct}
                  style={styles.createButton}
                />
              </View>
            ) : (
              <View style={styles.productsListContainer}>
                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>
                      No products found
                    </ThemedText>
                  </View>
                ) : (
                  filteredProducts.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productItem}
                      onPress={() => handleSelectProduct(product)}
                    >
                      <View style={styles.productInfo}>
                        <View style={styles.productHeader}>
                          <ThemedText style={styles.productName}>
                            {product.name}
                          </ThemedText>
                          <ThemedText style={styles.productPrice}>
                            ${product.price.toFixed(2)}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.productStock}>
                          Stock: {product.stockQty}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: 20,
  },
  modalScrollContainer: {
    flex: 1,
  },
  productsListContainer: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  productStock: {
    fontSize: 14,
    opacity: 0.7,
  },
  createFormContainer: {
    paddingVertical: 20,
  },
  createFormTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
  },
  createButton: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
});