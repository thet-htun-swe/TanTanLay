import { StyleSheet } from "react-native";

import { Input } from "@/components/ui/Input";
import { Customer } from "@/types";

interface CustomerFieldsProps {
  value: Customer;
  onChange: (value: Customer) => void;
}

// Name / phone / address inputs, shared by Create and Edit Customer
// (same look as the product forms)
export function CustomerFields({ value, onChange }: CustomerFieldsProps) {
  return (
    <>
      <Input
        label="Customer Name *"
        value={value.name}
        onChangeText={(name) => onChange({ ...value, name })}
        placeholder="Enter customer name"
        autoCapitalize="words"
        containerStyle={styles.field}
      />
      <Input
        label="Phone Number"
        value={value.contact}
        // Numbers only
        onChangeText={(text) => onChange({ ...value, contact: text.replace(/[^0-9]/g, "") })}
        placeholder="09xxxxxxxxx"
        keyboardType="phone-pad"
        containerStyle={styles.field}
      />
      <Input
        label="Address"
        value={value.address}
        onChangeText={(address) => onChange({ ...value, address })}
        placeholder="Enter customer address"
        multiline
        numberOfLines={3}
        containerStyle={styles.field}
      />
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
});
