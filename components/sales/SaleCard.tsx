import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { Sale } from '@/types';

interface SaleCardProps {
  sale: Sale & { id: number };
  onPress: (saleId: number) => void;
}

export const SaleCard: React.FC<SaleCardProps> = ({ sale, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <TouchableOpacity onPress={() => onPress(sale.id)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <ThemedText style={styles.date}>
            {formatDate(sale.date)}
          </ThemedText>
          <ThemedText style={styles.total}>
            {sale.total.toFixed(2)}
          </ThemedText>
        </View>
        
        <View style={styles.details}>
          <ThemedText>Customer: {sale.customer.name}</ThemedText>
          {sale.customer.contact && (
            <ThemedText>Contact: {sale.customer.contact}</ThemedText>
          )}
          <ThemedText>Items: {sale.items.length}</ThemedText>
        </View>
        
        <TouchableOpacity
          onPress={() => onPress(sale.id)}
          style={styles.viewDetailsLink}
        >
          <ThemedText style={styles.viewDetailsText}>
            View Details <Ionicons name="chevron-forward" size={14} />
          </ThemedText>
        </TouchableOpacity>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
  },
  total: {
    fontSize: 18,
    fontWeight: '600',
  },
  details: {
    marginBottom: 12,
  },
  viewDetailsLink: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewDetailsText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
});