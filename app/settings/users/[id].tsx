import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet } from "react-native";

import { ErrorBanner } from "@/components/common/ErrorBanner";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { RoleSelector } from "@/components/users/RoleSelector";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getErrorMessage } from "@/services/api";
import { listStaffUsers, MIN_PASSWORD_LENGTH, StaffUser, updateStaffUser } from "@/services/users";
import { useAppStore } from "@/store";
import { Role } from "@/types";

// Settings > Staff accounts > (account): name & role, new password, disable
export default function EditStaffAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const myId = useAppStore((state) => state.session?.user.id);
  const isSelf = id === myId;

  const [user, setUser] = useState<StaffUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"details" | "password" | "access" | null>(null);

  const load = useCallback(async () => {
    try {
      const found = (await listStaffUsers()).find((candidate) => candidate.id === id) ?? null;
      setUser(found);
      if (found) {
        setFullName(found.fullName);
        setRole(found.role);
      }
      setLoadError(found ? null : "Account not found");
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load the account"));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const run = async (
    part: "details" | "password" | "access",
    changes: Parameters<typeof updateStaffUser>[1],
    successMessage: string,
  ) => {
    setBusy(part);
    try {
      await updateStaffUser(id, changes);
      if (isSelf) await useAppStore.getState().loadProfile(); // own name shown in Settings
      await load();
      Alert.alert("Saved", successMessage);
      return true;
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "Could not save the change"));
      return false;
    } finally {
      setBusy(null);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        {loadError ? (
          <>
            <ErrorBanner message={loadError} onRetry={load} />
            <Button title="Go Back" variant="secondary" onPress={() => router.back()} />
          </>
        ) : (
          <ThemedText>Loading...</ThemedText>
        )}
      </ThemedView>
    );
  }

  const detailsChanged = fullName.trim() !== user.fullName || role !== user.role;

  const savePassword = async () => {
    const saved = await run(
      "password",
      { password },
      `New password set for ${user.fullName || user.email}. Give it to them to log in.`,
    );
    if (saved) setPassword("");
  };

  const toggleAccess = () => {
    const disable = !user.disabled;
    Alert.alert(
      disable ? "Disable account" : "Enable account",
      disable
        ? `${user.fullName || user.email} will not be able to log in. Their sales stay in the history. A phone that is already logged in may keep working for up to an hour.`
        : `${user.fullName || user.email} will be able to log in again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: disable ? "Disable" : "Enable",
          style: disable ? "destructive" : "default",
          onPress: () =>
            run("access", { disabled: disable }, disable ? "Account disabled." : "Account enabled."),
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <ThemedText style={[styles.email, { color: theme.muted }]}>{user.email}</ThemedText>
          {user.disabled && (
            <ThemedText style={[styles.disabledNote, { color: theme.danger }]}>
              This account is disabled and cannot log in.
            </ThemedText>
          )}

          <Card>
            <Input
              label="Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              containerStyle={styles.field}
            />
            <RoleSelector value={role} onChange={setRole} disabled={isSelf} />
            {isSelf && (
              <ThemedText style={[styles.note, { color: theme.muted }]}>
                You cannot change your own role.
              </ThemedText>
            )}
            <Button
              title={busy === "details" ? "Saving..." : "Save"}
              onPress={() =>
                run(
                  "details",
                  { fullName: fullName.trim(), ...(isSelf ? {} : { role }) },
                  "Name and role saved.",
                )
              }
              disabled={!detailsChanged || !fullName.trim() || busy !== null}
            />
          </Card>

          <Card>
            <ThemedText style={styles.sectionTitle}>Set a new password</ThemedText>
            <ThemedText style={[styles.note, { color: theme.muted }]}>
              Use this when someone forgets their password.
            </ThemedText>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.field}
            />
            <Button
              title={busy === "password" ? "Saving..." : "Set password"}
              variant="secondary"
              onPress={savePassword}
              disabled={password.length < MIN_PASSWORD_LENGTH || busy !== null}
            />
          </Card>

          {!isSelf && (
            <Card>
              <ThemedText style={styles.sectionTitle}>Access</ThemedText>
              <ThemedText style={[styles.note, { color: theme.muted }]}>
                {user.disabled
                  ? "Let this person log in again."
                  : "Stop this person from logging in (e.g. when they leave). Their sales history is kept."}
              </ThemedText>
              <Button
                title={
                  busy === "access" ? "Saving..." : user.disabled ? "Enable account" : "Disable account"
                }
                variant={user.disabled ? "primary" : "danger"}
                onPress={toggleAccess}
                disabled={busy !== null}
              />
            </Card>
          )}
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
    paddingBottom: 32,
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
  },
  disabledNote: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  field: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
});
