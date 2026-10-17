import React, { Ref } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Sale } from "@/types";
import { receiptLines } from "@/utils/escPos";

interface ReceiptViewProps {
  sale: Sale;
  // Set to capture the receipt as an image (react-native-view-shot)
  ref?: Ref<View>;
}

// The sale as a paper receipt, with the same rows the printer prints.
// Always black on white (also in dark mode) so a shared image looks like paper.
export function ReceiptView({ sale, ref }: ReceiptViewProps) {
  return (
    <View ref={ref} collapsable={false} style={styles.paper}>
      {receiptLines(sale).map((line, index) => {
        if (line.type === "divider") {
          // One line of dashes; extra dashes wrap and are cut off by the box
          return (
            <View key={index} style={styles.divider}>
              <Text style={styles.text}>{"-".repeat(120)}</Text>
            </View>
          );
        }

        if (line.type === "pair") {
          return (
            <View key={index} style={styles.pair}>
              {/* Invisible spacer as wide as the item number, so prices line up under names */}
              {!!line.indent && (
                <Text style={[styles.text, styles.spacer]}>{"0".repeat(line.indent)}</Text>
              )}
              <Text style={[styles.text, styles.pairLeft, line.bold && styles.bold]}>
                {line.left}
              </Text>
              <Text style={[styles.text, line.bold && styles.bold]}>{line.right}</Text>
            </View>
          );
        }

        if (line.prefix) {
          return (
            <View key={index} style={styles.numbered}>
              <Text style={styles.text}>{line.prefix}</Text>
              <Text style={[styles.text, styles.numberedText, line.bold && styles.bold]}>
                {line.text}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={index}
            style={[
              styles.text,
              line.bold && styles.bold,
              line.center && styles.center,
              line.large && styles.large,
            ]}
          >
            {line.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  text: {
    color: "#111111",
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 24,
  },
  bold: {
    fontWeight: "700",
  },
  center: {
    textAlign: "center",
  },
  large: {
    fontSize: 26,
    lineHeight: 36,
    letterSpacing: 4,
  },
  divider: {
    height: 24,
    overflow: "hidden",
  },
  pair: {
    flexDirection: "row",
    gap: 12,
  },
  pairLeft: {
    flex: 1,
  },
  spacer: {
    color: "transparent",
    marginRight: -12, // cancel the row gap so the indent is exactly the number width
  },
  numbered: {
    flexDirection: "row",
  },
  numberedText: {
    flex: 1,
  },
});
