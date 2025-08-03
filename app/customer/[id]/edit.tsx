import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
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
import { databaseService, updateCustomer } from "@/services/database";
import { Customer } from "@/types";

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [customer, setCustomer] = useState<(Customer & { id: number }) | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Customer>({
    name: "",
    contact: "",
    address: "",
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  useEffect(() => {
    if (customer) {
      const changes =
        formData.name !== customer.name ||
        formData.contact !== customer.contact ||
        formData.address !== customer.address;
      setHasChanges(changes);
    }
  }, [formData, customer]);

  const loadCustomer = async () => {
    try {
      setIsLoading(true);
      const customers = await databaseService.getCustomers();
      const foundCustomer = customers.find(
        (c) => c.id === parseInt(id as string)
      );

      if (foundCustomer) {
        setCustomer(foundCustomer);
        setFormData({
          name: foundCustomer.name,
          contact: foundCustomer.contact,
          address: foundCustomer.address,
        });
      } else {
        Alert.alert("Error", "Customer not found", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Failed to load customer:", error);
      Alert.alert("Error", "Failed to load customer details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }

    if (!customer) return;

    try {
      setIsSaving(true);
      await updateCustomer({
        ...formData,
        id: customer.id,
      });
      Alert.alert("Success", "Customer updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to update customer:", error);
      Alert.alert("Error", "Failed to update customer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to discard your changes?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold">Edit Customer</ThemedText>
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
              name="close"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold">Edit Customer</ThemedText>
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
        <Card style={styles.formCard}>
          <View style={styles.formSection}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Contact Information</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors[colorScheme ?? "light"].background,
                    borderColor: Colors[colorScheme ?? "light"].border,
                    color: Colors[colorScheme ?? "light"].text,
                  },
                ]}
                value={formData.contact}
                onChangeText={(text) =>
                  setFormData({ ...formData, contact: text })
                }
                placeholder="Phone number or email"
                placeholderTextColor={
                  Colors[colorScheme ?? "light"].tabIconDefault
                }
                keyboardType="email-address"
              />
              <ThemedText style={styles.helpText}>
                Phone number, email, or other contact method
              </ThemedText>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Address</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: Colors[colorScheme ?? "light"].background,
                    borderColor: Colors[colorScheme ?? "light"].border,
                    color: Colors[colorScheme ?? "light"].text,
                  },
                ]}
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
                placeholder="Enter customer address"
                placeholderTextColor={
                  Colors[colorScheme ?? "light"].tabIconDefault
                }
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.buttonSection}>
            <Button
              title="Update Customer"
              onPress={handleSave}
              disabled={isSaving || !formData.name.trim() || !hasChanges}
              style={{
                ...styles.saveButton,
                backgroundColor: Colors[colorScheme ?? "light"].tint,
                opacity:
                  isSaving || !formData.name.trim() || !hasChanges ? 0.5 : 1,
              }}
            />
            <Button
              title="Cancel"
              onPress={handleCancel}
              style={styles.cancelButton}
              textStyle={{ color: Colors[colorScheme ?? "light"].text }}
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
  saveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    padding: 24,
  },
  formHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  formSection: {
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {
    color: "#ff4444",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  helpText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  buttonSection: {
    gap: 12,
  },
  saveButton: {
    paddingVertical: 14,
  },
  cancelButton: {
    paddingVertical: 14,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
