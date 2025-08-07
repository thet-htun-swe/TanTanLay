import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { saveCustomer } from "../../services/database";
import { Customer } from "../../types";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";
import { CustomerSelectionModal } from "./CustomerForm";

interface CustomerSelectorProps {
  selectedCustomer: (Customer & { id?: number }) | null;
  onCustomerSelect: (customer: Customer & { id?: number }) => void;
  style?: any;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onCustomerSelect,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelectCustomer = (customer: Customer & { id: number }) => {
    onCustomerSelect(customer);
  };

  const handleCreateCustomer = async (customer: Customer) => {
    try {
      const customerId = await saveCustomer(customer);
      const newCustomerWithId = { ...customer, id: customerId };
      onCustomerSelect(newCustomerWithId);
    } catch (error) {
      console.error("Failed to create customer:", error);
    }
  };

  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Customer Info</ThemedText>

      {selectedCustomer && (
        <View>
          <ThemedText style={styles.selectedCustomerName}>
            {selectedCustomer.name}
          </ThemedText>
          {selectedCustomer.contact && (
            <ThemedText style={styles.selectedCustomerContact}>
              {selectedCustomer.contact}
            </ThemedText>
          )}
        </View>
      )}
      <TouchableOpacity onPress={() => setIsModalVisible(true)}>
        <ThemedText style={styles.chooseCustomerText}>
          + choose customer
        </ThemedText>
      </TouchableOpacity>

      <CustomerSelectionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelectCustomer={handleSelectCustomer}
        onCreateCustomer={handleCreateCustomer}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
    marginTop: 0,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  selectorButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    minHeight: 60,
    justifyContent: "center",
  },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedCustomerContact: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  selectedCustomerAddress: {
    fontSize: 14,
    opacity: 0.7,
  },
  placeholderText: {
    fontSize: 16,
    opacity: 0.5,
    fontStyle: "italic",
  },
  chooseCustomerText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
    color: "#007AFF",
  },
});
