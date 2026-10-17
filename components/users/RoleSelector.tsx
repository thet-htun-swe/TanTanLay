import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Role } from "@/types";
import { ThemedText } from "../ThemedText";

const OPTIONS: { role: Role; title: string; hint: string }[] = [
  { role: "staff", title: "Staff", hint: "Sales, customers, printing" },
  { role: "admin", title: "Admin", hint: "Everything, incl. products and accounts" },
];

interface RoleSelectorProps {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}

// Staff / Admin choice with a short note on what each can do
export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  const theme = Colors[useColorScheme() ?? "light"];
  const selected = OPTIONS.find((option) => option.role === value);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Role</ThemedText>
      <View style={[styles.segment, { borderColor: theme.tint }, disabled && styles.disabled]}>
        {OPTIONS.map((option) => {
          const active = option.role === value;
          return (
            <TouchableOpacity
              key={option.role}
              style={[styles.button, active && { backgroundColor: theme.tint }]}
              onPress={() => onChange(option.role)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
            >
              <Text style={[styles.buttonText, { color: active ? theme.onTint : theme.tint }]}>
                {option.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selected && (
        <ThemedText style={[styles.hint, { color: theme.muted }]}>{selected.hint}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    marginTop: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});
