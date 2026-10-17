import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/Input";
import {
  ListRow,
  listRowStyles,
  ListSeparator,
  RowIconButton,
} from "@/components/ui/ListRow";
import { getErrorMessage, searchProducts } from "@/services/api";
import { useAppStore, useIsAdmin } from "@/store";
import { Product } from "@/types";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function ProductsScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { removeProduct } = useAppStore();
  const isAdmin = useIsAdmin();
  const productsVersion = useAppStore((state) => state.productsVersion);
  const [products, setProducts] = useState<(Product & { id: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadRequest = useRef(0);

  // silent: live update from another phone (no spinner, no error pop-up)
  const loadProducts = useCallback(async (search: string, silent = false) => {
    const request = ++loadRequest.current;
    try {
      if (!silent) setIsLoading(true);
      setIsLoadingMore(false);
      const productsData = await searchProducts(search);
      if (request !== loadRequest.current) return;

      setProducts(productsData);
      setHasMore(productsData.length === 50);
    } catch (error) {
      if (request === loadRequest.current) {
        console.error("Failed to load products:", error);
        if (!silent) {
          Alert.alert("Error", getErrorMessage(error, "Failed to load products"));
        }
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
        Alert.alert("Error", getErrorMessage(error, "Failed to load more products"));
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

  // Another phone changed products: reload the list (keeping the search)
  const searchTermRef = useRef(searchTerm);
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);
  useEffect(() => {
    if (productsVersion > 0) loadProducts(searchTermRef.current, true);
  }, [productsVersion, loadProducts]);

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    loadProducts(text);
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await removeProduct(productId);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Failed to delete product"));
    }
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

  const LOW_STOCK = 5;

  const renderProductItem = ({ item }: { item: Product & { id: number } }) => {
    const stockColor =
      item.stockQty <= 0 ? theme.danger : item.stockQty <= LOW_STOCK ? theme.warning : theme.muted;
    const stockText =
      item.stockQty <= 0
        ? "Out of stock"
        : item.stockQty <= LOW_STOCK
          ? `Low stock · ${item.stockQty} left`
          : `Stock ${item.stockQty}`;

    return (
      <ListRow
        title={item.name}
        subtitle={<ThemedText style={[styles.stock, { color: stockColor }]}>{stockText}</ThemedText>}
        // Admin can tap the row to edit
        onPress={isAdmin ? () => router.push(`/product/${item.id}`) : undefined}
        trailing={
          <View style={styles.trailing}>
            <ThemedText style={listRowStyles.amount}>{item.price.toFixed(2)}</ThemedText>
            {/* Only admin can change products */}
            {isAdmin && (
              <>
                <RowIconButton
                  onPress={() => router.push(`/product/${item.id}`)}
                  accessibilityLabel={`Edit ${item.name}`}
                >
                  <Ionicons name="create-outline" size={20} color={theme.tint} />
                </RowIconButton>
                <RowIconButton
                  onPress={() => confirmDeleteProduct(item.id)}
                  accessibilityLabel={`Delete ${item.name}`}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.danger} />
                </RowIconButton>
              </>
            )}
          </View>
        }
      />
    );
  };

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
          ItemSeparatorComponent={ListSeparator}
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

      {/* Floating Action Button (FAB), admin only */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.tint }]}
          onPress={() => router.push("/product/create")}
          // onPress={() => setIsBottomSheetVisible(true)}
        >
          <Ionicons name="add" size={24} color={theme.onTint} />
        </TouchableOpacity>
      )}
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
    paddingTop: 8,
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
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  stock: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
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
