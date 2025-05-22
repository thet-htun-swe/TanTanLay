import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? theme.tintOpacity : theme.tint,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.tint,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#ff6b6b80' : '#ff6b6b',
        };
      default:
        return {
          backgroundColor: theme.tint,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          color: theme.tint,
        };
      default:
        return {
          color: '#fff',
        };
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
