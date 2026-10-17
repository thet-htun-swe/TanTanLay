import { Sale } from "@/types";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export const SHOP_NAME = "KHA";

// Paper sizes. Printer font A is 12 dots wide at 203 dpi:
// 58 mm paper prints 384 dots (32 characters), 80 mm prints 576 dots (48).
// The 58 mm layout is the default because it works on every printer: each row
// is exactly 32 characters and printed centred, so on 80 mm paper it becomes a
// neat column in the middle. 80 mm is an optional full-width layout.
export type PaperWidth = 58 | 80;
export const DEFAULT_PAPER_WIDTH: PaperWidth = 58;
const PAPER = {
  58: { characters: 32, dots: 384 },
  80: { characters: 48, dots: 576 },
} as const;

// A picture of one text line: 1 bit per dot, rows of width/8 bytes, 1 = black
export interface RasterImage {
  width: number;
  height: number;
  data: Uint8Array;
}

// Draws text the printer font cannot show (e.g. Myanmar) as a picture
export type LineRasterizer = (
  text: string,
  // prefix: item number drawn before the text; wrapped rows are indented by it
  options: { bold?: boolean; center?: boolean; width: number; prefix?: string },
) => Promise<RasterImage>;

// One receipt row. Used by the printer, the text preview and the on-screen
// receipt (components/sales/ReceiptView.tsx), so all three always match.
// `prefix` is the item number ("1. "); wrapped rows and the item's price row
// are indented by its length (`indent`) so names and prices line up.
export type ReceiptLine =
  | {
      type: "text";
      text: string;
      prefix?: string;
      bold?: boolean;
      center?: boolean;
      large?: boolean;
    }
  | { type: "pair"; left: string; right: string; indent?: number; bold?: boolean }
  | { type: "divider" };

// toLocaleString() puts special spaces in dates (e.g. before "PM"):
// no-break space, figure space, narrow no-break space
const SPECIAL_SPACES = new RegExp(`[${String.fromCharCode(0xa0, 0x2007, 0x202f)}]`, "g");
const normalizeSpaces = (value: string) => value.replace(SPECIAL_SPACES, " ");

// The printer's built-in font only has plain English letters, digits and signs
const isPrinterText = (value: string) => /^[\x20-\x7e]*$/.test(value);

const ascii = (value: string) =>
  Array.from(value).map((character) =>
    character.charCodeAt(0) <= 0x7f ? character.charCodeAt(0) : 0x3f,
  );

const line = (value = "") => [...ascii(value), LF];
const money = (value: number) => value.toFixed(2);

const pairText = (left: string, right: string, characters: number) => {
  const space = characters - left.length - right.length;
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

  // Numbers are right-aligned so names line up: " 9. " and "10. "
  const numberWidth = String(sale.items.length).length;
  sale.items.forEach((item, index) => {
    const prefix = `${String(index + 1).padStart(numberWidth)}. `;
    lines.push(
      { type: "text", text: item.productName, prefix },
      {
        type: "pair",
        left: `${item.quantity} x ${money(item.unitPrice)}`,
        right: money(item.lineTotal),
        indent: prefix.length,
      },
    );
  });

  lines.push(
    divider,
    { type: "pair", left: "TOTAL", right: money(sale.total), bold: true },
    { type: "text", text: "Thank you!", center: true },
  );
  return lines;
};

// A row as plain text for the paper width (printer and text preview)
const lineText = (receiptLine: ReceiptLine, characters: number) => {
  if (receiptLine.type === "divider") return "-".repeat(characters);
  if (receiptLine.type === "pair") {
    const indent = " ".repeat(receiptLine.indent ?? 0);
    return pairText(indent + receiptLine.left, receiptLine.right, characters);
  }
  return (receiptLine.prefix ?? "") + receiptLine.text;
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

export const getReceiptPreviewText = (
  sale: Sale,
  paperWidth: PaperWidth = DEFAULT_PAPER_WIDTH,
) =>
  receiptLines(sale)
    .map((receiptLine) => lineText(receiptLine, PAPER[paperWidth].characters))
    .join("\n");

// Split text into rows of at most `characters`, breaking at spaces when possible
const wrapRows = (text: string, characters: number) => {
  const rows: string[] = [];
  let rest = text.trimEnd();
  while (rest.length > characters) {
    const space = rest.lastIndexOf(" ", characters);
    const cut = space > 0 ? space : characters;
    rows.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  rows.push(rest);
  return rows;
};

// Pad a row to exactly the layout width, so every row is the same width and
// the printer's centring keeps them lined up on wider paper
const padRow = (row: string, characters: number, center: boolean) => {
  const free = Math.max(0, characters - row.length);
  const left = center ? Math.floor(free / 2) : 0;
  return " ".repeat(left) + row + " ".repeat(free - left);
};

// Lines the printer font can show are sent as text; others (e.g. Myanmar
// names) are drawn as pictures with `rasterize`. Everything is printed centred
// (see PaperWidth above).
export const buildSaleReceipt = async (
  sale: Sale,
  rasterize: LineRasterizer,
  paperWidth: PaperWidth = DEFAULT_PAPER_WIDTH,
) => {
  const paper = PAPER[paperWidth];
  const receipt: number[] = [ESC, 0x40];

  for (const receiptLine of receiptLines(sale)) {
    const text = lineText(receiptLine, paper.characters);
    const bold = receiptLine.type !== "divider" && !!receiptLine.bold;
    const center = receiptLine.type === "text" && !!receiptLine.center;
    const large = receiptLine.type === "text" && !!receiptLine.large;

    if (large && isPrinterText(text)) {
      // Shop name: double width + height, centred by the printer
      receipt.push(ESC, 0x61, 1, ESC, 0x45, 1, GS, 0x21, 0x11, ...line(text));
    } else if (isPrinterText(text)) {
      receipt.push(ESC, 0x61, 1, ESC, 0x45, bold ? 1 : 0, GS, 0x21, 0x00);
      // Numbered item: wrap the name only, keep continuation rows under it
      const prefix = receiptLine.type === "text" ? (receiptLine.prefix ?? "") : "";
      const body = prefix ? text.slice(prefix.length) : text;
      wrapRows(body, paper.characters - prefix.length).forEach((row, index) => {
        const lead = index === 0 ? prefix : " ".repeat(prefix.length);
        receipt.push(...line(padRow(lead + row, paper.characters, center)));
      });
    } else {
      // The picture is exactly the layout width (any centring is drawn into it)
      const prefix = receiptLine.type === "text" ? receiptLine.prefix : undefined;
      const image = await rasterize(prefix ? text.slice(prefix.length) : text, {
        bold,
        center,
        width: paper.dots,
        prefix,
      });
      receipt.push(ESC, 0x61, 1, ...rasterImageBytes(image));
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

// The dashed line shows the receipt width: on 58 mm paper both layouts
// should fit; with "80 mm" on 58 mm paper the line wraps (wrong setting)
export const buildTestReceipt = (paperWidth: PaperWidth = DEFAULT_PAPER_WIDTH) =>
  new Uint8Array([
    ESC, 0x40,
    ESC, 0x61, 1,
    ESC, 0x45, 1,
    GS, 0x21, 0x11,
    ...line(SHOP_NAME),
    GS, 0x21, 0x00,
    ESC, 0x45, 0,
    ...line("Printer test successful"),
    ...line(paperWidth === 58 ? "Layout: 58 mm (all printers)" : "Layout: 80 mm (full width)"),
    ...line("-".repeat(PAPER[paperWidth].characters)),
    ...line(),
    ...line(),
    GS, 0x56, 0,
  ]);
