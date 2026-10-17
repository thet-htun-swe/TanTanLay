import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DiscountType, SaleItem } from "@/types";
import { discountAmount, lineGross } from "@/utils/saleMath";
import { ThemedText } from "../ThemedText";
import { Button } from "../ui/Button";

interface DiscountModalProps {
  item: SaleItem | null; // null = closed
  onClose: () => void;
  // type null removes the discount
  onApply: (type: DiscountType | null, value: number) => void;
}

const money = (value: number) => value.toFixed(2);

// Discount for one sale item (whole line), as an amount or a percentage
export function DiscountModal({ item, onClose, onApply }: DiscountModalProps) {
  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
      {/* Remount per item so the form starts from that item's discount */}
      {item && <DiscountForm key={String(item.productId)} item={item} onClose={onClose} onApply={onApply} />}
    </Modal>
  );
}

function DiscountForm({ item, onClose, onApply }: DiscountModalProps & { item: SaleItem }) {
  const theme = Colors[useColorScheme() ?? "light"];
  const [type, setType] = useState<DiscountType>(item.discountType ?? "amount");
  const [text, setText] = useState(item.discountValue ? String(item.discountValue) : "");

  const gross = lineGross(item);
  const value = parseFloat(text) || 0;
  const error =
    value < 0
      ? "Enter a positive number"
      : type === "percent" && value > 100
        ? "Percentage cannot be more than 100"
        : type === "amount" && value > gross
          ? `Discount cannot be more than ${money(gross)}`
          : null;
  const discount = error ? 0 : discountAmount(gross, type, value);
  const hasDiscount = !!item.discount && item.discount > 0;

  const apply = () => {
    if (error) return;
    onApply(value > 0 ? type : null, value);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={styles.backdrop}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <ThemedText style={styles.title}>Discount</ThemedText>
        <ThemedText style={[styles.itemName, { color: theme.muted }]} numberOfLines={2}>
          {item.productName} · {item.quantity} × {money(item.unitPrice)}
        </ThemedText>

        {/* Amount | % */}
        <View style={[styles.segment, { borderColor: theme.tint }]}>
          {(["amount", "percent"] as const).map((option) => {
            const active = type === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.segmentButton, active && { backgroundColor: theme.tint }]}
                onPress={() => setType(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.segmentText, { color: active ? theme.onTint : theme.tint }]}>
                  {option === "amount" ? "Amount" : "Percent %"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.inputRow, { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.surface }]}>
          <TextInput
            value={text}
            onChangeText={(next) => setText(next.replace(/[^0-9.]/g, ""))}
            placeholder={type === "percent" ? "e.g. 10" : "e.g. 2000"}
            placeholderTextColor={theme.tabIconDefault}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            onSubmitEditing={apply}
            style={[styles.input, { color: theme.text }]}
            accessibilityLabel="Discount"
          />
          {type === "percent" && <Text style={[styles.unit, { color: theme.muted }]}>%</Text>}
        </View>
        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

        <View style={styles.preview}>
          <View style={styles.previewRow}>
            <ThemedText style={{ color: theme.muted }}>Price</ThemedText>
            <ThemedText>{money(gross)}</ThemedText>
          </View>
          <View style={styles.previewRow}>
            <ThemedText style={{ color: theme.muted }}>Discount</ThemedText>
            <ThemedText style={{ color: theme.success }}>-{money(discount)}</ThemedText>
          </View>
          <View style={styles.previewRow}>
            <ThemedText style={styles.newTotal}>New total</ThemedText>
            <ThemedText style={[styles.newTotal, { color: theme.tint }]}>{money(gross - discount)}</ThemedText>
          </View>
        </View>

        <View style={styles.buttons}>
          {hasDiscount ? (
            <Button
              title="Remove"
              variant="secondary"
              onPress={() => {
                onApply(null, 0);
                onClose();
              }}
              style={styles.button}
            />
          ) : (
            <Button title="Cancel" variant="secondary" onPress={onClose} style={styles.button} />
          )}
          <Button title="Apply" onPress={apply} disabled={!!error} style={styles.button} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  itemName: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 16,
  },
  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    paddingVertical: 0,
  },
  unit: {
    fontSize: 15,
    marginLeft: 8,
  },
  error: {
    fontSize: 13,
    marginTop: 6,
  },
  preview: {
    marginTop: 16,
    gap: 4,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  newTotal: {
    fontSize: 17,
    fontWeight: "700",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
  },
});
