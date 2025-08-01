import {
  databaseService,
  deleteProduct,
  getProducts,
  getSales,
  initializeDatabase,
  saveProduct,
  saveSale,
  updateProduct,
  updateSale,
} from "@/services/database";
import { Product, Sale } from "@/types";
import { create } from "zustand";

interface AppState {
  products: (Product & { id: number })[];
  sales: (Sale & { id: number })[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Initialization
  initializeApp: () => Promise<void>;

  // Product actions
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  editProduct: (product: Product & { id: number }) => Promise<void>;
  removeProduct: (productId: number) => Promise<void>;

  // Sale actions
  fetchSales: () => Promise<void>;
  addSale: (sale: Omit<Sale, "id">) => Promise<number>;
  editSale: (sale: Sale & { id: number }) => Promise<void>;

  // Utility actions
  clearAllData: () => Promise<void>;
  recreateTables: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  sales: [],
  loading: false,
  error: null,
  isInitialized: false,

  // Initialize database and load initial data
  initializeApp: async () => {
    if (get().isInitialized) return;

    set({ loading: true, error: null });
    try {
      await initializeDatabase();

      // Load initial data
      const [products, sales] = await Promise.all([getProducts(), getSales()]);

      set({
        products,
        sales,
        loading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Failed to initialize app:", error);
      set({
        error: "Failed to initialize database",
        loading: false,
        isInitialized: false,
      });
    }
  },

  // Product actions
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
    }
  },

  addProduct: async (product: Product) => {
    set({ loading: true, error: null });
    try {
      await saveProduct(product);
      const products = await getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: "Failed to add product", loading: false });
    }
  },

  editProduct: async (product: Product & { id: number }) => {
    set({ loading: true, error: null });
    try {
      await updateProduct(product);
      const products = await getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: "Failed to update product", loading: false });
    }
  },

  removeProduct: async (productId: number) => {
    set({ loading: true, error: null });
    try {
      await deleteProduct(productId);
      const products = await getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: "Failed to delete product", loading: false });
    }
  },

  // Sale actions
  fetchSales: async () => {
    set({ loading: true, error: null });
    try {
      const sales = await getSales();
      set({ sales, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch sales", loading: false });
    }
  },

  addSale: async (sale: Omit<Sale, "id">) => {
    set({ loading: true, error: null });
    try {
      // Save the sale (database service handles stock updates automatically in transaction)
      const saleId = await saveSale(sale);

      // Refresh sales and products data to reflect the changes
      const [sales, products] = await Promise.all([getSales(), getProducts()]);
      set({ sales, products, loading: false });
      return saleId;
    } catch (error) {
      set({ error: "Failed to add sale", loading: false });
      throw error;
    }
  },

  editSale: async (sale: Sale & { id: number }) => {
    set({ loading: true, error: null });
    try {
      // Update the sale (database service handles stock updates automatically in transaction)
      await updateSale(sale);

      // Refresh sales and products data to reflect the changes
      const [sales, products] = await Promise.all([getSales(), getProducts()]);
      set({ sales, products, loading: false });
    } catch (error) {
      set({ error: "Failed to update sale", loading: false });
      throw error;
    }
  },

  // Clear all data
  clearAllData: async () => {
    set({ loading: true, error: null });
    try {
      await databaseService.clearAllData();
      set({
        products: [],
        sales: [],
        loading: false,
      });
    } catch (error) {
      set({ error: "Failed to clear data", loading: false });
    }
  },

  // Recreate tables with correct schema
  recreateTables: async () => {
    set({ loading: true, error: null });
    try {
      await databaseService.recreateTables();
      // Reload data after recreating tables
      const [products, sales] = await Promise.all([getProducts(), getSales()]);
      set({
        products,
        sales,
        loading: false,
      });
    } catch (error) {
      set({ error: "Failed to recreate tables", loading: false });
    }
  },
}));
