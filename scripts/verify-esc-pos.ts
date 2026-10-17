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

  // 80 mm paper: 48-character rows and 576-dot (72-byte) pictures
  const preview80 = getReceiptPreviewText(sale, 80);
  if (!preview80.includes("-".repeat(48)) || preview80.includes("-".repeat(49))) {
    throw new Error("80 mm preview should use 48-character dividers");
  }
  const totalRow = preview80.split("\n").find((row) => row.startsWith("TOTAL"));
  if (totalRow?.length !== 48) {
    throw new Error("80 mm TOTAL row should fill 48 characters");
  }
  const wideRasterizer: LineRasterizer = async (_text, options) => {
    if (options.width !== 576) throw new Error("80 mm pictures should be 576 dots wide");
    return { width: 576, height: 2, data: new Uint8Array(72 * 2).fill(0xff) };
  };
  const receipt80 = await buildSaleReceipt(myanmarSale, wideRasterizer, 80);
  if (!includesSequence(receipt80, [0x1d, 0x76, 0x30, 0, 72, 0, 2, 0])) {
    throw new Error("80 mm receipt is missing a 72-byte-wide picture");
  }

  // Standard (58 mm) layout: every text row is exactly 32 characters and the
  // printer centres it, so it lines up on any paper width
  const asciiRows = (bytes: Uint8Array) =>
    String.fromCharCode(...bytes)
      .split("\n")
      .map((row) => row.replace(/^.*[\x00-\x1f]/, ""))
      .filter((row) => row.length > 0);
  const standardRows = asciiRows(await buildSaleReceipt(sale, fakeRasterizer, 58));
  const rowsOtherThanShopName = standardRows.filter((row) => row !== "KHA");
  if (rowsOtherThanShopName.some((row) => row.length !== 32)) {
    throw new Error("Standard rows should all be 32 characters wide");
  }
  if (!standardRows.includes(`${" ".repeat(11)}Thank you!${" ".repeat(11)}`)) {
    throw new Error("Centred rows should be padded on both sides");
  }
  if (!String.fromCharCode(...(await buildSaleReceipt(sale, fakeRasterizer))).includes("\x1ba\x01")) {
    throw new Error("Receipt should use centre alignment");
  }

  // Long English names wrap into full-width rows instead of overflowing
  const longName = "Ma Khin Hnin Aung from Mandalay Road Shop";
  const longRows = asciiRows(
    await buildSaleReceipt({ ...sale, customer: { ...sale.customer, name: longName } }, fakeRasterizer),
  );
  if (longRows.some((row) => row.length !== 32 && row !== "KHA")) {
    throw new Error("Wrapped rows should also be 32 characters wide");
  }

  console.log("ESC/POS receipt check passed");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
