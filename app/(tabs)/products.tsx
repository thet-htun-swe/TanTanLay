import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAppStore } from '@/store';
import { Product } from '@/types';

export default function ProductsScreen() {
  const { products, fetchProducts, addProduct, editProduct, removeProduct } = useAppStore();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stockQty, setStockQty] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setName('');
    setPrice('');
    setSku('');
    setStockQty('');
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleAddProduct = () => {
    if (!name || !price || !sku || !stockQty) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newProduct: Product = {
      id: uuidv4(),
      name,
      price: parseFloat(price),
      sku,
      stockQty: parseInt(stockQty, 10),
    };

    addProduct(newProduct);
    resetForm();
  };

  const handleEditProduct = () => {
    if (!editingProduct || !name || !price || !sku || !stockQty) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const updatedProduct: Product = {
      ...editingProduct,
      name,
      price: parseFloat(price),
      sku,
      stockQty: parseInt(stockQty, 10),
    };

    editProduct(updatedProduct);
    resetForm();
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setSku(product.sku);
    setStockQty(product.stockQty.toString());
  };

  const confirmDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => removeProduct(productId),
          style: 'destructive',
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <ThemedText style={styles.productName}>{item.name}</ThemedText>
        <ThemedText style={styles.productPrice}>${item.price.toFixed(2)}</ThemedText>
      </View>
      <View style={styles.productDetails}>
        <ThemedText>SKU: {item.sku}</ThemedText>
        <ThemedText>Stock: {item.stockQty}</ThemedText>
      </View>
      <View style={styles.productActions}>
        <Button
          title="Edit"
          variant="secondary"
          onPress={() => startEditProduct(item)}
          style={styles.actionButton}
        />
        <Button
          title="Delete"
          variant="danger"
          onPress={() => confirmDeleteProduct(item.id)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Products</ThemedText>
        {!isAddingProduct && !editingProduct && (
          <Button
            title="Add Product"
            onPress={() => setIsAddingProduct(true)}
          />
        )}
      </View>

      {(isAddingProduct || editingProduct) && (
        <Card style={styles.formCard}>
          <ThemedText style={styles.formTitle}>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </ThemedText>
          <Input
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
          />
          <Input
            label="Price"
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Input
            label="SKU"
            value={sku}
            onChangeText={setSku}
            placeholder="Enter SKU"
          />
          <Input
            label="Stock Quantity"
            value={stockQty}
            onChangeText={setStockQty}
            placeholder="0"
            keyboardType="number-pad"
          />
          <View style={styles.formActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={resetForm}
              style={styles.formButton}
            />
            <Button
              title={editingProduct ? 'Update' : 'Add'}
              onPress={editingProduct ? handleEditProduct : handleAddProduct}
              style={styles.formButton}
            />
          </View>
        </Card>
      )}

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No products found. Add your first product!
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  productList: {
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
  },
  productDetails: {
    marginBottom: 12,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  formButton: {
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
