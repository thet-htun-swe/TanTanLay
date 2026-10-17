import { Sale } from "@/types";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const RECEIPT_WIDTH = 32;

export const SHOP_NAME = "KHA";

// A picture of one text line: 1 bit per dot, rows of width/8 bytes, 1 = black
export interface RasterImage {
  width: number;
  height: number;
  data: Uint8Array;
}

// Draws text the printer font cannot show (e.g. Myanmar) as a picture
export type LineRasterizer = (
  text: string,
  options: { bold?: boolean; center?: boolean },
) => Promise<RasterImage>;

// One receipt row. Used by the printer, the text preview and the on-screen
// receipt (components/sales/ReceiptView.tsx), so all three always match.
export type ReceiptLine =
  | { type: "text"; text: string; bold?: boolean; center?: boolean; large?: boolean }
  | { type: "pair"; left: string; right: string; bold?: boolean }
  | { type: "divider" };

// toLocaleString() puts special spaces in dates (e.g. before "PM")
const normalizeSpaces = (value: string) =>
  value.replace(/[   ]/g, " ");

// The printer's built-in font only has plain English letters, digits and signs
const isPrinterText = (value: string) => /^[\x20-\x7e]*$/.test(value);

const ascii = (value: string) =>
  Array.from(value).map((character) =>
    character.charCodeAt(0) <= 0x7f ? character.charCodeAt(0) : 0x3f,
  );

const line = (value = "") => [...ascii(value), LF];
const money = (value: number) => value.toFixed(2);

const pairText = (left: string, right: string) => {
  const space = RECEIPT_WIDTH - left.length - right.length;
  return space > 0 ? `${left}${" ".repeat(space)}${right}` : `${left} ${right}`;
};

export const receiptLines = (sale: Sale): ReceiptLine[] => {
  const divider: ReceiptLine = { type: "divider" };
  const lines: ReceiptLine[] = [
    { type: "text", text: SHOP_NAME, bold: true, center: true, large: true },
    { type: "text", text: `Invoice #${sale.invoiceNumber ?? sale.id ?? ""}`, center: true },
    divider,
    { type: "text", text: `Customer: ${sale.customer.name}` },
    { type: "text", text: `Date: ${normalizeSpaces(new Date(sale.orderDate).toLocaleString())}` },
    divider,
  ];

  for (const item of sale.items) {
    lines.push(
      { type: "text", text: item.productName },
      {
        type: "pair",
        left: `${item.quantity} x ${money(item.unitPrice)}`,
        right: money(item.lineTotal),
      },
    );
  }

  lines.push(
    divider,
    { type: "pair", left: "TOTAL", right: money(sale.total), bold: true },
    { type: "text", text: "Thank you!", center: true },
  );
  return lines;
};

// A row as plain text on the 32-character paper (printer and text preview)
const lineText = (receiptLine: ReceiptLine) => {
  if (receiptLine.type === "divider") return "-".repeat(RECEIPT_WIDTH);
  if (receiptLine.type === "pair") return pairText(receiptLine.left, receiptLine.right);
  return receiptLine.text;
};

// ESC/POS "print raster image" (GS v 0), sent in strips printers can buffer
const rasterImageBytes = (image: RasterImage) => {
  const bytesPerRow = image.width / 8;
  const bytes: number[] = [];
  const stripRows = 128;

  for (let top = 0; top < image.height; top += stripRows) {
    const rows = Math.min(stripRows, image.height - top);
    bytes.push(
      GS, 0x76, 0x30, 0,
      bytesPerRow & 0xff, bytesPerRow >> 8,
      rows & 0xff, rows >> 8,
    );
    const strip = image.data.subarray(top * bytesPerRow, (top + rows) * bytesPerRow);
    for (const byte of strip) bytes.push(byte);
  }
  return bytes;
};

export const getReceiptPreviewText = (sale: Sale) =>
  receiptLines(sale).map(lineText).join("\n");

// Lines the printer font can show are sent as text; others (e.g. Myanmar
// names) are drawn as pictures with `rasterize`.
export const buildSaleReceipt = async (sale: Sale, rasterize: LineRasterizer) => {
  const receipt: number[] = [ESC, 0x40];

  for (const receiptLine of receiptLines(sale)) {
    const text = lineText(receiptLine);
    const bold = receiptLine.type !== "divider" && !!receiptLine.bold;
    const center = receiptLine.type === "text" && !!receiptLine.center;
    const large = receiptLine.type === "text" && !!receiptLine.large;

    if (isPrinterText(text)) {
      receipt.push(
        ESC, 0x61, center ? 1 : 0,
        ESC, 0x45, bold ? 1 : 0,
        // Double width + height for the shop name
        GS, 0x21, large ? 0x11 : 0x00,
        ...line(text),
      );
    } else {
      const image = await rasterize(text, { bold, center });
      // The picture is already full width (centering is drawn into it)
      receipt.push(ESC, 0x61, 0, ...rasterImageBytes(image));
    }
  }

  receipt.push(
    ESC, 0x45, 0,
    GS, 0x21, 0x00,
    ESC, 0x61, 1,
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
    GS, 0x21, 0x11,
    ...line(SHOP_NAME),
    GS, 0x21, 0x00,
    ESC, 0x45, 0,
    ...line("Printer test successful"),
    ...line(),
    ...line(),
    GS, 0x56, 0,
  ]);
