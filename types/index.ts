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

// Line item in a sale
export interface SaleItem {
  productId: number | string; // number for products, string for custom products
  productName: string; // Added product name to store directly with the sale item
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Sale/Invoice model
export interface Sale {
  date: string;
  customer: Customer;
  items: SaleItem[];
  subtotal: number;
  total: number;
}
