import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ErrorBannerProps {
  message: string | null | undefined;
  onRetry?: () => void;
}

// Small notice for load errors such as "No internet connection"
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const theme = Colors[useColorScheme() ?? "light"];

  if (!message) return null;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: `${theme.danger}1A`, borderColor: theme.danger },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={20} color={theme.danger} />
      <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} hitSlop={8}>
          <Text style={[styles.retry, { color: theme.tint }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  retry: {
    fontSize: 14,
    fontWeight: "600",
  },
});
