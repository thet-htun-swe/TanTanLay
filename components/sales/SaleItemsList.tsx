import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { SaleItem } from '@/types';

interface SaleItemsListProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const SaleItemsList: React.FC<SaleItemsListProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Sale Items</ThemedText>
      
      {items.map((item) => (
        <View key={item.productId} style={styles.item}>
          <View style={styles.itemHeader}>
            <ThemedText style={styles.itemName}>
              {item.productName}
            </ThemedText>
            <TouchableOpacity onPress={() => onRemoveItem(item.productId)}>
              <ThemedText style={styles.removeText}>Remove</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.itemDetails}>
            <View style={styles.itemDetail}>
              <ThemedText>Unit Price:</ThemedText>
              <ThemedText>{item.unitPrice.toFixed(2)}</ThemedText>
            </View>

            <View style={styles.itemDetail}>
              <ThemedText>Quantity:</ThemedText>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                >
                  <ThemedText style={styles.quantityButtonText}>-</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.quantityText}>
                  {item.quantity}
                </ThemedText>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                >
                  <ThemedText style={styles.quantityButtonText}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.itemDetail}>
              <ThemedText>Line Total:</ThemedText>
              <ThemedText style={styles.lineTotal}>
                {item.lineTotal.toFixed(2)}
              </ThemedText>
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontWeight: '600',
    fontSize: 16,
  },
  removeText: {
    color: '#ff6b6b',
  },
  itemDetails: {
    marginLeft: 8,
  },
  itemDetail: {
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
    backgroundColor: '#0066cc',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  lineTotal: {
    fontWeight: '600',
  },
});