import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { databaseService, deleteCustomer } from "@/services/database";
import { Customer } from "@/types";

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [customer, setCustomer] = useState<(Customer & { id: number }) | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setIsLoading(true);
      const customers = await databaseService.getCustomers();
      const foundCustomer = customers.find(
        (c) => c.id === parseInt(id as string)
      );
      setCustomer(foundCustomer || null);
    } catch (error) {
      console.error("Failed to load customer:", error);
      Alert.alert("Error", "Failed to load customer details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/customer/${id}/edit`);
  };

  const handleDelete = () => {
    if (!customer) return;

    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomer(customer.id);
              Alert.alert("Success", "Customer deleted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error("Failed to delete customer:", error);
              Alert.alert("Error", "Failed to delete customer");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold">Customer Details</ThemedText>
          <View style={{ width: 24 }} />
        </ThemedView>
        <ThemedView style={styles.centerContainer}>
          <ThemedText>Loading customer details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold">Customer Details</ThemedText>
          <View style={{ width: 24 }} />
        </ThemedView>
        <ThemedView style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="account-alert"
            size={64}
            color={Colors[colorScheme ?? "light"].icon}
          />
          <ThemedText style={styles.emptyText}>Customer not found</ThemedText>
          <Button title="Go Back" onPress={() => router.back()} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.customerCard}>
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color={Colors[colorScheme ?? "light"].icon}
              />
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Contact</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {customer.contact || "No contact information"}
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={Colors[colorScheme ?? "light"].icon}
              />
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Address</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {customer.address || "No address provided"}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Button
              title="Edit Customer"
              onPress={handleEdit}
              style={{
                ...styles.actionButton,
                backgroundColor: Colors[colorScheme ?? "light"].tint,
              }}
            />
            <Button
              title="Delete Customer"
              onPress={handleDelete}
              style={{
                ...styles.actionButton,
                ...styles.deleteButton,
              }}
              textStyle={{ color: "white" }}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  customerCard: {
    padding: 24,
  },
  customerHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  customerName: {
    textAlign: "center",
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
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
    marginBottom: 24,
  },
});
