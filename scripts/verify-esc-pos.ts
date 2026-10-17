import { buildSaleReceipt, getReceiptPreviewText, LineRasterizer } from "../utils/escPos";

const sale = {
  id: 1,
  invoiceNumber: "260914001",
  date: "2026-09-14T10:00:00.000Z",
  orderDate: "2026-09-14T10:00:00.000Z",
  customer: { name: "Test customer", contact: "", address: "" },
  items: [{ productId: 1, productName: "T-shirt", quantity: 2, unitPrice: 12.5, lineTotal: 25 }],
  subtotal: 25,
  total: 25,
};

// Stand-in for the WebView renderer: a 384-dot wide, 2-row black picture
const rasterizedLines: string[] = [];
const fakeRasterizer: LineRasterizer = async (text) => {
  rasterizedLines.push(text);
  return { width: 384, height: 2, data: new Uint8Array(48 * 2).fill(0xff) };
};

const includesSequence = (bytes: Uint8Array, sequence: number[]) =>
  bytes.some((_, start) => sequence.every((value, i) => bytes[start + i] === value));

const main = async () => {
  const receipt = await buildSaleReceipt(sale, fakeRasterizer);
  if (receipt[0] !== 0x1b || receipt[1] !== 0x40 || !receipt.includes(0x1d)) {
    throw new Error("Receipt is missing ESC/POS initialization or cut commands");
  }
  if (rasterizedLines.length) {
    throw new Error("English-only receipt should not use pictures");
  }

  if (!getReceiptPreviewText({ ...sale, items: [] }).includes("TOTAL")) {
    throw new Error("Receipt preview is missing the total");
  }

  // Myanmar names: shown in the preview, printed as pictures (GS v 0), never "?"
  const myanmarSale = {
    ...sale,
    customer: { ...sale.customer, name: "မောင်မောင်" },
    items: [{ ...sale.items[0], productName: "အင်္ကျီ" }],
  };
  const preview = getReceiptPreviewText(myanmarSale);
  if (!preview.includes("မောင်မောင်") || !preview.includes("အင်္ကျီ") || preview.includes("?")) {
    throw new Error("Receipt preview should show Myanmar text as typed");
  }

  const myanmarReceipt = await buildSaleReceipt(myanmarSale, fakeRasterizer);
  if (rasterizedLines.length !== 2 || !rasterizedLines[0].includes("မောင်မောင်")) {
    throw new Error("Myanmar lines should be drawn as pictures");
  }
  if (!includesSequence(myanmarReceipt, [0x1d, 0x76, 0x30, 0, 48, 0, 2, 0])) {
    throw new Error("Receipt is missing the GS v 0 picture command");
  }
  if (myanmarReceipt.includes(0x3f)) {
    throw new Error("Receipt still contains '?' characters");
  }

  console.log("ESC/POS receipt check passed");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
