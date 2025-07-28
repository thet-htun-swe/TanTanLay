import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface CustomerFormProps {
  name: string;
  contact: string;
  address: string;
  onNameChange: (text: string) => void;
  onContactChange: (text: string) => void;
  onAddressChange: (text: string) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  name,
  contact,
  address,
  onNameChange,
  onContactChange,
  onAddressChange,
}) => {
  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Customer Information</ThemedText>
      
      <Input
        label="Customer Name"
        value={name}
        onChangeText={onNameChange}
        placeholder="Enter customer name"
        containerStyle={styles.input}
      />
      
      <Input
        label="Contact (Phone)"
        value={contact}
        onChangeText={(text) => {
          // Only allow numeric input
          const numericValue = text.replace(/[^0-9]/g, "");
          onContactChange(numericValue);
        }}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        containerStyle={styles.input}
      />
      
      <Input
        label="Address"
        value={address}
        onChangeText={onAddressChange}
        placeholder="Enter customer address"
        multiline={true}
        numberOfLines={3}
        containerStyle={styles.input}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
});