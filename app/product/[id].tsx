import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAppStore } from '@/store';
import { Product } from '@/types';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, fetchProducts, editProduct } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length > 0 && id) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        setName(foundProduct.name);
        setPrice(foundProduct.price.toString());
        setStockQty(foundProduct.stockQty.toString());
      }
      setLoading(false);
    }
  }, [id, products]);

  const handleSave = () => {
    if (!product || !name || !price || !stockQty) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const updatedProduct: Product = {
      ...product,
      name,
      price: parseFloat(price),
      stockQty: parseInt(stockQty, 10),
    };

    editProduct(updatedProduct);
    Alert.alert('Success', 'Product updated successfully', [
      { text: 'OK', onPress: () => router.push('/products') }
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Product not found</ThemedText>
        <Button title="Go Back" onPress={() => router.push('/products')} style={styles.button} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Edit Product</ThemedText>
        <Button 
          title="Cancel" 
          variant="secondary" 
          onPress={() => router.push('/products')} 
        />
      </View>

      <Card style={styles.formCard}>
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
          label="Stock Quantity"
          value={stockQty}
          onChangeText={setStockQty}
          placeholder="0"
          keyboardType="number-pad"
        />
        <View style={styles.formActions}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            style={styles.button}
          />
        </View>
      </Card>
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
    marginTop: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formCard: {
    marginBottom: 16,
  },
  formActions: {
    marginTop: 24,
    alignItems: 'center',
  },
  button: {
    minWidth: 150,
  },
});
