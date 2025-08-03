import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomerDetailsBottomSheet } from "@/components/CustomerDetailsBottomSheet";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getCustomers } from "@/services/database";
import { Customer } from "@/types";
import { useRouter } from "expo-router";

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [customers, setCustomers] = useState<(Customer & { id: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<
    (Customer & { id: number }) | null
  >(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customersData = await getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Failed to load customers:", error);
      Alert.alert("Error", "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  const handleCreateCustomer = () => {
    router.push("/customer/create");
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
    loadCustomers();
  };

  const CustomerCard = ({
    customer,
  }: {
    customer: Customer & { id: number };
  }) => (
    <TouchableOpacity onPress={() => handleViewCustomer(customer)}>
      <Card style={styles.customerCard}>
        <View style={styles.customerInfo}>
          <ThemedText type="defaultSemiBold" style={styles.customerName}>
            {customer.name}
          </ThemedText>
          {customer.contact && (
            <ThemedText style={styles.customerDetail}>
              📞 {customer.contact}
            </ThemedText>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Customers</ThemedText>
      </ThemedView>

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
          <ThemedText style={styles.emptyText}>No customers found</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Tap the + button to add your first customer
          </ThemedText>
        </ThemedView>
      ) : (
        <ScrollView style={styles.scrollView}>
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: Colors[colorScheme ?? "light"].tint },
        ]}
        onPress={handleCreateCustomer}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
      </TouchableOpacity>

      <CustomerDetailsBottomSheet
        customer={selectedCustomer}
        isVisible={isBottomSheetVisible}
        onClose={handleCloseBottomSheet}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
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
    flex: 1,
    padding: 16,
  },
  customerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  customerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#666",
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
