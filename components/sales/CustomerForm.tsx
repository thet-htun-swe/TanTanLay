import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { getCustomers } from "../../services/database";
import { Customer } from "../../types";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

interface CustomerFormProps {
  name: string;
  contact: string;
  address: string;
  onNameChange: (text: string) => void;
  onContactChange: (text: string) => void;
  onAddressChange: (text: string) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  name,
  contact,
  address,
  onNameChange,
  onContactChange,
  onAddressChange,
}) => {
  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Customer Information</ThemedText>

      <Input
        label="Customer Name"
        value={name}
        onChangeText={onNameChange}
        placeholder="Enter customer name"
        containerStyle={styles.input}
      />

      <Input
        label="Contact (Phone)"
        value={contact}
        onChangeText={(text) => {
          // Only allow numeric input
          const numericValue = text.replace(/[^0-9]/g, "");
          onContactChange(numericValue);
        }}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        containerStyle={styles.input}
      />

      <Input
        label="Address"
        value={address}
        onChangeText={onAddressChange}
        placeholder="Enter customer address"
        multiline={true}
        numberOfLines={3}
        containerStyle={styles.input}
      />
    </Card>
  );
};

interface CustomerSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer & { id: number }) => void;
  onCreateCustomer: (customer: Customer) => void;
}

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  visible,
  onClose,
  onSelectCustomer,
  onCreateCustomer,
}) => {
  const [customers, setCustomers] = useState<(Customer & { id: number })[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<
    (Customer & { id: number })[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Customer>({
    name: "",
    contact: "",
    address: "",
  });

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customersData = await getCustomers();
      setCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (error) {
      console.error("Failed to load customers:", error);
      Alert.alert("Error", "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCustomers();
      setSearchQuery("");
      setShowCreateForm(false);
      setNewCustomer({ name: "", contact: "", address: "" });
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
      setShowCreateForm(false);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.contact.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowCreateForm(filtered.length === 0);
      if (filtered.length === 0) {
        setNewCustomer((prev) => ({ ...prev, name: searchQuery }));
      }
    }
  }, [searchQuery, customers]);

  const handleSelectCustomer = (customer: Customer & { id: number }) => {
    onSelectCustomer(customer);
    onClose();
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name.trim()) {
      Alert.alert("Error", "Please enter customer name");
      return;
    }
    onCreateCustomer(newCustomer);
    onClose();
  };

  const renderCustomerItem = ({
    item,
  }: {
    item: Customer & { id: number };
  }) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleSelectCustomer(item)}
    >
      <View style={styles.customerInfo}>
        <ThemedText style={styles.customerName}>{item.name}</ThemedText>
        {item.contact && (
          <ThemedText style={styles.customerContact}>{item.contact}</ThemedText>
        )}
        {item.address && (
          <ThemedText style={styles.customerAddress}>{item.address}</ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
        <ScrollView
          style={styles.modalScrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Customer</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Input
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={styles.searchInput}
            />
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <View style={styles.contentContainer}>
              {showCreateForm ? (
                <View style={styles.createFormContainer}>
                  <ThemedText style={styles.createFormTitle}>
                    Create New Customer
                  </ThemedText>
                  <Input
                    label="Customer Name"
                    value={newCustomer.name}
                    onChangeText={(text) =>
                      setNewCustomer((prev) => ({ ...prev, name: text }))
                    }
                    placeholder="Enter customer name"
                    containerStyle={styles.input}
                  />
                  <Input
                    label="Contact (Phone)"
                    value={newCustomer.contact}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9]/g, "");
                      setNewCustomer((prev) => ({
                        ...prev,
                        contact: numericValue,
                      }));
                    }}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    containerStyle={styles.input}
                  />
                  <Input
                    label="Address"
                    value={newCustomer.address}
                    onChangeText={(text) =>
                      setNewCustomer((prev) => ({ ...prev, address: text }))
                    }
                    placeholder="Enter address"
                    multiline={true}
                    numberOfLines={3}
                    containerStyle={styles.input}
                  />
                  <Button
                    title="Create Customer"
                    onPress={handleCreateCustomer}
                    style={styles.createButton}
                  />
                </View>
              ) : (
                <View style={styles.customersListContainer}>
                  {filteredCustomers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <ThemedText style={styles.emptyText}>
                        No customers found
                      </ThemedText>
                    </View>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={styles.customerItem}
                        onPress={() => handleSelectCustomer(customer)}
                      >
                        <View style={styles.customerInfo}>
                          <ThemedText style={styles.customerName}>
                            {customer.name}
                          </ThemedText>
                          {customer.contact && (
                            <ThemedText style={styles.customerContact}>
                              {customer.contact}
                            </ThemedText>
                          )}
                          {customer.address && (
                            <ThemedText style={styles.customerAddress}>
                              {customer.address}
                            </ThemedText>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    paddingTop: 20,
  },
  modalScrollContainer: {
    flex: 1,
  },
  customersListContainer: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  customersList: {
    flex: 1,
  },
  customerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 14,
    opacity: 0.7,
  },
  createFormContainer: {
    paddingVertical: 20,
  },
  createFormTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  createButton: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
});
