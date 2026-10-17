import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductNameInput } from "@/components/ui/ProductNameInput";
import { useAppStore } from "@/store";

export default function CreateProductScreen() {
  const { addProduct, products } = useAppStore();

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const resetForm = () => {
    setName("");
    setPrice("");
    setStockQty("");
  };

  const handleCreateProduct = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a product name");
      return;
    }

    if (nameValidation.hasExactMatch) {
      Alert.alert(
        "Error",
        "A product with this name already exists. Please choose a different name."
      );
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    if (!stockQty || isNaN(parseInt(stockQty)) || parseInt(stockQty) < 0) {
      Alert.alert("Error", "Please enter a valid stock quantity");
      return;
    }

    setIsSubmitting(true);

    try {
      const newProduct = {
        name: name.trim(),
        price: parseFloat(parseFloat(price).toFixed(2)),
        stockQty: parseInt(stockQty, 10),
      };

      await addProduct(newProduct);

      Alert.alert("Success", "Product created successfully!", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating product:", error);
      Alert.alert("Error", "Failed to create product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProductNameInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
            autoCapitalize="words"
            autoCorrect={false}
            containerStyle={styles.field}
            existingProducts={products}
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
              title={isSubmitting ? "Creating..." : "Create"}
              onPress={handleCreateProduct}
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
