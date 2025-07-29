import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product & { id: number };
  onEdit: (productId: number) => void;
  onDelete: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  const isLowStock = product.stockQty <= 5;

  return (
    <Card style={{
      ...styles.card,
      ...(isLowStock ? styles.lowStockCard : {}),
    }}>
      <View style={styles.header}>
        <ThemedText style={styles.name}>{product.name}</ThemedText>
        <ThemedText style={styles.price}>
          {product.price.toFixed(2)}
        </ThemedText>
      </View>
      
      <View style={styles.details}>
        <ThemedText style={{
          ...styles.stock,
          ...(isLowStock ? styles.lowStock : {}),
        }}>
          Stock: {product.stockQty}
          {isLowStock && ' (Low Stock)'}
        </ThemedText>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Edit"
          variant="secondary"
          onPress={() => onEdit(product.id)}
          style={styles.actionButton}
        />
        <Button
          title="Delete"
          variant="danger"
          onPress={() => onDelete(product.id)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  lowStockCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
  },
  details: {
    marginBottom: 12,
  },
  stock: {
    fontSize: 14,
  },
  lowStock: {
    color: '#f39c12',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});