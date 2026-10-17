import React, { ReactNode, Ref } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Sale } from "@/types";
import { ReceiptLine, receiptLines } from "@/utils/escPos";

interface ReceiptViewProps {
  sale: Sale;
  // Set to capture the receipt as an image (react-native-view-shot)
  ref?: Ref<View>;
}

type PairLine = Extract<ReceiptLine, { type: "pair" }>;

const PairRow = ({ line }: { line: PairLine }) => (
  <View style={styles.pair}>
    <Text style={[styles.text, styles.pairLeft, line.bold && styles.bold]}>{line.left}</Text>
    <Text style={[styles.text, line.bold && styles.bold]}>{line.right}</Text>
  </View>
);

// The sale as a paper receipt, with the same rows the printer prints.
// Always black on white (also in dark mode) so a shared image looks like paper.
export function ReceiptView({ sale, ref }: ReceiptViewProps) {
  const lines = receiptLines(sale);
  const rows: ReactNode[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (line.type === "divider") {
      // One line of dashes; extra dashes wrap and are cut off by the box
      rows.push(
        <View key={index} style={styles.divider}>
          <Text style={styles.text}>{"-".repeat(120)}</Text>
        </View>,
      );
    } else if (line.type === "pair") {
      rows.push(<PairRow key={index} line={line} />);
    } else if (line.prefix) {
      // Numbered item: the number in its own column, the name and its rows
      // (price, discount) stacked in a second column, so all start at the same place
      const itemRows: PairLine[] = [];
      for (let next = lines[index + 1]; next?.type === "pair" && next.indent; next = lines[index + 1]) {
        itemRows.push(next);
        index++;
      }
      rows.push(
        <View key={index} style={styles.item}>
          <Text style={styles.text}>{line.prefix}</Text>
          <View style={styles.itemBody}>
            <Text style={[styles.text, line.bold && styles.bold]}>{line.text}</Text>
            {itemRows.map((row, rowIndex) => (
              <PairRow key={rowIndex} line={row} />
            ))}
          </View>
        </View>,
      );
    } else {
      rows.push(
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
        </Text>,
      );
    }
  }

  return (
    <View ref={ref} collapsable={false} style={styles.paper}>
      {rows}
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
  item: {
    flexDirection: "row",
  },
  itemBody: {
    flex: 1,
  },
});
