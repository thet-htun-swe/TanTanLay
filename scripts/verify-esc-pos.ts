import { buildSaleReceipt, getReceiptPreviewText } from "../utils/escPos";

const receipt = buildSaleReceipt({
  id: 1,
  invoiceNumber: "260914001",
  date: "2026-09-14T10:00:00.000Z",
  orderDate: "2026-09-14T10:00:00.000Z",
  customer: { name: "Test customer", contact: "", address: "" },
  items: [{ productId: 1, productName: "T-shirt", quantity: 2, unitPrice: 12.5, lineTotal: 25 }],
  subtotal: 25,
  total: 25,
});

if (receipt[0] !== 0x1b || receipt[1] !== 0x40 || !receipt.includes(0x1d)) {
  throw new Error("Receipt is missing ESC/POS initialization or cut commands");
}

if (!getReceiptPreviewText({
  id: 1,
  invoiceNumber: "260914001",
  date: "2026-09-14T10:00:00.000Z",
  orderDate: "2026-09-14T10:00:00.000Z",
  customer: { name: "Test customer", contact: "", address: "" },
  items: [],
  subtotal: 25,
  total: 25,
}).includes("TOTAL")) {
  throw new Error("Receipt preview is missing the total");
}

console.log("ESC/POS receipt check passed");
