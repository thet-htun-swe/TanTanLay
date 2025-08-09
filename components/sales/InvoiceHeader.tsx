import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface InvoiceHeaderProps {
  invoiceId: string;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ invoiceId }) => {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Invoice #{invoiceId}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
