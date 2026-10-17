import { Sale } from "@/types";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const RECEIPT_WIDTH = 32;

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

interface ReceiptLine {
  text: string;
  bold?: boolean;
  center?: boolean;
}

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

// Same lines for the on-screen preview and the printer
const receiptLines = (sale: Sale): ReceiptLine[] => {
  const divider = { text: "-".repeat(RECEIPT_WIDTH) };
  const lines: ReceiptLine[] = [
    { text: "CLOTHING SALES", bold: true, center: true },
    { text: `Invoice #${sale.invoiceNumber ?? sale.id ?? ""}`, center: true },
    divider,
    { text: `Customer: ${sale.customer.name}` },
    { text: `Date: ${new Date(sale.orderDate).toLocaleString()}` },
    divider,
  ];

  for (const item of sale.items) {
    lines.push(
      { text: item.productName },
      { text: pairText(`${item.quantity} x ${money(item.unitPrice)}`, money(item.lineTotal)) },
    );
  }

  lines.push(
    divider,
    { text: pairText("TOTAL", money(sale.total)), bold: true },
    { text: "Thank you!", center: true },
  );
  return lines.map((receiptLine) => ({
    ...receiptLine,
    text: normalizeSpaces(receiptLine.text),
  }));
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
  receiptLines(sale)
    .map((receiptLine) => receiptLine.text)
    .join("\n");

// Lines the printer font can show are sent as text; others (e.g. Myanmar
// names) are drawn as pictures with `rasterize`.
export const buildSaleReceipt = async (sale: Sale, rasterize: LineRasterizer) => {
  const receipt: number[] = [ESC, 0x40];

  for (const receiptLine of receiptLines(sale)) {
    if (isPrinterText(receiptLine.text)) {
      receipt.push(
        ESC, 0x61, receiptLine.center ? 1 : 0,
        ESC, 0x45, receiptLine.bold ? 1 : 0,
        ...line(receiptLine.text),
      );
    } else {
      const image = await rasterize(receiptLine.text, {
        bold: receiptLine.bold,
        center: receiptLine.center,
      });
      // The picture is already full width (centering is drawn into it)
      receipt.push(ESC, 0x61, 0, ...rasterImageBytes(image));
    }
  }

  receipt.push(
    ESC, 0x45, 0,
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
    ...line("CLOTHING SALES"),
    ESC, 0x45, 0,
    ...line("Printer test successful"),
    ...line(),
    ...line(),
    GS, 0x56, 0,
  ]);
