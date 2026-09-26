import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          props.multiline && styles.multilineInput,
          {
            color: theme.text,
            borderColor: error ? theme.danger : theme.border,
            backgroundColor: theme.cardBackground,
          },
        ]}
        placeholderTextColor={theme.tabIconDefault}
        {...props}
      />
      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  multilineInput: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
});
