import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";

import { CustomerFields } from "@/components/customers/CustomerFields";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { getErrorMessage, saveCustomer } from "@/services/api";
import { Customer } from "@/types";

// Same layout as Create Product
export default function CreateCustomerScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Customer>({
    name: "",
    contact: "",
    address: "",
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await saveCustomer({ ...formData, name: formData.name.trim() });
      Alert.alert("Success", "Customer created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to create customer:", error);
      Alert.alert("Error", getErrorMessage(error, "Failed to create customer"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (formData.name || formData.contact || formData.address) {
      Alert.alert("Discard Changes", "Are you sure you want to discard your changes?", [
        { text: "Keep Editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

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
              title={isSubmitting ? "Creating..." : "Create"}
              onPress={handleSave}
              style={styles.button}
              disabled={isSubmitting || !formData.name.trim()}
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
