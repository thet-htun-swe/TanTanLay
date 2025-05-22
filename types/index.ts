// Product model
export interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  stockQty: number;
}

// Customer model
export interface Customer {
  name: string;
  contact: string;
}

// Line item in a sale
export interface SaleItem {
  productId: string;
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
  tax: number;
  total: number;
}
