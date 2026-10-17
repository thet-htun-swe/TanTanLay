import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";

import { CustomerFields } from "@/components/customers/CustomerFields";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { getCustomerById, getErrorMessage, updateCustomer } from "@/services/api";
import { Customer } from "@/types";

// Same layout as Edit Product
export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<(Customer & { id: number }) | null>(null);
  const [formData, setFormData] = useState<Customer>({ name: "", contact: "", address: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCustomerById(parseInt(id ?? "", 10))
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setCustomer(found);
          setFormData({ name: found.name, contact: found.contact, address: found.address });
        } else {
          Alert.alert("Error", "Customer not found", [
            { text: "OK", onPress: () => router.back() },
          ]);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          Alert.alert("Error", getErrorMessage(error, "Failed to load customer details"));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const hasChanges =
    !!customer &&
    (formData.name !== customer.name ||
      formData.contact !== customer.contact ||
      formData.address !== customer.address);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }
    if (!customer) return;

    try {
      setIsSubmitting(true);
      await updateCustomer({ ...formData, name: formData.name.trim(), id: customer.id });
      Alert.alert("Success", "Customer updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to update customer:", error);
      Alert.alert("Error", getErrorMessage(error, "Failed to update customer"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert("Discard Changes", "Are you sure you want to discard your changes?", [
        { text: "Keep Editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  if (isLoading || !customer) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>{isLoading ? "Loading..." : "Customer not found"}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <CustomerFields value={formData} onChange={setFormData} />
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={handleCancel}
              style={styles.button}
              disabled={isSubmitting}
            />
            <Button
              title={isSubmitting ? "Saving..." : "Save"}
              onPress={handleSave}
              style={styles.button}
              disabled={isSubmitting || !formData.name.trim() || !hasChanges}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});
