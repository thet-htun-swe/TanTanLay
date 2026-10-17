import { Ionicons } from "@expo/vector-icons";
import React, { ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ChipProps {
  label: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  disabled?: boolean;
  // Filled with the tint colour (main action)
  primary?: boolean;
}

// Small rounded button for toolbars (takes much less room than Button)
export function Chip({ label, icon, onPress, disabled, primary }: ChipProps) {
  const theme = Colors[useColorScheme() ?? "light"];
  const color = primary ? theme.onTint : theme.tint;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        { borderColor: theme.tint },
        primary && { backgroundColor: theme.tint },
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon && <Ionicons name={icon} size={16} color={color} />}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 34,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.45,
  },
});
