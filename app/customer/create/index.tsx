import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { databaseService } from "@/services/database";
import { Customer } from "@/types";

export default function CreateCustomerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Customer>({
    name: "",
    contact: "",
    address: "",
  });

  // Handle orientation change to dismiss keyboard
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      Keyboard.dismiss();
    });

    return () => subscription?.remove();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }

    try {
      setIsLoading(true);
      await databaseService.saveCustomer(formData);
      Alert.alert("Success", "Customer created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to create customer:", error);
      Alert.alert("Error", "Failed to create customer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.name || formData.contact || formData.address) {
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.formCard}>
            <View style={styles.formSection}>
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Customer Name *</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor:
                        Colors[colorScheme ?? "light"].background,
                      borderColor: Colors[colorScheme ?? "light"].border,
                      color: Colors[colorScheme ?? "light"].text,
                    },
                  ]}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter customer name"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].tabIconDefault
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor:
                        Colors[colorScheme ?? "light"].background,
                      borderColor: Colors[colorScheme ?? "light"].border,
                      color: Colors[colorScheme ?? "light"].text,
                    },
                  ]}
                  value={formData.contact}
                  onChangeText={(text) => {
                    // Only allow numeric input
                    const numericValue = text.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, contact: numericValue });
                  }}
                  placeholder="Enter phone number"
                  placeholderTextColor={
                    Colors[colorScheme ?? "light"].tabIconDefault
                  }
                  keyboardType="phone-pad"
                />
                <ThemedText style={styles.helpText}>
                  Enter phone number (numbers only)
                </ThemedText>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Address</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor:
                        Colors[colorScheme ?? "light"].background,
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
                title="Create Customer"
                onPress={handleSave}
                disabled={isLoading || !formData.name.trim()}
                style={{
                  ...styles.saveButton,
                  backgroundColor: Colors[colorScheme ?? "light"].tint,
                  opacity: isLoading || !formData.name.trim() ? 0.5 : 1,
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
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
});
