import { Product, SaleItem } from "@/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ProductSelectorModal } from "./ProductSelectorModal";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface SaleItemsListProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: number | string, quantity: number) => void;
  onRemoveItem: (productId: number | string) => void;
  onAddProduct: (item: SaleItem) => void;
  products: (Product & { id: number })[];
}

const MAX_QUANTITY = 9999;
const money = (value: number) => value.toFixed(2);

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
}

// [ − ] [ qty ] [ + ]  The number can also be typed for large counts.
// − stops at 1 so a product is never removed by accident (use the bin).
const QuantityStepper = ({ quantity, onChange }: QuantityStepperProps) => {
  const theme = Colors[useColorScheme() ?? "light"];
  // Text while typing; null shows the saved quantity
  const [draft, setDraft] = useState<string | null>(null);

  const commitDraft = () => {
    if (draft === null) return;
    const typed = parseInt(draft, 10);
    if (Number.isFinite(typed) && typed > 0) {
      onChange(Math.min(typed, MAX_QUANTITY));
    }
    setDraft(null);
  };

  const step = (change: number) => {
    const next = quantity + change;
    if (next >= 1 && next <= MAX_QUANTITY) onChange(next);
  };

  const canDecrease = quantity > 1;

  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        onPress={() => step(-1)}
        disabled={!canDecrease}
        style={[
          styles.stepButton,
          { borderColor: theme.tint, opacity: canDecrease ? 1 : 0.35 },
        ]}
        hitSlop={4}
        accessibilityLabel="Decrease quantity"
      >
        <MaterialCommunityIcons name="minus" size={20} color={theme.tint} />
      </TouchableOpacity>

      <TextInput
        value={draft ?? String(quantity)}
        onFocus={() => setDraft(String(quantity))}
        onChangeText={(text) => setDraft(text.replace(/[^0-9]/g, ""))}
        onEndEditing={commitDraft}
        onSubmitEditing={commitDraft}
        onBlur={commitDraft}
        keyboardType="number-pad"
        selectTextOnFocus
        maxLength={4}
        returnKeyType="done"
        style={[
          styles.quantityInput,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
        ]}
        accessibilityLabel="Quantity"
      />

      <TouchableOpacity
        onPress={() => step(1)}
        style={[styles.stepButton, { backgroundColor: theme.tint, borderColor: theme.tint }]}
        hitSlop={4}
        accessibilityLabel="Increase quantity"
      >
        <MaterialCommunityIcons name="plus" size={20} color={theme.onTint} />
      </TouchableOpacity>
    </View>
  );
};

export const SaleItemsList: React.FC<SaleItemsListProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onAddProduct,
  products,
}) => {
  const theme = Colors[useColorScheme() ?? "light"];
  const [isModalVisible, setIsModalVisible] = useState(false);
  const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>Sale Items</ThemedText>
          {items.length > 0 && (
            <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
              {items.length} {items.length === 1 ? "product" : "products"} · {totalPieces}{" "}
              {totalPieces === 1 ? "pc" : "pcs"}
            </ThemedText>
          )}
        </View>
        <Button
          title="+ Add product"
          onPress={() => setIsModalVisible(true)}
          variant="primary"
          style={styles.addButton}
        />
      </View>

      {items.length === 0 ? (
        <ThemedText style={[styles.empty, { color: theme.muted }]}>
          No products yet. Tap &quot;+ Add product&quot; to start.
        </ThemedText>
      ) : (
        items.map((item, index) => (
          <View
            key={item.productId?.toString() ?? `item-${item.productName}`}
            style={[
              styles.item,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
            ]}
          >
            <View style={styles.itemTop}>
              <ThemedText style={[styles.itemNumber, { color: theme.muted }]}>
                {index + 1}.
              </ThemedText>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName} numberOfLines={2}>
                  {item.productName}
                </ThemedText>
                <ThemedText style={[styles.unitPrice, { color: theme.muted }]}>
                  {money(item.unitPrice)} each
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => onRemoveItem(item.productId)}
                style={styles.removeButton}
                hitSlop={8}
                accessibilityLabel={`Remove ${item.productName}`}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.itemBottom}>
              <QuantityStepper
                quantity={item.quantity}
                onChange={(quantity) => onUpdateQuantity(item.productId, quantity)}
              />
              <ThemedText style={[styles.lineTotal, { color: theme.tint }]} numberOfLines={1}>
                {money(item.lineTotal)}
              </ThemedText>
            </View>
          </View>
        ))
      )}

      <ProductSelectorModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        products={products}
        onAddItem={onAddProduct}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  empty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  item: {
    paddingVertical: 12,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  itemNumber: {
    fontSize: 15,
    minWidth: 22,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  removeButton: {
    paddingLeft: 8,
  },
  itemBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 28, // line up under the name, past the item number
    gap: 8,
  },
  unitPrice: {
    fontSize: 13,
    marginTop: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    width: 52,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 0,
  },
  lineTotal: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "700",
  },
});
