import { Sale } from "@/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { ThemedText } from "../ThemedText";
import { ListRow, listRowStyles } from "../ui/ListRow";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface SaleCardProps {
  sale: Sale & { id: number };
  onPress: (saleId: number) => void;
  selected: boolean;
  onToggle: (saleId: number) => void;
}

// e.g. "17 Oct 26, 5:26 PM"
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear().toString().slice(-2);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day} ${month} ${year}, ${time}`;
};

// One sale in Sales history: tick circle (select for printing), customer,
// invoice number + date, total. Tap the row to open the receipt.
export const SaleCard: React.FC<SaleCardProps> = ({ sale, onPress, selected, onToggle }) => {
  const theme = Colors[useColorScheme() ?? "light"];

  return (
    <ListRow
      title={sale.customer.name || "Walk-in customer"}
      subtitle={`#${sale.invoiceNumber ?? sale.id} · ${formatDate(sale.orderDate)}`}
      onPress={() => onPress(sale.id)}
      onLongPress={() => onToggle(sale.id)}
      selected={selected}
      leading={
        <TouchableOpacity
          onPress={() => onToggle(sale.id)}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={`Select invoice ${sale.invoiceNumber ?? sale.id}`}
        >
          <MaterialCommunityIcons
            name={selected ? "check-circle" : "circle-outline"}
            size={24}
            color={selected ? theme.tint : theme.icon}
          />
        </TouchableOpacity>
      }
      trailing={<ThemedText style={listRowStyles.amount}>{sale.total.toFixed(2)}</ThemedText>}
    />
  );
};
