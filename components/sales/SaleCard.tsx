import { Sale } from "@/types";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";

interface SaleCardProps {
  sale: Sale & { id: number };
  onPress: (saleId: number) => void;
}

export const SaleCard: React.FC<SaleCardProps> = ({ sale, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <TouchableOpacity onPress={() => onPress(sale.id)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.leftContent}>
            <ThemedText style={styles.invoiceNumber}>
              Invoice #{sale.invoiceNumber}
            </ThemedText>
            <ThemedText style={styles.customerName}>
              {sale.customer.name}
            </ThemedText>
          </View>
          <ThemedText style={styles.total}>{sale.total.toFixed(2)}</ThemedText>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContent: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "normal",
  },
  total: {
    fontSize: 18,
    fontWeight: "600",
  },
});
