import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ProductCard } from './ProductCard';
import { Product } from '@/types';

interface ProductsListProps {
  products: Product[];
  onEditProduct: (productId: string) => void;
  onDeleteProduct: (productId: string) => void;
  emptyMessage?: string;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  products,
  onEditProduct,
  onDeleteProduct,
  emptyMessage = "No products found. Add your first product!",
}) => {
  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onEdit={onEditProduct}
      onDelete={onDeleteProduct}
    />
  );

  return (
    <FlatList
      data={products}
      renderItem={renderProductItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <ThemedText style={styles.emptyText}>
          {emptyMessage}
        </ThemedText>
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    opacity: 0.7,
  },
});