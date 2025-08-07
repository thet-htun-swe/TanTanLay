import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { ThemedView } from "@/components/ThemedView";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { CustomerSelector } from "@/components/sales/CustomerSelector";
import { ProductSelector } from "@/components/sales/ProductSelector";
import { SaleItemsList } from "@/components/sales/SaleItemsList";
import { SaleSummary } from "@/components/sales/SaleSummary";

import { useAppStore } from "@/store";
import { useSaleCalculations } from "@/hooks/useSaleCalculations";
import { Customer, Sale, SaleItem } from "@/types";


export default function NewSaleScreen() {
  const { products, fetchProducts, addSale } = useAppStore();
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<(Customer & { id?: number }) | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { subtotal, total } = useSaleCalculations(selectedProducts);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset form data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const resetForm = () => {
        setSelectedProducts([]);
        setSelectedCustomer(null);
      };
      resetForm();
    }, [])
  );

  const addProductToSale = (newItem: SaleItem) => {
    setSelectedProducts(prev => {
      const existingIndex = prev.findIndex(item => item.productId === newItem.productId);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          lineTotal: (updated[existingIndex].quantity + 1) * updated[existingIndex].unitPrice,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, newItem];
      }
    });
  };

  const updateItemQuantity = (productId: number | string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(prev => prev.filter(item => item.productId !== productId));
      return;
    }

    setSelectedProducts(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeItem = (productId: number | string) => {
    setSelectedProducts(prev => prev.filter(item => item.productId !== productId));
  };

  const validateSale = (): { isValid: boolean; error?: string } => {
    if (selectedProducts.length === 0) {
      return { isValid: false, error: "Please add at least one product to the sale" };
    }

    if (!selectedCustomer?.name?.trim()) {
      return { isValid: false, error: "Please select a customer" };
    }

    // Validate stock quantities for existing products
    const insufficientStockItems = [];

    for (const item of selectedProducts) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.stockQty < item.quantity) {
        insufficientStockItems.push({
          name: product.name,
          requested: item.quantity,
          available: product.stockQty,
        });
      }
    }

    if (insufficientStockItems.length > 0) {
      const itemsList = insufficientStockItems
        .map(item => `${item.name} (Requested: ${item.requested}, Available: ${item.available})`)
        .join("\n");
      
      return {
        isValid: false,
        error: `The following items don't have enough stock:\n\n${itemsList}`
      };
    }

    return { isValid: true };
  };

  const handleCreateSale = async () => {
    const validation = validateSale();
    if (!validation.isValid) {
      Alert.alert("Error", validation.error);
      return;
    }

    setIsCreating(true);

    try {
      const customer: Customer = {
        name: selectedCustomer!.name.trim(),
        contact: selectedCustomer!.contact?.trim() || '',
        address: selectedCustomer!.address?.trim() || '',
      };

      const newSale: Omit<Sale, 'id'> = {
        date: new Date().toISOString(),
        customer,
        items: selectedProducts,
        subtotal,
        total,
      };

      const saleId = await addSale(newSale);

      Alert.alert("Success", "Sale created successfully", [
        { text: "OK", onPress: () => router.push(`/sale/${saleId}`) },
      ]);
    } catch {
      Alert.alert("Error", "Failed to create sale. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="New Sale" />

          <CustomerSelector
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
          />

          <ProductSelector
            products={products}
            onAddItem={addProductToSale}
          />

          <SaleItemsList
            items={selectedProducts}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeItem}
          />

          {selectedProducts.length > 0 && (
            <SaleSummary
              subtotal={subtotal}
              total={total}
              onCreateSale={handleCreateSale}
              loading={isCreating}
            />
          )}
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
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
});
