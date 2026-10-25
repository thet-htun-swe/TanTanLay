import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
import { ListRow, ListSeparator, RowIconButton } from "@/components/ui/ListRow";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { deleteCustomer, getErrorMessage, searchCustomers } from "@/services/api";
import { useToast } from "@/components/ui/Toast";
import { useAppStore, useIsAdmin } from "@/store";
import { Customer } from "@/types";
import { useRouter } from "expo-router";

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const toast = useToast();
  const [customers, setCustomers] = useState<(Customer & { id: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadRequest = useRef(0);
  const isAdmin = useIsAdmin();

  // silent: live update from another phone (no spinner, no error pop-up)
  const loadCustomers = useCallback(async (search: string, silent = false) => {
    const request = ++loadRequest.current;
    try {
      if (!silent) setIsLoading(true);
      setIsLoadingMore(false);
      const customersData = await searchCustomers(search);
      if (request !== loadRequest.current) return;

      setCustomers(customersData);
      setHasMore(customersData.length === 50);
    } catch (error) {
      if (request === loadRequest.current) {
        console.error("Failed to load customers:", error);
        if (!silent) {
          Alert.alert("Error", getErrorMessage(error, "Failed to load customers"));
        }
      }
    } finally {
      if (request === loadRequest.current) setIsLoading(false);
    }
  }, []);

  const loadMoreCustomers = async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    const request = loadRequest.current;
    setIsLoadingMore(true);
    try {
      const customersData = await searchCustomers(searchTerm, customers.length);
      if (request !== loadRequest.current) return;

      setCustomers((current) => [...current, ...customersData]);
      setHasMore(customersData.length === 50);
    } catch (error) {
      if (request === loadRequest.current) {
        console.error("Failed to load more customers:", error);
        Alert.alert("Error", getErrorMessage(error, "Failed to load more customers"));
      }
    } finally {
      if (request === loadRequest.current) setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers("");
    }, [loadCustomers]),
  );

  // Another phone changed customers: reload the list (keeping the search)
  const customersVersion = useAppStore((state) => state.customersVersion);
  const searchTermRef = useRef(searchTerm);
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);
  useEffect(() => {
    if (customersVersion > 0) loadCustomers(searchTermRef.current, true);
  }, [customersVersion, loadCustomers]);

  const handleCreateCustomer = () => {
    router.push("/customer/create");
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    loadCustomers(text);
  };

  const handleEditCustomer = (customer: Customer & { id: number }) => {
    router.push(`/customer/${customer.id}/edit`);
  };

  // Same flow as deleting a product (admin only)
  const confirmDeleteCustomer = (customer: Customer & { id: number }) => {
    Alert.alert("Delete Customer", `Are you sure you want to delete ${customer.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCustomer(customer.id);
          } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete customer"));
          }
          loadCustomers(searchTerm);
        },
      },
    ]);
  };

  const theme = Colors[colorScheme ?? "light"];

  const renderCustomer = ({ item: customer }: { item: Customer & { id: number } }) => (
    <ListRow
      title={customer.name}
      subtitle={[customer.contact, customer.address].filter(Boolean).join(" · ")}
      // Tap the row to edit (same as products)
      onPress={() => handleEditCustomer(customer)}
      leading={
        // People use the secondary (mint) colour
        <View style={[styles.avatar, { backgroundColor: theme.secondarySurface }]}>
          <ThemedText style={[styles.avatarText, { color: theme.secondary }]}>
            {customer.name.trim().charAt(0).toUpperCase() || "?"}
          </ThemedText>
        </View>
      }
      trailing={
        <View style={styles.trailing}>
          <RowIconButton
            onPress={() => handleEditCustomer(customer)}
            accessibilityLabel={`Edit ${customer.name}`}
          >
            <Ionicons name="create-outline" size={20} color={theme.tint} />
          </RowIconButton>
          {/* Only admin can delete customers */}
          {isAdmin && (
            <RowIconButton
              onPress={() => confirmDeleteCustomer(customer)}
              accessibilityLabel={`Delete ${customer.name}`}
            >
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
            </RowIconButton>
          )}
        </View>
      }
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Customers</ThemedText>
      </View>

      <Input
        placeholder="Search customers..."
        value={searchTerm}
        onChangeText={handleSearch}
      />

      {isLoading ? (
        <ThemedView style={styles.centerContainer}>
          <ThemedText>Loading customers...</ThemedText>
        </ThemedView>
      ) : customers.length === 0 ? (
        <ThemedView style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="account-group"
            size={64}
            color={Colors[colorScheme ?? "light"].icon}
          />
          <ThemedText style={styles.emptyText}>
            {searchTerm
              ? "No customers found matching your search."
              : "No customers found"}
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Tap the + button to add your first customer
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomer}
          keyExtractor={(customer) => customer.id.toString()}
          contentContainerStyle={styles.scrollView}
          ItemSeparatorComponent={ListSeparator}
          onEndReached={loadMoreCustomers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator style={styles.loadMore} /> : null
          }
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: Colors[colorScheme ?? "light"].tint },
        ]}
        onPress={handleCreateCustomer}
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
  scrollView: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  loadMore: {
    marginVertical: 16,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 8,
  },
});
