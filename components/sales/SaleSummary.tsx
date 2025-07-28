import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface SaleSummaryProps {
  subtotal: number;
  total: number;
  onCreateSale: () => void;
  loading?: boolean;
}

export const SaleSummary: React.FC<SaleSummaryProps> = ({
  subtotal,
  total,
  onCreateSale,
  loading = false,
}) => {
  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Summary</ThemedText>

      <View style={styles.summaryItem}>
        <ThemedText>Subtotal:</ThemedText>
        <ThemedText>{subtotal.toFixed(2)}</ThemedText>
      </View>

      <View style={[styles.summaryItem, styles.totalItem]}>
        <ThemedText style={styles.totalText}>Total:</ThemedText>
        <ThemedText style={styles.totalText}>
          {total.toFixed(2)}
        </ThemedText>
      </View>

      <Button
        title={loading ? "Creating..." : "Create Sale"}
        onPress={onCreateSale}
        style={styles.createButton}
        disabled={loading}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 100,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  totalText: {
    fontWeight: '700',
    fontSize: 18,
  },
  createButton: {
    marginTop: 16,
  },
});