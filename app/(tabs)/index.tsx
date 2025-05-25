import { Image } from 'expo-image';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store';

export default function HomeScreen() {
  const { products, sales, fetchProducts, fetchSales } = useAppStore();

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, [fetchProducts, fetchSales]);

  const navigateTo = (route: 
    | '/' 
    | '/products' 
    | '/sales' 
    | '/explore' 
    | '/new-sale' 
    | `/sale/${string}`) => {
    router.push(route);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<View />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">TantanLay Invoicing</ThemedText>
      </ThemedView>

      <Card style={styles.statsCard}>
        <ThemedText style={styles.sectionTitle}>Dashboard</ThemedText>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => navigateTo('/products')}
          >
            <ThemedText style={styles.statValue}>{products.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Products</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => navigateTo('/sales')}
          >
            <ThemedText style={styles.statValue}>{sales.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Invoices</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => navigateTo('/sales')}
          >
            <ThemedText style={styles.statValue}>
              ${sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Revenue</ThemedText>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.actionsCard}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionButtons}>
          <Button 
            title="Add Product" 
            onPress={() => navigateTo('/products')} 
            style={styles.actionButton}
          />
          <Button 
            title="New Sale" 
            onPress={() => navigateTo('/new-sale')} 
            style={styles.actionButton}
          />
          <Button 
            title="View History" 
            onPress={() => navigateTo('/sales')} 
            style={styles.actionButton}
          />
        </View>
      </Card>

      {sales.length > 0 && (
        <Card style={styles.recentCard}>
          <ThemedText style={styles.sectionTitle}>Recent Invoices</ThemedText>
          {sales.slice(0, 3).map(sale => (
            <TouchableOpacity 
              key={sale.id} 
              style={styles.recentItem}
              onPress={() => navigateTo(`/sale/${sale.id}`)}
            >
              <View>
                <ThemedText style={styles.recentTitle}>
                  {sale.customer.name}
                </ThemedText>
                <ThemedText style={styles.recentDate}>
                  {new Date(sale.date).toLocaleDateString()}
                </ThemedText>
              </View>
              <ThemedText style={styles.recentAmount}>
                ${sale.total.toFixed(2)}
              </ThemedText>
            </TouchableOpacity>
          ))}
          {sales.length > 3 && (
            <Button 
              title="View All" 
              variant="secondary" 
              onPress={() => navigateTo('/sales')} 
              style={styles.viewAllButton}
            />
          )}
        </Card>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  statsCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    gap: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  recentCard: {
    marginBottom: 100,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentDate: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
});
