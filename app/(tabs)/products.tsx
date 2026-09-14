import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { searchProducts } from "@/services/database";
import { useAppStore } from "@/store";
import { Product } from "@/types";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function ProductsScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { removeProduct } = useAppStore();
  const [products, setProducts] = useState<(Product & { id: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadRequest = useRef(0);

  const loadProducts = useCallback(async (search: string) => {
    const request = ++loadRequest.current;
    try {
      setIsLoading(true);
      setIsLoadingMore(false);
      const productsData = await searchProducts(search);
      if (request !== loadRequest.current) return;

      setProducts(productsData);
      setHasMore(productsData.length === 50);
    } catch (error) {
      if (request === loadRequest.current) {
        console.error("Failed to load products:", error);
        Alert.alert("Error", "Failed to load products");
      }
    } finally {
      if (request === loadRequest.current) setIsLoading(false);
    }
  }, []);

  const loadMoreProducts = async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    const request = loadRequest.current;
    setIsLoadingMore(true);
    try {
      const productsData = await searchProducts(searchTerm, products.length);
      if (request !== loadRequest.current) return;

      setProducts((current) => [...current, ...productsData]);
      setHasMore(productsData.length === 50);
    } catch (error) {
      if (request === loadRequest.current) {
        console.error("Failed to load more products:", error);
        Alert.alert("Error", "Failed to load more products");
      }
    } finally {
      if (request === loadRequest.current) setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSearchTerm("");
      loadProducts("");
    }, [loadProducts]),
  );

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    loadProducts(text);
  };

  const handleDeleteProduct = async (productId: number) => {
    await removeProduct(productId);
    loadProducts(searchTerm);
  };

  const confirmDeleteProduct = (productId: number) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => handleDeleteProduct(productId),
          style: "destructive",
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product & { id: number } }) => (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <ThemedText style={styles.productName}>{item.name}</ThemedText>
        <ThemedText style={styles.productPrice}>
          {item.price.toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.productDetails}>
        <ThemedText>Stock: {item.stockQty}</ThemedText>
      </View>
      <View style={styles.productActions}>
        <Button
          title="Edit"
          variant="secondary"
          onPress={() => router.push(`/product/${item.id}`)}
          style={styles.actionButton}
        />
        <Button
          title="Delete"
          variant="danger"
          onPress={() => confirmDeleteProduct(item.id)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Products</ThemedText>
      </View>

      <Input
        placeholder="Search products..."
        value={searchTerm}
        onChangeText={handleSearch}
      />

      {isLoading ? (
        <ThemedView style={styles.centerContainer}>
          <ThemedText>Loading products...</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.productList}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator style={styles.loadMore} /> : null
          }
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {searchTerm
                ? "No products found matching your search."
                : "No products found. Add your first product!"}
            </ThemedText>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint }]}
        onPress={() => router.push("/product/create")}
        // onPress={() => setIsBottomSheetVisible(true)}
      >
        <Ionicons name="add" size={24} color={theme.onTint} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  productList: {
    paddingBottom: 100,
  },
  loadMore: {
    marginVertical: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productCard: {
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "600",
  },
  productDetails: {
    marginBottom: 12,
  },
  productActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  formButton: {
    marginLeft: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  // New styles for bottom sheet and FAB
  bottomSheetContent: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
