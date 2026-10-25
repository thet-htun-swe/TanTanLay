import { DateTimePicker } from "@/components/common/DateTimePicker";
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedView } from "@/components/ThemedView";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { CustomerSelector } from "@/components/sales/CustomerSelector";
import { SaleItemsList } from "@/components/sales/SaleItemsList";
import { SaleSummary } from "@/components/sales/SaleSummary";

import { useSaleCalculations } from "@/hooks/useSaleCalculations";
import { setItemDiscount, setItemQuantity } from "@/utils/saleMath";
import { getErrorMessage, isNoConnectionError } from "@/services/api";
import { useToast } from "@/components/ui/Toast";
import { useAppStore } from "@/store";
import { Customer, Sale, SaleItem } from "@/types";
import { generateUUID } from "@/utils/uuid";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function NewSaleScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { products, fetchProducts, addSale } = useAppStore();
  const toast = useToast();
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<
    (Customer & { id?: number }) | null
  >(null);
  const [orderDate, setOrderDate] = useState<Date>(new Date());

  const [isCreating, setIsCreating] = useState(false);
  // One id per sale form: tapping Create again after a failure reuses it,
  // so the server never saves the same sale twice
  const clientIdRef = useRef(generateUUID());

  const { subtotal, total, discountTotal } = useSaleCalculations(selectedProducts);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset form data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const resetForm = () => {
        setSelectedProducts([]);
        setSelectedCustomer(null);
        setOrderDate(new Date());
        clientIdRef.current = generateUUID();
      };
      resetForm();
    }, [])
  );

  const addProductToSale = (newItem: SaleItem) => {
    setSelectedProducts((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === newItem.productId
      );

      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = setItemQuantity(
          updated[existingIndex],
          updated[existingIndex].quantity + 1,
        );
        return updated;
      } else {
        // Add new item
        return [...prev, newItem];
      }
    });
  };

  const updateItemQuantity = (productId: number | string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts((prev) =>
        prev.filter((item) => item.productId !== productId)
      );
      return;
    }

    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? setItemQuantity(item, quantity)
          : item
      )
    );
  };

  const removeItem = (productId: number | string) => {
    setSelectedProducts((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  };

  const onDateChange = (date: Date) => {
    setOrderDate(date);
  };



  const validateSale = (): { isValid: boolean; error?: string } => {
    if (selectedProducts.length === 0) {
      return {
        isValid: false,
        error: "Please add at least one product to the sale",
      };
    }

    if (!selectedCustomer?.name?.trim()) {
      return { isValid: false, error: "Please select a customer" };
    }

    // Validate stock quantities for existing products
    const insufficientStockItems = [];

    for (const item of selectedProducts) {
      const product = products.find((p) => p.id === item.productId);
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
        .map(
          (item) =>
            `${item.name} (Requested: ${item.requested}, Available: ${item.available})`
        )
        .join("\n");

      return {
        isValid: false,
        error: `The following items don't have enough stock:\n\n${itemsList}`,
      };
    }

    return { isValid: true };
  };

  const handleCreateSale = async () => {
    const validation = validateSale();
    if (!validation.isValid) {
      toast.error(validation.error ?? "Please check the sale details");
      return;
    }

    setIsCreating(true);

    try {
      const customer: Customer = {
        name: selectedCustomer!.name.trim(),
        contact: selectedCustomer!.contact?.trim() || "",
        address: selectedCustomer!.address?.trim() || "",
      };

      const newSale: Omit<Sale, "id"> = {
        date: new Date().toISOString(),
        orderDate: orderDate.toISOString(),
        customer,
        items: selectedProducts,
        subtotal,
        total,
      };

      const saleId = await addSale(newSale, clientIdRef.current);
      clientIdRef.current = generateUUID();

      toast.success("Sale created");
      router.push(`/sale/${saleId}`);
    } catch (error) {
      Alert.alert(
        "Sale not saved",
        isNoConnectionError(error)
          ? `${getErrorMessage(error, "")}

Tap Create Sale again when you are back online. It will not be saved twice.`
          : getErrorMessage(error, "Failed to create sale. Please try again."),
      );
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

          <View style={styles.customerDateRow}>
            <View style={styles.customerSelectorContainer}>
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onCustomerSelect={setSelectedCustomer}
              />
            </View>

            <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
              <DateTimePicker
                label="Order Date"
                value={orderDate}
                onChange={onDateChange}
              />
            </View>
          </View>



          <SaleItemsList
            items={selectedProducts}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeItem}
            onUpdateDiscount={(productId, type, value) =>
              setSelectedProducts((prev) =>
                prev.map((item) =>
                  item.productId === productId ? setItemDiscount(item, type, value) : item,
                ),
              )
            }
            onAddProduct={addProductToSale}
            products={products}
          />

          {selectedProducts.length > 0 && (
            <SaleSummary
              subtotal={subtotal}
              total={total}
              discountTotal={discountTotal}
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
  customerDateRow: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 12,
    alignItems: "stretch",
  },
  customerSelectorContainer: {
    flex: 2,
  },
  datePickerContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },

});
