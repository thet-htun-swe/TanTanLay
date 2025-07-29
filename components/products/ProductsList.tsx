import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ProductCard } from './ProductCard';
import { Product } from '@/types';

interface ProductsListProps {
  products: (Product & { id: number })[];
  onEditProduct: (productId: number) => void;
  onDeleteProduct: (productId: number) => void;
  emptyMessage?: string;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  products,
  onEditProduct,
  onDeleteProduct,
  emptyMessage = "No products found. Add your first product!",
}) => {
  const renderProductItem = ({ item }: { item: Product & { id: number } }) => (
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
      keyExtractor={(item) => item.id?.toString() ?? `product-${Math.random()}`}
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