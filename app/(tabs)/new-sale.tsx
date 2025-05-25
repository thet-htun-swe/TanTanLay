import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { generateUUID } from '@/utils/uuid';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAppStore } from '@/store';
import { Product, SaleItem, Sale, Customer } from '@/types';

export default function NewSaleScreen() {
  const { products, fetchProducts, addSale } = useAppStore();
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProductToSale = (product: Product) => {
    // Check if product is already in the sale
    const existingItem = selectedProducts.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity if already in sale
      const updatedItems = selectedProducts.map(item => 
        item.productId === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              lineTotal: (item.quantity + 1) * item.unitPrice * (1 - item.discount / 100)
            } 
          : item
      );
      setSelectedProducts(updatedItems);
    } else {
      // Add new item to sale
      const newItem: SaleItem = {
        productId: product.id,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        lineTotal: product.price,
      };
      setSelectedProducts([...selectedProducts, newItem]);
    }
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      setSelectedProducts(selectedProducts.filter(item => item.productId !== productId));
      return;
    }

    const updatedItems = selectedProducts.map(item => 
      item.productId === productId 
        ? { 
            ...item, 
            quantity,
            lineTotal: quantity * item.unitPrice * (1 - item.discount / 100)
          } 
        : item
    );
    setSelectedProducts(updatedItems);
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    if (discount < 0 || discount > 100) {
      Alert.alert('Invalid Discount', 'Discount must be between 0 and 100');
      return;
    }

    const updatedItems = selectedProducts.map(item => 
      item.productId === productId 
        ? { 
            ...item, 
            discount,
            lineTotal: item.quantity * item.unitPrice * (1 - discount / 100)
          } 
        : item
    );
    setSelectedProducts(updatedItems);
  };

  const removeItem = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(item => item.productId !== productId));
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find(product => product.id === productId);
  };

  const calculateSubtotal = (): number => {
    return selectedProducts.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const calculateTotal = (): number => {
    return calculateSubtotal();
  };

  const handleCreateSale = () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Error', 'Please add at least one product to the sale');
      return;
    }

    if (!customerName) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    
    // Validate stock quantities
    const insufficientStockItems = [];
    
    for (const item of selectedProducts) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.stockQty < item.quantity) {
        insufficientStockItems.push({
          name: product.name,
          requested: item.quantity,
          available: product.stockQty
        });
      }
    }
    
    if (insufficientStockItems.length > 0) {
      const itemsList = insufficientStockItems.map(item => 
        `${item.name} (Requested: ${item.requested}, Available: ${item.available})`
      ).join('\n');
      
      Alert.alert(
        'Insufficient Stock',
        `The following items don't have enough stock:\n\n${itemsList}`,
        [{ text: 'OK' }]
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
    setCustomerName('');
    setCustomerContact('');
    setCustomerAddress('');
    
    // Navigate to sales history
    Alert.alert('Success', 'Sale created successfully', [
      { text: 'OK', onPress: () => router.push('/sales') }
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>New Sale</ThemedText>
        </View>

        <Card style={styles.customerCard}>
          <ThemedText style={styles.sectionTitle}>Customer Information</ThemedText>
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

        <Card style={styles.productsCard}>
          <ThemedText style={styles.sectionTitle}>Add Products</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
            {products.map(product => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productItem}
                onPress={() => addProductToSale(product)}
              >
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <ThemedText>${product.price.toFixed(2)}</ThemedText>
                <ThemedText>Stock: {product.stockQty}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {selectedProducts.length > 0 && (
          <Card style={styles.cartCard}>
            <ThemedText style={styles.sectionTitle}>Sale Items</ThemedText>
            {selectedProducts.map(item => {
              const product = getProductById(item.productId);
              return (
                <View key={item.productId} style={styles.cartItem}>
                  <View style={styles.cartItemHeader}>
                    <ThemedText style={styles.cartItemName}>{product?.name}</ThemedText>
                    <TouchableOpacity onPress={() => removeItem(item.productId)}>
                      <ThemedText style={styles.removeText}>Remove</ThemedText>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.cartItemDetails}>
                    <View style={styles.cartItemDetail}>
                      <ThemedText>Unit Price:</ThemedText>
                      <ThemedText>${item.unitPrice.toFixed(2)}</ThemedText>
                    </View>
                    
                    <View style={styles.cartItemDetail}>
                      <ThemedText>Quantity:</ThemedText>
                      <View style={styles.quantityControl}>
                        <Button
                          title="-"
                          onPress={() => updateItemQuantity(item.productId, item.quantity - 1)}
                          style={styles.quantityButton}
                        />
                        <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
                        <Button
                          title="+"
                          onPress={() => updateItemQuantity(item.productId, item.quantity + 1)}
                          style={styles.quantityButton}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.cartItemDetail}>
                      <ThemedText>Discount (%):</ThemedText>
                      <Input
                        value={item.discount.toString()}
                        onChangeText={(value) => updateItemDiscount(item.productId, parseFloat(value) || 0)}
                        keyboardType="decimal-pad"
                        style={styles.discountInput}
                        containerStyle={styles.discountContainer}
                      />
                    </View>
                    
                    <View style={styles.cartItemDetail}>
                      <ThemedText>Line Total:</ThemedText>
                      <ThemedText style={styles.lineTotal}>${item.lineTotal.toFixed(2)}</ThemedText>
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
              <ThemedText>${calculateSubtotal().toFixed(2)}</ThemedText>
            </View>
            
            <View style={[styles.summaryItem, styles.totalItem]}>
              <ThemedText style={styles.totalText}>Total:</ThemedText>
              <ThemedText style={styles.totalText}>${calculateTotal().toFixed(2)}</ThemedText>
            </View>
            
            <Button
              title="Create Sale"
              onPress={handleCreateSale}
              style={styles.createButton}
            />
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  customerCard: {
    marginBottom: 16,
  },
  productsCard: {
    marginBottom: 16,
  },
  productScroll: {
    flexDirection: 'row',
  },
  productItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 12,
    minWidth: 150,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  cartCard: {
    marginBottom: 16,
  },
  cartItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
    marginBottom: 12,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartItemName: {
    fontWeight: '600',
    fontSize: 16,
  },
  removeText: {
    color: '#ff6b6b',
  },
  cartItemDetails: {
    marginLeft: 8,
  },
  cartItemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 40,
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
    textAlign: 'center',
  },
  lineTotal: {
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: 100,
  },
  taxRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taxRateInputContainer: {
    marginBottom: 0,
    width: 80,
  },
  taxRateInput: {
    height: 36,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  totalText: {
    fontWeight: '700',
    fontSize: 18,
  },
  createButton: {
    marginTop: 16,
  },
});
