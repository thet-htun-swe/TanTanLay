import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RoleSelector } from "@/components/users/RoleSelector";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getErrorMessage } from "@/services/api";
import { createStaffUser, MIN_PASSWORD_LENGTH } from "@/services/users";
import { Role } from "@/types";

// Settings > Staff accounts > + (same form layout as Create Product/Customer)
export default function NewStaffAccountScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSave =
    !!fullName.trim() && !!email.trim() && password.length >= MIN_PASSWORD_LENGTH && !isSubmitting;

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await createStaffUser({ fullName: fullName.trim(), email: email.trim(), password, role });
      Alert.alert(
        "Account created",
        `${fullName.trim()} can now log in with ${email.trim()} and the password you set.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Failed to create the account"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Input
            label="Name *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Ma Aye"
            autoCapitalize="words"
            containerStyle={styles.field}
          />
          <Input
            label="Email (used to log in) *"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            containerStyle={styles.field}
          />
          <Input
            label="Password *"
            value={password}
            onChangeText={setPassword}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.field}
          />
          <ThemedText style={[styles.hint, { color: theme.muted }]}>
            Give this password to the person. They can log in straight away.
          </ThemedText>

          <RoleSelector value={role} onChange={setRole} />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              style={styles.button}
              disabled={isSubmitting}
            />
            <Button
              title={isSubmitting ? "Creating..." : "Create"}
              onPress={handleCreate}
              style={styles.button}
              disabled={!canSave}
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
  field: {
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    marginTop: -8,
    marginBottom: 16,
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
