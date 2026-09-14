import { Sale } from "@/types";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card } from "../ui/Card";

interface SaleCardProps {
  sale: Sale & { id: number };
  onPress: (saleId: number) => void;
  selected: boolean;
  onToggle: (saleId: number) => void;
}

export const SaleCard: React.FC<SaleCardProps> = ({ sale, onPress, selected, onToggle }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${day}${month},${year} ${time}`;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.leftContent} onPress={() => onPress(sale.id)}>
          <ThemedText style={styles.invoiceNumber}>
            Invoice #{sale.invoiceNumber}
          </ThemedText>
          <ThemedText style={styles.customerName}>
            {sale.customer.name}/ {sale.customer.contact}/{" "}
            {formatDate(sale.orderDate)}
          </ThemedText>
        </TouchableOpacity>
        <View style={styles.rightContent}>
          <ThemedText style={styles.total}>{sale.total.toFixed(2)}</ThemedText>
          <TouchableOpacity
            onPress={() => onToggle(sale.id)}
            style={[styles.selectButton, selected && styles.selectButtonActive]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`Select invoice ${sale.invoiceNumber ?? sale.id}`}
          >
            <ThemedText style={[styles.selectButtonText, selected && styles.selectButtonTextActive]}>
              {selected ? "Selected" : "Select"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
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
  rightContent: {
    alignItems: "flex-end",
    gap: 8,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectButtonActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  selectButtonText: {
    fontSize: 12,
  },
  selectButtonTextActive: {
    color: "#fff",
  },
});
