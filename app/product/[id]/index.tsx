import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductNameInput } from "@/components/ui/ProductNameInput";
import { useToast } from "@/components/ui/Toast";
import { useAppStore } from "@/store";

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, editProduct } = useAppStore();
  const toast = useToast();

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nameValidation, setNameValidation] = useState({
    isValid: true,
    hasExactMatch: false,
  });

  const handleValidationChange = useCallback(
    (isValid: boolean, hasExactMatch: boolean) => {
      setNameValidation({ isValid, hasExactMatch });
    },
    []
  );

  // Load product data when component mounts
  useEffect(() => {
    if (id) {
      const product = products.find((p) => p.id === parseInt(id, 10));
      if (product) {
        setName(product.name);
        setPrice(product.price.toString());
        setStockQty(product.stockQty.toString());
      } else {
        toast.error("Product not found");
        router.back();
      }
      setIsLoading(false);
    }
  }, [id, products, toast]);

  const handleUpdateProduct = async () => {
    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (nameValidation.hasExactMatch) {
      toast.error("A product with this name already exists. Please choose a different name.");
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!stockQty || isNaN(parseInt(stockQty)) || parseInt(stockQty) < 0) {
      toast.error("Please enter a valid stock quantity");
      return;
    }

    if (!id) {
      toast.error("Invalid product ID");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedProduct = {
        id: parseInt(id, 10),
        name: name.trim(),
        price: parseFloat(parseFloat(price).toFixed(2)),
        stockQty: parseInt(stockQty, 10),
      };

      await editProduct(updatedProduct);

      toast.success("Product updated successfully");
      router.back();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled={true}
          scrollEnabled={true}
        >
          <ProductNameInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
            autoCapitalize="words"
            autoCorrect={false}
            containerStyle={styles.field}
            existingProducts={products}
            excludeId={id ? parseInt(id, 10) : undefined}
            onValidationChange={handleValidationChange}
          />
          <Input
            label="Price"
            value={price}
            onChangeText={(text) => {
              // Allow only numbers and one decimal point
              if (/^\d*\.?\d*$/.test(text) || text === "") {
                setPrice(text);
              }
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            containerStyle={styles.field}
          />
          <Input
            label="Stock Quantity"
            value={stockQty}
            onChangeText={(text) => {
              // Allow only numbers
              if (/^\d*$/.test(text) || text === "") {
                setStockQty(text);
              }
            }}
            placeholder="0"
            keyboardType="number-pad"
            containerStyle={styles.field}
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              style={styles.button}
              disabled={isSubmitting}
            />
            <Button
              title={isSubmitting ? "Saving..." : "Save"}
              onPress={handleUpdateProduct}
              style={styles.button}
              disabled={
                isSubmitting ||
                !name ||
                !price ||
                !stockQty ||
                nameValidation.hasExactMatch
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});
