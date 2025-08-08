import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { saveCustomer } from "../../services/database";
import { Customer } from "../../types";
import { ThemedText } from "../ThemedText";
import { Button } from "../ui/Button";
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
          <View style={styles.customerRow}>
            <ThemedText style={styles.label}>Name:</ThemedText>
            <ThemedText style={styles.value}>
              {selectedCustomer.name}
            </ThemedText>
          </View>
          {selectedCustomer.contact && (
            <View style={styles.customerRow}>
              <ThemedText style={styles.label}>Ph:</ThemedText>
              <ThemedText style={styles.value}>
                {selectedCustomer.contact}
              </ThemedText>
            </View>
          )}
        </View>
      )}
      <Button
        title="+ choose customer"
        onPress={() => setIsModalVisible(true)}
        variant="primary"
        style={styles.chooseCustomerButton}
      />

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
    marginBottom: 8,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
    width: 50,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
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
  chooseCustomerButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
