import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAppStore } from '@/store';
import { Sale } from '@/types';

export default function SalesScreen() {
  const { sales, fetchSales } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSales(sales);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sales.filter(sale => 
        sale.customer.name.toLowerCase().includes(query) ||
        sale.customer.contact.toLowerCase().includes(query)
      );
      setFilteredSales(filtered);
    }
  }, [sales, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const viewSaleDetails = (saleId: string) => {
    router.push(`/sale/${saleId}`);
  };

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity onPress={() => viewSaleDetails(item.id)}>
      <Card style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <ThemedText style={styles.saleDate}>{formatDate(item.date)}</ThemedText>
          <ThemedText style={styles.saleTotal}>${item.total.toFixed(2)}</ThemedText>
        </View>
        <View style={styles.saleDetails}>
          <ThemedText>Customer: {item.customer.name}</ThemedText>
          {item.customer.contact && (
            <ThemedText>Contact: {item.customer.contact}</ThemedText>
          )}
          <ThemedText>Items: {item.items.length}</ThemedText>
        </View>
        <Button
          title="View Details"
          variant="secondary"
          onPress={() => viewSaleDetails(item.id)}
          style={styles.viewButton}
        />
      </Card>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Sales History</ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by customer name or contact"
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredSales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.salesList}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No sales found. Create your first sale!
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  salesList: {
    paddingBottom: 100,
  },
  saleCard: {
    marginBottom: 12,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleDate: {
    fontSize: 16,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: '600',
  },
  saleDetails: {
    marginBottom: 12,
  },
  viewButton: {
    alignSelf: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
