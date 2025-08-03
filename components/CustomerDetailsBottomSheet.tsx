import { ThemedText } from "@/components/ThemedText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { deleteCustomer } from "@/services/database";
import { Customer } from "@/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";

interface CustomerDetailsBottomSheetProps {
  customer: (Customer & { id: number }) | null;
  isVisible: boolean;
  onClose: () => void;
  onEdit: (customer: Customer & { id: number }) => void;
  onDelete: () => void;
}

export const CustomerDetailsBottomSheet: React.FC<
  CustomerDetailsBottomSheetProps
> = ({ customer, isVisible, onClose, onEdit, onDelete }) => {
  const colorScheme = useColorScheme();

  if (!customer) return null;

  const handleEdit = () => {
    onClose();
    onEdit(customer);
  };

  const handleDelete = () => {
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
              onClose();
              onDelete();
              Alert.alert("Success", "Customer deleted successfully");
            } catch (error) {
              console.error("Failed to delete customer:", error);
              Alert.alert("Error", "Failed to delete customer");
            }
          },
        },
      ]
    );
  };

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose} height={500}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.customerName}>
            {customer.name}
          </ThemedText>
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="phone"
              size={20}
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
              size={20}
              color={Colors[colorScheme ?? "light"].icon}
            />
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Address</ThemedText>
              <ThemedText style={styles.detailValue}>
                {customer.address || "No address provided"}
              </ThemedText>
            </View>
          </View>
        </Card>

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
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  customerName: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  detailsCard: {
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionsSection: {
    gap: 12,
    paddingTop: 8,
  },
  actionButton: {
    paddingVertical: 12,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
});
