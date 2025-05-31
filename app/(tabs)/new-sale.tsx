import { generateUUID } from "@/utils/uuid";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CreatableSelect } from "@/components/ui/CreatableSelect";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store";
import { Customer, Product, Sale, SaleItem } from "@/types";

export default function NewSaleScreen() {
  const { products, fetchProducts, addSale } = useAppStore();
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedOption, setSelectedOption] = useState<{
    id: string;
    label: string;
    value: Product;
  } | null>(null);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductPrice, setCustomProductPrice] = useState("");
  const [showCustomProductForm, setShowCustomProductForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProductToSale = (product: Product) => {
    // Check if product is already in the sale
    const existingItem = selectedProducts.find(
      (item) => item.productId === product.id
    );

    if (existingItem) {
      // Update quantity if already in sale
      const updatedItems = selectedProducts.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              lineTotal: (item.quantity + 1) * item.unitPrice,
            }
          : item
      );
      setSelectedProducts(updatedItems);
    } else {
      // Add new item to sale
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        lineTotal: product.price,
      };
      setSelectedProducts([...selectedProducts, newItem]);
    }
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      setSelectedProducts(
        selectedProducts.filter((item) => item.productId !== productId)
      );
      return;
    }

    const updatedItems = selectedProducts.map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity,
            lineTotal: quantity * item.unitPrice,
          }
        : item
    );
    setSelectedProducts(updatedItems);
  };



  const removeItem = (productId: string) => {
    setSelectedProducts(
      selectedProducts.filter((item) => item.productId !== productId)
    );
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find((product) => product.id === productId);
  };

  const calculateSubtotal = (): number => {
    return selectedProducts.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const calculateTotal = (): number => {
    return calculateSubtotal();
  };

  const handleCreateSale = () => {
    if (selectedProducts.length === 0) {
      Alert.alert("Error", "Please add at least one product to the sale");
      return;
    }

    if (!customerName) {
      Alert.alert("Error", "Please enter customer name");
      return;
    }

    // Validate stock quantities for existing products
    const insufficientStockItems = [];

    for (const item of selectedProducts) {
      const product = products.find((p) => p.id === item.productId);
      // Only validate stock for products that exist in the inventory
      // Custom products (those not in the inventory) will not be validated
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

      Alert.alert(
        "Insufficient Stock",
        `The following items don't have enough stock:\n\n${itemsList}`,
        [{ text: "OK" }]
      );
      return;
    }

    const customer: Customer = {
      name: customerName,
      contact: customerContact,
      address: customerAddress,
    };

    const newSale: Sale = {
      id: generateUUID(),
      date: new Date().toISOString(),
      customer,
      items: selectedProducts,
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
    };

    addSale(newSale);

    // Reset form
    setSelectedProducts([]);
    setCustomerName("");
    setCustomerContact("");
    setCustomerAddress("");

    // Navigate to sales history
    Alert.alert("Success", "Sale created successfully", [
      { text: "OK", onPress: () => router.push("/sales") },
    ]);
  };

  // Map products to options format for CreatableSelect
  const productOptions = products.map((product) => ({
    id: product.id,
    label: product.name,
    value: product,
  }));

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <ScrollView
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>New Sale</ThemedText>
          </View>

          <Card style={styles.customerCard}>
            <ThemedText style={styles.sectionTitle}>
              Customer Information
            </ThemedText>
            <Input
              label="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
            />
            <Input
              label="Contact (Phone/Email)"
              value={customerContact}
              onChangeText={setCustomerContact}
              placeholder="Enter contact information"
            />
            <Input
              label="Address"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="Enter customer address"
            />
          </Card>

          <Card style={{ ...styles.productsCard, zIndex: 5 }}>
            <ThemedText style={styles.sectionTitle}>Add Products</ThemedText>

            <View style={styles.searchContainer}>
              <CreatableSelect
                options={productOptions}
                value={selectedOption}
                placeholder="Search or create a product..."
                containerStyle={styles.searchInputContainer}
                onSelect={(option) => {
                  if (option) {
                    // Directly add the selected product to the sale
                    addProductToSale(option.value);
                    // Reset selection
                    setSelectedOption(null);
                  } else {
                    setSelectedOption(option);
                  }
                }}
                onCreate={(label) => {
                  // Create a custom product
                  const customProduct: Product = {
                    id: `custom-${generateUUID()}`,
                    name: label,
                    price: 0,
                    stockQty: 0, // Custom products have no stock
                  };

                  // Create the option
                  const newOption = {
                    id: customProduct.id,
                    label: customProduct.name,
                    value: customProduct,
                  };

                  // Select the new option
                  setSelectedOption(newOption);

                  // Show price input form for the custom product
                  setCustomProductName(label);
                  setShowCustomProductForm(true);
                }}
                noOptionsMessage="No products found"
                createOptionMessage="Create new product"
              />
            </View>

            {showCustomProductForm ? (
              <View style={styles.customProductForm}>
                <ThemedText style={styles.formTitle}>
                  Add Custom Product
                </ThemedText>
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
                    onPress={() => {
                      setCustomProductName("");
                      setCustomProductPrice("");
                      setShowCustomProductForm(false);
                      setSelectedOption(null);
                    }}
                    style={styles.cancelCustomProductButton}
                  />
                  <Button
                    title="Add to Sale"
                    onPress={() => {
                      if (!customProductName || !customProductPrice) {
                        Alert.alert(
                          "Error",
                          "Please enter product name and price"
                        );
                        return;
                      }

                      // Create a custom product
                      const customProduct: Product = {
                        id: `custom-${generateUUID()}`,
                        name: customProductName,
                        price: parseFloat(customProductPrice) || 0,
                        stockQty: 0, // Custom products have no stock
                      };

                      // Add to sale
                      addProductToSale(customProduct);

                      // Reset form
                      setCustomProductName("");
                      setCustomProductPrice("");
                      setShowCustomProductForm(false);
                      setSelectedOption(null);
                    }}
                    style={styles.addCustomProductButton}
                  />
                </View>
              </View>
            ) : (
              <>
                {/* Product selection is now handled by CreatableSelect */}
                {/* Products are now directly added to the sale when selected */}
              </>
            )}
          </Card>

          {selectedProducts.length > 0 && (
            <Card style={{ ...styles.cartCard, zIndex: 1 }}>
              <ThemedText style={styles.sectionTitle}>Sale Items</ThemedText>
              {selectedProducts.map((item) => {
                return (
                  <View key={item.productId} style={styles.cartItem}>
                    <View style={styles.cartItemHeader}>
                      <ThemedText style={styles.cartItemName}>
                        {item.productName}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => removeItem(item.productId)}
                      >
                        <ThemedText style={styles.removeText}>
                          Remove
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cartItemDetails}>
                      <View style={styles.cartItemDetail}>
                        <ThemedText>Unit Price:</ThemedText>
                        <ThemedText>{item.unitPrice.toFixed(2)}</ThemedText>
                      </View>

                      <View style={styles.cartItemDetail}>
                        <ThemedText>Quantity:</ThemedText>
                        <View style={styles.quantityControl}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() =>
                              updateItemQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                          >
                            <ThemedText style={styles.quantityButtonText}>
                              -
                            </ThemedText>
                          </TouchableOpacity>
                          <ThemedText style={styles.quantityText}>
                            {item.quantity}
                          </ThemedText>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() =>
                              updateItemQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                          >
                            <ThemedText style={styles.quantityButtonText}>
                              +
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      </View>



                      <View style={styles.cartItemDetail}>
                        <ThemedText>Line Total:</ThemedText>
                        <ThemedText style={styles.lineTotal}>
                          {item.lineTotal.toFixed(2)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          {selectedProducts.length > 0 && (
            <Card style={styles.summaryCard}>
              <ThemedText style={styles.sectionTitle}>Summary</ThemedText>

              <View style={styles.summaryItem}>
                <ThemedText>Subtotal:</ThemedText>
                <ThemedText>{calculateSubtotal().toFixed(2)}</ThemedText>
              </View>

              <View style={[styles.summaryItem, styles.totalItem]}>
                <ThemedText style={styles.totalText}>Total:</ThemedText>
                <ThemedText style={styles.totalText}>
                  {calculateTotal().toFixed(2)}
                </ThemedText>
              </View>

              <Button
                title="Create Sale"
                onPress={handleCreateSale}
                style={styles.createButton}
              />
            </Card>
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    marginTop: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  customerCard: {
    marginBottom: 16,
  },
  productsCard: {
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputContainer: {
    marginBottom: 0,
    flex: 1,
  },
  addCustomButton: {
    marginLeft: 8,
    padding: 8,
  },
  addCustomButtonText: {
    color: "#0066cc",
    fontWeight: "600",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  customProductForm: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  customProductInput: {
    marginBottom: 8,
  },
  customProductButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelCustomProductButton: {
    flex: 1,
    marginRight: 8,
  },
  addCustomProductButton: {
    flex: 1,
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    maxHeight: 200,
    position: "relative",
    zIndex: 1000,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  resultsListContainer: {
    maxHeight: 200,
    overflow: "scroll",
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedResultItem: {
    backgroundColor: "#e6f2ff",
    borderLeftWidth: 3,
    borderLeftColor: "#0066cc",
  },
  resultItemContent: {
    flex: 1,
  },
  resultItemName: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
  },
  resultItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultItemPrice: {
    fontWeight: "500",
  },
  stockText: {
    fontSize: 12,
    color: "#666",
  },
  lowStockItem: {
    backgroundColor: "#fff0f0",
  },
  outOfStockText: {
    color: "red",
    fontSize: 12,
  },
  inCartText: {
    color: "#4CAF50",
    fontWeight: "500",
    marginTop: 4,
    fontSize: 12,
  },
  noResultsText: {
    padding: 16,
    textAlign: "center",
    color: "#666",
  },
  selectedProductContainer: {
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#0066cc",
  },
  selectedProductInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedProductName: {
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
  },
  selectedProductPrice: {
    fontWeight: "600",
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#0066cc",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
  },
  addToSaleButton: {
    marginTop: 8,
  },
  cartCard: {
    marginBottom: 16,
  },
  cartItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12,
    marginBottom: 12,
  },
  cartItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cartItemName: {
    fontWeight: "600",
    fontSize: 16,
  },
  removeText: {
    color: "#ff6b6b",
  },
  cartItemDetails: {
    marginLeft: 8,
  },
  cartItemDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  discountContainer: {
    marginBottom: 0,
    width: 80,
  },
  discountInput: {
    height: 36,
    textAlign: "center",
  },
  lineTotal: {
    fontWeight: "600",
  },
  summaryCard: {
    marginBottom: 100,
  },
  taxRateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  taxRateInputContainer: {
    marginBottom: 0,
    width: 80,
  },
  taxRateInput: {
    height: 36,
    textAlign: "center",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
    marginTop: 8,
  },
  totalText: {
    fontWeight: "700",
    fontSize: 18,
  },
  createButton: {
    marginTop: 16,
  },
});
