import { create } from 'zustand';
import { Product, Sale, SaleItem } from '@/types';
import { getProducts, getSales, saveProduct, updateProduct, deleteProduct, saveSale } from '@/services/storage';

interface AppState {
  products: Product[];
  sales: Sale[];
  loading: boolean;
  error: string | null;
  
  // Product actions
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  editProduct: (product: Product) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  
  // Sale actions
  fetchSales: () => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  sales: [],
  loading: false,
  error: null,
  
  // Product actions
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch products', loading: false });
    }
  },
  
  addProduct: async (product: Product) => {
    set({ loading: true, error: null });
    try {
      await saveProduct(product);
      const products = await getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: 'Failed to add product', loading: false });
    }
  },
  
  editProduct: async (product: Product) => {
    set({ loading: true, error: null });
    try {
      await updateProduct(product);
      const products = await getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: 'Failed to update product', loading: false });
    }
  },
  
  removeProduct: async (productId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteProduct(productId);
      const products = await getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: 'Failed to delete product', loading: false });
    }
  },
  
  // Sale actions
  fetchSales: async () => {
    set({ loading: true, error: null });
    try {
      const sales = await getSales();
      set({ sales, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch sales', loading: false });
    }
  },
  
  addSale: async (sale: Sale) => {
    set({ loading: true, error: null });
    try {
      await saveSale(sale);
      const sales = await getSales();
      set({ sales, loading: false });
    } catch (error) {
      set({ error: 'Failed to add sale', loading: false });
    }
  },
}));
