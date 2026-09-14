import { Sale } from "@/types";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const RECEIPT_WIDTH = 32;

const ascii = (value: string) =>
  Array.from(value).map((character) =>
    character.charCodeAt(0) <= 0x7f ? character.charCodeAt(0) : 0x3f,
  );

const printerText = (value: string) =>
  Array.from(value).map((character) =>
    character.charCodeAt(0) <= 0x7f ? character : "?",
  ).join("");

const line = (value = "") => [...ascii(value), LF];
const divider = () => line("-".repeat(RECEIPT_WIDTH));
const money = (value: number) => value.toFixed(2);

const pairText = (left: string, right: string) => {
  const space = RECEIPT_WIDTH - left.length - right.length;
  return space > 0 ? `${left}${" ".repeat(space)}${right}` : `${left} ${right}`;
};

const pair = (left: string, right: string) => line(pairText(left, right));

export const getReceiptPreviewText = (sale: Sale) => {
  const lines = [
    "CLOTHING SALES",
    `Invoice #${sale.invoiceNumber ?? sale.id ?? ""}`,
    "-".repeat(RECEIPT_WIDTH),
    `Customer: ${sale.customer.name}`,
    `Date: ${new Date(sale.orderDate).toLocaleString()}`,
    "-".repeat(RECEIPT_WIDTH),
  ];

  for (const item of sale.items) {
    lines.push(item.productName, pairText(`${item.quantity} x ${money(item.unitPrice)}`, money(item.lineTotal)));
  }

  lines.push("-".repeat(RECEIPT_WIDTH), pairText("TOTAL", money(sale.total)), "Thank you!");
  return lines.map(printerText).join("\n");
};

export const buildSaleReceipt = (sale: Sale) => {
  const receipt = [
    ESC, 0x40,
    ESC, 0x61, 1,
    ESC, 0x45, 1,
    ...line("CLOTHING SALES"),
    ESC, 0x45, 0,
    ...line(`Invoice #${sale.invoiceNumber ?? sale.id ?? ""}`),
    ESC, 0x61, 0,
    ...divider(),
    ...line(`Customer: ${sale.customer.name}`),
    ...line(`Date: ${new Date(sale.orderDate).toLocaleString()}`),
    ...divider(),
  ];

  for (const item of sale.items) {
    receipt.push(...line(item.productName));
    receipt.push(...pair(`${item.quantity} x ${money(item.unitPrice)}`, money(item.lineTotal)));
  }

  receipt.push(
    ...divider(),
    ESC, 0x45, 1,
    ...pair("TOTAL", money(sale.total)),
    ESC, 0x45, 0,
    ESC, 0x61, 1,
    ...line("Thank you!"),
    ...line(),
    ...line(),
    GS, 0x56, 0,
  );

  return new Uint8Array(receipt);
};

export const buildTestReceipt = () =>
  new Uint8Array([
    ESC, 0x40,
    ESC, 0x61, 1,
    ESC, 0x45, 1,
    ...line("CLOTHING SALES"),
    ESC, 0x45, 0,
    ...line("Printer test successful"),
    ...line(),
    ...line(),
    GS, 0x56, 0,
  ]);
