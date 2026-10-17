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

import { CustomerDetailsBottomSheet } from "@/components/CustomerDetailsBottomSheet";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Input } from "@/components/ui/Input";
import { ListRow, ListSeparator } from "@/components/ui/ListRow";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getErrorMessage, searchCustomers } from "@/services/api";
import { useAppStore } from "@/store";
import { Customer } from "@/types";
import { useRouter } from "expo-router";

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [customers, setCustomers] = useState<(Customer & { id: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadRequest = useRef(0);
  const [selectedCustomer, setSelectedCustomer] = useState<
    (Customer & { id: number }) | null
  >(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

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

  const handleViewCustomer = (customer: Customer & { id: number }) => {
    setSelectedCustomer(customer);
    setIsBottomSheetVisible(true);
  };

  const handleEditCustomer = (customer: Customer & { id: number }) => {
    router.push(`/customer/${customer.id}/edit`);
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = () => {
    loadCustomers(searchTerm);
  };

  const theme = Colors[colorScheme ?? "light"];

  const renderCustomer = ({ item: customer }: { item: Customer & { id: number } }) => (
    <ListRow
      title={customer.name}
      subtitle={[customer.contact, customer.address].filter(Boolean).join(" · ")}
      onPress={() => handleViewCustomer(customer)}
      leading={
        <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.avatarText, { color: theme.tint }]}>
            {customer.name.trim().charAt(0).toUpperCase() || "?"}
          </ThemedText>
        </View>
      }
      trailing={<MaterialCommunityIcons name="chevron-right" size={22} color={theme.icon} />}
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
        <MaterialCommunityIcons name="plus" size={24} color={Colors[colorScheme ?? "light"].onTint} />
      </TouchableOpacity>

      <CustomerDetailsBottomSheet
        customer={selectedCustomer}
        isVisible={isBottomSheetVisible}
        onClose={handleCloseBottomSheet}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
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
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  scrollView: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  loadMore: {
    marginVertical: 16,
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
