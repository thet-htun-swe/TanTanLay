import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { ListRow, listRowStyles, ListSeparator } from "@/components/ui/ListRow";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { SalesDashboard } from "@/components/home/SalesDashboard";
import { useAppStore } from "@/store";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { formatAmount } from "@/utils/salesStats";

const RECENT_COUNT = 5;

// Home: sales dashboard (daily / monthly) and the latest sales
export default function HomeScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { sales, fetchProducts, fetchSales, error } = useAppStore();

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, [fetchProducts, fetchSales]);

  return (
    <ParallaxScrollView
      // Mint (secondary) band at the top of Home
      headerBackgroundColor={{
        light: Colors.light.secondarySurface,
        dark: Colors.dark.secondarySurface,
      }}
      headerImage={<View />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>Clothing Sales</ThemedText>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          hitSlop={10}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={26} color={theme.text} />
        </TouchableOpacity>
      </ThemedView>

      <ErrorBanner
        message={error}
        onRetry={() => {
          fetchProducts();
          fetchSales();
        }}
      />

      <SalesDashboard sales={sales} />

      {sales.length > 0 && (
        <Card style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <ThemedText style={styles.sectionTitle}>Recent sales</ThemedText>
            <TouchableOpacity onPress={() => router.push("/sales")} hitSlop={10}>
              <ThemedText style={[styles.viewAll, { color: theme.tint }]}>View all</ThemedText>
            </TouchableOpacity>
          </View>
          {sales.slice(0, RECENT_COUNT).map((sale, index) => (
            <View key={sale.id}>
              {index > 0 && <ListSeparator />}
              <ListRow
                title={sale.customer.name || "Walk-in customer"}
                subtitle={`#${sale.invoiceNumber ?? sale.id} · ${new Date(sale.orderDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}`}
                onPress={() => router.push(`/sale/${sale.id}`)}
                trailing={
                  <ThemedText style={listRowStyles.amount}>{formatAmount(sale.total)}</ThemedText>
                }
              />
            </View>
          ))}
        </Card>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    flex: 1,
  },
  titleContainer: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recentCard: {
    marginBottom: 100,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "600",
  },
});
