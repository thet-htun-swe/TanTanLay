import React from 'react';
import { StyleSheet, TextInput, View, Text, TextInputProps, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { 
            color: theme.text,
            borderColor: error ? '#ff6b6b' : theme.border,
            backgroundColor: theme.background
          },
        ]}
        placeholderTextColor={theme.tabIconDefault}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 4,
  },
});
