import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { SaleCard } from './SaleCard';
import { Sale } from '@/types';

interface SalesListProps {
  sales: (Sale & { id: number })[];
  onSalePress: (saleId: number) => void;
  emptyMessage?: string;
}

export const SalesList: React.FC<SalesListProps> = ({
  sales,
  onSalePress,
  emptyMessage = "No sales found. Create your first sale!",
}) => {
  const renderSaleItem = ({ item }: { item: Sale & { id: number } }) => (
    <SaleCard sale={item} onPress={onSalePress} />
  );

  return (
    <FlatList
      data={sales}
      renderItem={renderSaleItem}
      keyExtractor={(item) => item.id?.toString() ?? `sale-${Math.random()}`}
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