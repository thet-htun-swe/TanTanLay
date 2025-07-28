import { create } from 'zustand';
import { Product, Sale, SaleItem } from '@/types';
import { 
  initializeDatabase,
  getProducts, 
  getSales, 
  saveProduct, 
  updateProduct, 
  deleteProduct, 
  saveSale 
} from '@/services/database';
import { migrationService } from '@/services/migration';

interface AppState {
  products: Product[];
  sales: Sale[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Initialization
  initializeApp: () => Promise<void>;
  
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
  isInitialized: false,
  
  // Initialize database and load initial data
  initializeApp: async () => {
    if (get().isInitialized) return;
    
    set({ loading: true, error: null });
    try {
      await initializeDatabase();
      
      // Check if migration is needed and perform it
      const migrationCompleted = await migrationService.isMigrationCompleted();
      if (!migrationCompleted) {
        console.log('Starting data migration from AsyncStorage to SQLite...');
        const migrationResult = await migrationService.migrateFromAsyncStorage();
        if (migrationResult.success) {
          console.log('Migration completed:', migrationResult.message);
          if (migrationResult.stats) {
            console.log('Migration stats:', migrationResult.stats);
          }
        } else {
          console.error('Migration failed:', migrationResult.message);
        }
      }
      
      // Load initial data
      const [products, sales] = await Promise.all([
        getProducts(),
        getSales()
      ]);
      
      set({ 
        products, 
        sales, 
        loading: false, 
        isInitialized: true 
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ 
        error: 'Failed to initialize database', 
        loading: false,
        isInitialized: false
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
      // Save the sale
      await saveSale(sale);
      
      // Update product quantities
      const currentProducts = [...get().products];
      const updatedProducts: Product[] = [];
      
      // Process each sale item and update product quantities
      for (const item of sale.items) {
        const productIndex = currentProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          const product = currentProducts[productIndex];
          const updatedProduct = {
            ...product,
            stockQty: Math.max(0, product.stockQty - item.quantity) // Ensure quantity doesn't go below 0
          };
          
          // Update the product in storage
          await updateProduct(updatedProduct);
          updatedProducts.push(updatedProduct);
          
          // Update the product in the current array
          currentProducts[productIndex] = updatedProduct;
        }
      }
      
      // Refresh sales and products data
      const sales = await getSales();
      const products = await getProducts();
      set({ sales, products, loading: false });
    } catch (error) {
      set({ error: 'Failed to add sale', loading: false });
    }
  },
}));
