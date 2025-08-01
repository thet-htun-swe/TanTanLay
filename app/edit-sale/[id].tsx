import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ThemedView } from "@/components/ThemedView";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { CustomerForm } from "@/components/sales/CustomerForm";
import { ProductSelector } from "@/components/sales/ProductSelector";
import { SaleItemsList } from "@/components/sales/SaleItemsList";
import { SaleSummary } from "@/components/sales/SaleSummary";

import { useAppStore } from "@/store";
import { useSaleCalculations } from "@/hooks/useSaleCalculations";
import { Customer, Sale, SaleItem } from "@/types";
import { getSaleById } from "@/services/database";

export default function EditSaleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, fetchProducts, editSale } = useAppStore();
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalSale, setOriginalSale] = useState<(Sale & { id: number }) | null>(null);

  const { subtotal, total } = useSaleCalculations(selectedProducts);

  useEffect(() => {
    fetchProducts();
    loadSale();
  }, [fetchProducts, id]);

  const loadSale = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const sale = await getSaleById(parseInt(id, 10));
      if (sale) {
        setOriginalSale(sale);
        setCustomerName(sale.customer.name);
        setCustomerContact(sale.customer.contact || "");
        setCustomerAddress(sale.customer.address || "");
        setSelectedProducts(sale.items);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load sale data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

    if (!customerName.trim()) {
      return { isValid: false, error: "Please enter customer name" };
    }

    // For edit, we need to consider original quantities when validating stock
    const insufficientStockItems = [];

    for (const item of selectedProducts) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        // Find original quantity for this product
        const originalItem = originalSale?.items.find(origItem => origItem.productId === item.productId);
        const originalQuantity = originalItem?.quantity || 0;
        
        // Calculate available stock considering we're returning the original quantity
        const availableStock = product.stockQty + originalQuantity;
        
        if (availableStock < item.quantity) {
          insufficientStockItems.push({
            name: product.name,
            requested: item.quantity,
            available: availableStock,
          });
        }
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

  const handleUpdateSale = async () => {
    const validation = validateSale();
    if (!validation.isValid) {
      Alert.alert("Error", validation.error);
      return;
    }

    if (!originalSale) return;

    setIsUpdating(true);

    try {
      const customer: Customer = {
        name: customerName.trim(),
        contact: customerContact.trim(),
        address: customerAddress.trim(),
      };

      const updatedSale: Sale & { id: number } = {
        ...originalSale,
        customer,
        items: selectedProducts,
        subtotal,
        total,
      };

      await editSale(updatedSale);

      Alert.alert("Success", "Sale updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update sale. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ScreenHeader title="Loading..." />
      </ThemedView>
    );
  }

  if (!originalSale) {
    return (
      <ThemedView style={styles.container}>
        <ScreenHeader title="Sale Not Found" />
      </ThemedView>
    );
  }

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
          <ScreenHeader title="Edit Sale" />

          <CustomerForm
            name={customerName}
            contact={customerContact}
            address={customerAddress}
            onNameChange={setCustomerName}
            onContactChange={setCustomerContact}
            onAddressChange={setCustomerAddress}
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
              onCreateSale={handleUpdateSale}
              loading={isUpdating}
              buttonText="Update Sale"
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