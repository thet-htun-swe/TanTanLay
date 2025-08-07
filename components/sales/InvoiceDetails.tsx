import { Sale } from "@/types";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";

interface InvoiceDetailsProps {
  sale: Sale;
  formatDate: (dateString: string) => string;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  sale,
  formatDate,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <ThemedText style={styles.label}>Order Date:</ThemedText>
        <ThemedText>{formatDate(sale.orderDate)}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.label}>Created Date:</ThemedText>
        <ThemedText>{formatDate(sale.date)}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.label}>Customer:</ThemedText>
        <ThemedText>{sale.customer.name}</ThemedText>
      </View>
      {sale.customer.contact && (
        <View style={styles.row}>
          <ThemedText style={styles.label}>Contact:</ThemedText>
          <ThemedText>{sale.customer.contact}</ThemedText>
        </View>
      )}
      {sale.customer.address && (
        <View style={styles.row}>
          <ThemedText style={styles.label}>Address:</ThemedText>
          <ThemedText>{sale.customer.address}</ThemedText>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    width: 100,
  },
});
