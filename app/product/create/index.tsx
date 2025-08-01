import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store";

export default function CreateProductScreen() {
  const { addProduct } = useAppStore();

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <ThemedText style={styles.title}>Add New Product</ThemedText>
      <KeyboardAvoidingView behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Input
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.input}
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
            style={styles.input}
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
            style={styles.input}
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
              title={isSubmitting ? "Creating..." : "Create Product"}
              onPress={handleCreateProduct}
              style={styles.button}
              disabled={isSubmitting || !name || !price || !stockQty}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 24,
  },
  button: {
    flex: 0,
    minWidth: 150,
  },
});
