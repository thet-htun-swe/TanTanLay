import { Product, SaleItem } from "@/types";
import { generateUUID } from "@/utils/uuid";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CreatableSelect } from "../ui/CreatableSelect";
import { Input } from "../ui/Input";

interface ProductSelectorProps {
  products: (Product & { id: number })[];
  onAddItem: (item: SaleItem) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  onAddItem,
}) => {
  const [selectedOption, setSelectedOption] = useState<{
    id: string;
    label: string;
    value: Product & { id: number };
  } | null>(null);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductPrice, setCustomProductPrice] = useState("");
  const [showCustomProductForm, setShowCustomProductForm] = useState(false);

  const productOptions = products.map((product) => ({
    id: product.id?.toString() ?? `product-${product.name}`,
    label: product.name,
    value: product,
  }));

  const addProductToSale = (
    product: (Product & { id: number }) | (Product & { id: string })
  ) => {
    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      lineTotal: product.price,
    };
    onAddItem(newItem);
    setSelectedOption(null);
  };

  const handleCreateCustomProduct = () => {
    if (!customProductName || !customProductPrice) {
      Alert.alert("Error", "Please enter product name and price");
      return;
    }

    const customProduct = {
      id: `custom-${generateUUID()}`,
      name: customProductName,
      price: parseFloat(customProductPrice) || 0,
      stockQty: 0,
    } as Product & { id: string };

    addProductToSale(customProduct);

    // Reset form
    setCustomProductName("");
    setCustomProductPrice("");
    setShowCustomProductForm(false);
    setSelectedOption(null);
  };

  const handleCancelCustomProduct = () => {
    setCustomProductName("");
    setCustomProductPrice("");
    setShowCustomProductForm(false);
    setSelectedOption(null);
  };

  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Add Products</ThemedText>

      <View style={styles.searchContainer}>
        <CreatableSelect
          options={productOptions}
          value={selectedOption}
          placeholder="Search or create a product..."
          containerStyle={styles.searchInput}
          onSelect={(option) => {
            if (option) {
              addProductToSale(option.value);
              setSelectedOption(null);
            } else {
              setSelectedOption(option);
            }
          }}
          onCreate={(label) => {
            setCustomProductName(label);
            setShowCustomProductForm(true);
          }}
          noOptionsMessage="No products found"
          createOptionMessage="Create new product"
        />
      </View>

      {showCustomProductForm && (
        <View style={styles.customProductForm}>
          <ThemedText style={styles.formTitle}>Add Custom Product</ThemedText>

          <Input
            placeholder="Product name"
            value={customProductName}
            onChangeText={setCustomProductName}
            containerStyle={styles.customProductInput}
          />

          <Input
            placeholder="Price"
            value={customProductPrice}
            onChangeText={setCustomProductPrice}
            keyboardType="decimal-pad"
            containerStyle={styles.customProductInput}
          />

          <View style={styles.customProductButtons}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={handleCancelCustomProduct}
              style={styles.cancelButton}
            />
            <Button
              title="Add to Sale"
              onPress={handleCreateCustomProduct}
              style={styles.addButton}
            />
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    zIndex: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  customProductForm: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  customProductInput: {
    marginBottom: 8,
  },
  customProductButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    flex: 1,
    marginLeft: 8,
  },
});
