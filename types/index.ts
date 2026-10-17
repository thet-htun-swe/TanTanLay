// Product model
export interface Product {
  name: string;
  price: number;
  stockQty: number;
}

// Customer model
export interface Customer {
  name: string;
  contact: string;
  address: string;
}

// Discount on a sale item line: an amount (2000 off) or a percentage (10%)
export type DiscountType = "amount" | "percent";

// Line item in a sale
export interface SaleItem {
  productId: number | string; // number for products, string for custom products
  productName: string; // Added product name to store directly with the sale item
  quantity: number;
  unitPrice: number;
  // quantity * unitPrice - discount (see utils/saleMath.ts)
  lineTotal: number;
  discount?: number; // money taken off the whole line
  discountType?: DiscountType;
  discountValue?: number; // what the user typed: 2000, or 10 for 10%
}

// Sale/Invoice model
export interface Sale {
  id?: number;
  invoiceNumber?: string;
  date: string;
  orderDate: string;
  customer: Customer;
  items: SaleItem[];
  subtotal: number;
  total: number;
  // Who made the sale (shown in the app and Excel export, not on the receipt)
  createdByName?: string;
}

// Signed-in user's role (from the Supabase `profiles` table)
export type Role = "admin" | "staff";

export interface Profile {
  id: string;
  fullName: string | null;
  role: Role;
}

export interface WifiPrinterSettings {
  host: string;
  port: number;
}

export interface BluetoothPrinterSettings {
  address: string;
  name: string;
}

export type PrinterSettings =
  | ({ connectionType: "wifi" } & WifiPrinterSettings)
  | ({ connectionType: "bluetooth" } & BluetoothPrinterSettings);
