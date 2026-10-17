import { supabase } from "@/lib/supabase";
import {
  deleteProduct,
  deleteSale,
  getProducts,
  getErrorMessage,
  getSales,
  NO_CONNECTION_MESSAGE,
  saveProduct,
  saveSale,
  searchProducts,
  updateProduct,
  updateSale,
} from "@/services/api";
import { Product, Profile, Sale } from "@/types";
import { isAuthRetryableFetchError, Session } from "@supabase/supabase-js";
import { create } from "zustand";

let authListenerStarted = false;


// Turn Supabase login errors into short messages for the user
const toSignInMessage = (error: unknown): string => {
  if (isAuthRetryableFetchError(error)) {
    return NO_CONNECTION_MESSAGE;
  }
  const message = error instanceof Error ? error.message : "";
  if (/network|fetch/i.test(message)) {
    return NO_CONNECTION_MESSAGE;
  }
  if (/invalid login credentials/i.test(message)) {
    return "Wrong email or password.";
  }
  if (/email not confirmed/i.test(message)) {
    return "This email is not confirmed yet. Ask the admin to confirm it.";
  }
  return message || "Could not sign in. Please try again.";
};

interface AppState {
  // Login
  session: Session | null;
  profile: Profile | null;
  authReady: boolean;
  initAuth: () => Promise<void>;
  loadProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  products: (Product & { id: number })[];
  sales: (Sale & { id: number })[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Initialization
  initializeApp: () => Promise<void>;

  // Product actions
  fetchProducts: () => Promise<void>;
  searchProducts: (searchTerm: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  editProduct: (product: Product & { id: number }) => Promise<void>;
  removeProduct: (productId: number) => Promise<void>;

  // Sale actions
  fetchSales: () => Promise<void>;
  // Pass the same clientId when retrying the same sale (saved only once)
  addSale: (sale: Omit<Sale, "id">, clientId?: string) => Promise<number>;
  editSale: (sale: Sale & { id: number }) => Promise<void>;
  removeSale: (saleId: number) => Promise<void>;
  refreshData: () => Promise<void>;

}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  profile: null,
  authReady: false,

  // Restore a saved login and follow login/logout changes
  initAuth: async () => {
    if (!authListenerStarted) {
      authListenerStarted = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        const previousUserId = get().session?.user.id;
        set({ session });
        if (!session) {
          set({ profile: null });
        } else if (session.user.id !== previousUserId) {
          // Don't call Supabase inside this callback (it can lock); run it next tick
          setTimeout(() => get().loadProfile(), 0);
        }
      });
    }

    try {
      const { data } = await supabase.auth.getSession();
      set({ session: data.session });
      if (data.session) {
        await get().loadProfile();
      }
    } catch (error) {
      console.warn("Failed to restore login:", error);
    } finally {
      set({ authReady: true });
    }
  },

  loadProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      console.warn("Failed to load profile:", error?.message ?? "not found");
      return;
    }
    set({
      profile: { id: data.id, fullName: data.full_name, role: data.role },
    });
  },

  signIn: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(toSignInMessage(error));
    }
  },

  signOut: async () => {
    // "local" signs out this phone even without internet
    await supabase.auth.signOut({ scope: "local" });
    // Forget the shop data so the next person loads it fresh
    set({
      session: null,
      profile: null,
      products: [],
      sales: [],
      error: null,
      isInitialized: false,
    });
  },

  products: [],
  sales: [],
  loading: false,
  error: null,
  isInitialized: false,

  // Load the shop data from Supabase after login
  initializeApp: async () => {
    if (get().isInitialized) return;

    set({ loading: true, error: null });
    try {
      const [products, sales] = await Promise.all([getProducts(), getSales()]);
      set({ products, sales, loading: false, isInitialized: true });
    } catch (error) {
      console.error("Failed to load data:", error);
      // Still open the app; screens load again when they come into focus
      set({
        error: getErrorMessage(error, "Failed to load data"),
        loading: false,
        isInitialized: true,
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
      set({ error: getErrorMessage(error, "Failed to fetch products"), loading: false });
    }
  },

  searchProducts: async (searchTerm: string) => {
    set({ loading: true, error: null });
    try {
      const products = await searchProducts(searchTerm);
      set({ products, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to search products"), loading: false });
    }
  },

  addProduct: async (product: Product) => {
    set({ loading: true, error: null });
    try {
      await saveProduct(product);
      // Saved; a failed refresh must not look like a failed save
      await get().refreshData();
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to add product"), loading: false });
      throw error;
    }
  },

  editProduct: async (product: Product & { id: number }) => {
    set({ loading: true, error: null });
    try {
      await updateProduct(product);
      // Saved; a failed refresh must not look like a failed save
      await get().refreshData();
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to update product"), loading: false });
      throw error;
    }
  },

  removeProduct: async (productId: number) => {
    set({ loading: true, error: null });
    try {
      await deleteProduct(productId);
      // Saved; a failed refresh must not look like a failed save
      await get().refreshData();
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to delete product"), loading: false });
      throw error;
    }
  },

  // Sale actions
  fetchSales: async () => {
    set({ loading: true, error: null });
    try {
      const sales = await getSales();
      set({ sales, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to fetch sales"), loading: false });
    }
  },

  addSale: async (sale: Omit<Sale, "id">, clientId?: string) => {
    set({ loading: true, error: null });
    try {
      // Save the sale (the server checks and updates stock in one transaction)
      const saleId = await saveSale(sale, clientId);
      // The sale is saved; a failed refresh must not look like a failed sale
      await get().refreshData();
      return saleId;
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to add sale"), loading: false });
      throw error;
    }
  },

  editSale: async (sale: Sale & { id: number }) => {
    set({ loading: true, error: null });
    try {
      // Update the sale (the server adjusts stock in one transaction)
      await updateSale(sale);
      await get().refreshData();
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to update sale"), loading: false });
      throw error;
    }
  },

  // Reload sales and stock after a change; never throws
  refreshData: async () => {
    try {
      const [sales, products] = await Promise.all([getSales(), getProducts()]);
      set({ sales, products, loading: false });
    } catch (error) {
      console.warn("Saved, but failed to refresh data:", error);
      set({ loading: false });
    }
  },

  removeSale: async (saleId: number) => {
    set({ loading: true, error: null });
    try {
      // Delete the sale (the server puts the stock back in one transaction)
      await deleteSale(saleId);
      await get().refreshData();
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to delete sale"), loading: false });
      throw error;
    }
  },
}));

// True when the signed-in user is an admin (staff cannot edit/delete/export)
export const useIsAdmin = () =>
  useAppStore((state) => state.profile?.role === "admin");
