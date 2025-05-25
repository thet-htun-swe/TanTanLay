// Product model
export interface Product {
  id: string;
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
  productId: string;
  productName: string; // Added product name to store directly with the sale item
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

// Sale/Invoice model
export interface Sale {
  id: string;
  date: string;
  customer: Customer;
  items: SaleItem[];
  subtotal: number;
  total: number;
}
