import React, { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ListRowProps {
  title: string;
  // One line under the title (string, or styled text)
  subtitle?: ReactNode;
  // Left: avatar, checkbox...  Right: amount, icon buttons, chevron...
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}

// Compact list row used by the Products, Customers and Sales history lists:
// fills the width, no card, thin divider between rows (see ListSeparator).
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  onLongPress,
  selected,
  accessibilityLabel,
}: ListRowProps) {
  const theme = Colors[useColorScheme() ?? "light"];

  const content = (
    <View style={[styles.row, selected && { backgroundColor: theme.surface }]}>
      {leading}
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle !== undefined && subtitle !== null && subtitle !== "" ? (
          typeof subtitle === "string" ? (
            <Text style={[styles.subtitle, { color: theme.muted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            subtitle
          )
        ) : null}
      </View>
      {trailing}
    </View>
  );

  if (!onPress && !onLongPress) return content;
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {content}
    </TouchableOpacity>
  );
}

// Thin line between rows, starting after the row padding
export function ListSeparator() {
  const theme = Colors[useColorScheme() ?? "light"];
  return <View style={[styles.separator, { backgroundColor: theme.border }]} />;
}

// Small round icon button for row actions (edit, delete...)
export function RowIconButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.iconButton}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </TouchableOpacity>
  );
}

export const listRowStyles = StyleSheet.create({
  // Right-aligned amount (price, total)
  amount: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 4,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
