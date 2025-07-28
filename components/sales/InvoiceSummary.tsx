import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';

interface InvoiceSummaryProps {
  subtotal: number;
  total: number;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ subtotal, total }) => {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <ThemedText>Subtotal:</ThemedText>
        <ThemedText>{subtotal.toFixed(2)}</ThemedText>
      </View>
      <View style={[styles.row, styles.totalRow]}>
        <ThemedText style={styles.totalText}>Total:</ThemedText>
        <ThemedText style={styles.totalText}>
          {total.toFixed(2)}
        </ThemedText>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  totalText: {
    fontWeight: '700',
    fontSize: 18,
  },
});