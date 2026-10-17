import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ErrorBanner } from "@/components/common/ErrorBanner";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ListRow, ListSeparator } from "@/components/ui/ListRow";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getErrorMessage } from "@/services/api";
import { listStaffUsers, StaffUser } from "@/services/users";
import { useAppStore } from "@/store";

// Settings > Staff accounts (admin only): same list style as Products/Customers
export default function StaffAccountsScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const myId = useAppStore((state) => state.session?.user.id);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await listStaffUsers());
      setError(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load accounts"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on open and after coming back from Add / Edit
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderUser = ({ item }: { item: StaffUser }) => {
    const name = item.fullName || item.email;
    return (
      <ListRow
        title={item.id === myId ? `${name} (you)` : name}
        subtitle={item.email}
        onPress={() => router.push(`/settings/users/${item.id}`)}
        leading={
          <View style={[styles.avatar, { backgroundColor: theme.secondarySurface }, item.disabled && styles.faded]}>
            <ThemedText style={[styles.avatarText, { color: theme.secondary }]}>
              {name.trim().charAt(0).toUpperCase() || "?"}
            </ThemedText>
          </View>
        }
        trailing={
          <View style={styles.badges}>
            {item.disabled ? (
              <View style={[styles.badge, { borderColor: theme.danger }]}>
                <Text style={[styles.badgeText, { color: theme.danger }]}>Disabled</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  { borderColor: theme.border },
                  item.role === "admin" && { backgroundColor: theme.tint, borderColor: theme.tint },
                ]}
              >
                <Text style={[styles.badgeText, { color: item.role === "admin" ? theme.onTint : theme.text }]}>
                  {item.role === "admin" ? "Admin" : "Staff"}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
          </View>
        }
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ErrorBanner message={error} onRetry={load} />

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(user) => user.id}
          ItemSeparatorComponent={ListSeparator}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            users.length ? (
              <ThemedText style={[styles.count, { color: theme.muted }]}>
                {users.length} {users.length === 1 ? "account" : "accounts"}
              </ThemedText>
            ) : null
          }
          ListEmptyComponent={
            !error ? <ThemedText style={styles.empty}>No accounts yet.</ThemedText> : null
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint }]}
        onPress={() => router.push("/settings/users/new")}
        accessibilityLabel="Add account"
      >
        <Ionicons name="add" size={24} color={theme.onTint} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loading: {
    marginTop: 40,
  },
  list: {
    paddingBottom: 100,
  },
  count: {
    fontSize: 13,
    marginBottom: 4,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  faded: {
    opacity: 0.4,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
