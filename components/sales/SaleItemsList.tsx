import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { SaleItem } from '@/types';

interface SaleItemsListProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: number | string, quantity: number) => void;
  onRemoveItem: (productId: number | string) => void;
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
      
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <ThemedText style={[styles.headerText, styles.productColumn]}>Product</ThemedText>
          <ThemedText style={[styles.headerText, styles.priceColumn]}>Price</ThemedText>
          <ThemedText style={[styles.headerText, styles.quantityColumn]}>Qty</ThemedText>
          <ThemedText style={[styles.headerText, styles.totalColumn]}>Total</ThemedText>
          <View style={styles.actionColumn} />
        </View>

        {/* Table Body */}
        <ScrollView style={styles.tableBody} nestedScrollEnabled>
          {items.map((item) => (
            <View key={item.productId?.toString() ?? `item-${item.productName}`} style={styles.tableRow}>
              <View style={styles.productColumn}>
                <ThemedText style={styles.productName} numberOfLines={2}>
                  {item.productName}
                </ThemedText>
              </View>
              
              <View style={styles.priceColumn}>
                <ThemedText style={styles.cellText}>
                  ${item.unitPrice.toFixed(2)}
                </ThemedText>
              </View>
              
              <View style={[styles.quantityColumn, styles.quantityCell]}>
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
              
              <View style={styles.totalColumn}>
                <ThemedText style={styles.totalText}>
                  ${item.lineTotal.toFixed(2)}
                </ThemedText>
              </View>
              
              <View style={styles.actionColumn}>
                <TouchableOpacity onPress={() => onRemoveItem(item.productId)}>
                  <ThemedText style={styles.removeText}>×</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
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
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableBody: {
    maxHeight: 300,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 14,
    textAlign: 'center',
  },
  productColumn: {
    flex: 2,
    paddingHorizontal: 4,
  },
  priceColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  quantityColumn: {
    flex: 1.5,
    paddingHorizontal: 4,
  },
  totalColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  actionColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#007AFF',
  },
  quantityCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 20,
    textAlign: 'center',
  },
  removeText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    width: 24,
    height: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});