import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../ui/Button';

interface ActionButton {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  direction?: 'row' | 'column';
  spacing?: number;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  buttons,
  direction = 'row',
  spacing = 8,
}) => {
  const containerStyle = [
    styles.container,
    {
      flexDirection: direction,
      gap: spacing,
    },
  ];

  const buttonStyle = direction === 'row' ? styles.rowButton : styles.columnButton;

  return (
    <View style={containerStyle}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          title={button.title}
          onPress={button.onPress}
          variant={button.variant || 'primary'}
          disabled={button.disabled}
          style={buttonStyle}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  rowButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  columnButton: {
    marginBottom: 8,
  },
});