import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabaseHost } from "@/lib/supabase";
import { getPaperWidth, getPrinterSettings } from "@/services/localSettings";
import { useAppStore } from "@/store";

// Account, printing and app info in one place (opened from the gear on Home)
export default function SettingsScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { profile, session, signOut } = useAppStore();
  const [printerSummary, setPrinterSummary] = useState("Not set up");

  // Refresh when coming back from the printer screen
  useFocusEffect(
    useCallback(() => {
      Promise.all([getPrinterSettings(), getPaperWidth()])
        .then(([printer, paperWidth]) => {
          const printerName = !printer
            ? "No printer selected"
            : printer.connectionType === "bluetooth"
              ? printer.name
              : `Wi-Fi ${printer.host}`;
          const width = paperWidth === 80 ? "80 mm full width" : "Standard width";
          setPrinterSummary(`${printerName} · ${width}`);
        })
        .catch((error) => console.warn("Failed to load printer settings:", error));
    }, []),
  );

  const name = profile?.fullName || session?.user.email || "Unknown user";
  const email = session?.user.email ?? "";
  const isAdmin = profile?.role === "admin";

  const confirmSignOut = () => {
    Alert.alert("Log out", "Do you want to log out of this phone?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Log out", error instanceof Error ? error.message : "Could not log out");
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.sectionLabel}>ACCOUNT</ThemedText>
        <Card>
          <View style={styles.accountRow}>
            <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
              <Text style={[styles.avatarText, { color: theme.onTint }]}>
                {name.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.accountText}>
              <ThemedText style={styles.accountName} numberOfLines={1}>
                {name}
              </ThemedText>
              {email && email !== name ? (
                <ThemedText style={styles.muted} numberOfLines={1}>
                  {email}
                </ThemedText>
              ) : null}
            </View>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: isAdmin ? theme.tint : theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.roleText, { color: isAdmin ? theme.onTint : theme.text }]}>
                {isAdmin ? "Admin" : "Staff"}
              </Text>
            </View>
          </View>
          <Button
            title="Log out"
            variant="secondary"
            onPress={confirmSignOut}
            style={styles.logoutButton}
          />
        </Card>

        {isAdmin && (
          <>
            <ThemedText style={styles.sectionLabel}>SHOP</ThemedText>
            <Card style={styles.listCard}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/settings/users")}
                accessibilityRole="button"
              >
                <Ionicons name="people-outline" size={24} color={theme.tint} />
                <View style={styles.rowText}>
                  <ThemedText style={styles.rowTitle}>Staff accounts</ThemedText>
                  <ThemedText style={styles.muted} numberOfLines={1}>
                    Add people, change roles, reset passwords
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        <ThemedText style={styles.sectionLabel}>PRINTING</ThemedText>
        <Card style={styles.listCard}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/settings/printer")}
            accessibilityRole="button"
          >
            <Ionicons name="print-outline" size={24} color={theme.tint} />
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle}>Printer & receipt</ThemedText>
              <ThemedText style={styles.muted} numberOfLines={1}>
                {printerSummary}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
          </TouchableOpacity>
        </Card>
        <ThemedText style={styles.footnote}>
          Printer settings are saved on this phone only.
        </ThemedText>

        <ThemedText style={styles.sectionLabel}>APP</ThemedText>
        <Card style={styles.listCard}>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={24} color={theme.tint} />
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle}>Version</ThemedText>
            </View>
            <ThemedText style={styles.muted}>{Constants.expoConfig?.version ?? "-"}</ThemedText>
          </View>
          <View style={styles.row}>
            <Ionicons name="cloud-outline" size={24} color={theme.tint} />
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle}>Server</ThemedText>
            </View>
            <ThemedText style={[styles.muted, styles.serverValue]} numberOfLines={1}>
              {supabaseHost}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/connection-check")}
            accessibilityRole="button"
          >
            <Ionicons name="pulse-outline" size={24} color={theme.tint} />
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle}>Check connection</ThemedText>
              <ThemedText style={styles.muted} numberOfLines={1}>
                Test which servers this network can reach
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 2,
    marginLeft: 4,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: "600",
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 13,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 16,
  },
  listCard: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  muted: {
    fontSize: 14,
    opacity: 0.7,
  },
  serverValue: {
    flexShrink: 1,
    fontSize: 13,
  },
  footnote: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 4,
    marginLeft: 4,
  },
});
