import { supabase } from "@/lib/supabase";
import {
  deleteProduct,
  deleteSale,
  getProducts,
  getErrorMessage,
  getProductsByIds,
  getSaleById,
  getSalesPage,
  getSalesSummary,
  NO_CONNECTION_MESSAGE,
  ProductRow,
  SaleSummary,
  SavedSale,
  saveProduct,
  saveSale,
  searchProducts,
  toProduct,
  toSaleSummary,
  updateProduct,
  updateSale,
} from "@/services/api";
import { Product, Profile, Sale } from "@/types";
import {
  isAuthRetryableFetchError,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  Session,
} from "@supabase/supabase-js";
import { create } from "zustand";

let authListenerStarted = false;

// Live updates from other phones (Supabase Realtime)
let realtimeChannel: RealtimeChannel | null = null;
let hasSubscribedOnce = false;
let productsVersionTimer: ReturnType<typeof setTimeout> | null = null;
let customersVersionTimer: ReturnType<typeof setTimeout> | null = null;

type ProductList = (Product & { id: number })[];
type SaleList = (Sale & { id: number })[];

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);
const byDateDesc = (a: Sale & { id: number }, b: Sale & { id: number }) =>
  b.date.localeCompare(a.date) || b.id - a.id;

const upsertById = <T extends { id: number }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];

// Ids of the inventory products in a sale (custom items have string ids)
const productIdsOf = (...sales: (Pick<Sale, "items"> | undefined)[]) => [
  ...new Set(
    sales.flatMap((sale) =>
      (sale?.items ?? [])
        .map((item) => item.productId)
        .filter((id): id is number => typeof id === "number"),
    ),
  ),
];

// The Home dashboard starts with this month and the 6 before it
const defaultSummarySince = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 6, 1);
};
let summaryRequest: Promise<void> | null = null;

// Turn Supabase login errors into short messages for the user
const toSignInMessage = (error: unknown): string => {
  if (error instanceof Error && /timed out/i.test(error.message)) {
    return "The server did not answer in time. Check the internet connection and try again.";
  }
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
  // Set when the account or shop data could not be loaded after sign-in
  startupError: string | null;
  retryStartup: () => Promise<void>;
  initAuth: () => Promise<void>;
  loadProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  products: (Product & { id: number })[];
  // Newest sales first, loaded a page at a time (see loadMoreSales)
  sales: (Sale & { id: number })[];
  hasMoreSales: boolean;
  loadingMoreSales: boolean;
  loadMoreSales: () => Promise<void>;
  // Light rows for the Home dashboard, every sale ordered since summarySince
  salesSummary: SaleSummary[];
  summarySince: Date;
  ensureSummarySince: (since: Date) => Promise<void>;
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
  // Pass the same clientId when retrying the same sale (saved only once).
  // Returns as soon as the server has saved it; lists update in the background.
  addSale: (sale: Omit<Sale, "id">, clientId?: string) => Promise<SavedSale>;
  editSale: (sale: Sale & { id: number }) => Promise<void>;
  removeSale: (saleId: number) => Promise<void>;
  refreshData: () => Promise<void>;
  // Load one sale and some products again and put them in the lists
  syncSale: (saleId: number, productIds: number[]) => Promise<void>;

  // Live updates. The counters go up when other phones change products or
  // customers, so screens with their own lists know to reload.
  productsVersion: number;
  customersVersion: number;
  startRealtime: () => void;
  stopRealtime: () => void;

}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  profile: null,
  authReady: false,
  startupError: null,

  // Restore a saved login and follow login/logout changes
  initAuth: async () => {
    if (!authListenerStarted) {
      authListenerStarted = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        const previousUserId = get().session?.user.id;
        set({ session });
        if (!session) {
          // Logged out (or the login ran out): stop live updates, forget data
          get().stopRealtime();
          set({
            profile: null,
            products: [],
            sales: [],
            hasMoreSales: false,
            salesSummary: [],
            summarySince: defaultSummarySince(),
            error: null,
            startupError: null,
            isInitialized: false,
          });
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

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        set({
          startupError:
            "Your account was not found. Ask the shop admin to check it.",
        });
        return;
      }
      set({
        profile: { id: data.id, fullName: data.full_name, role: data.role },
        startupError: null,
      });
    } catch (error) {
      console.warn("Failed to load profile:", error);
      set({
        startupError: getErrorMessage(error, "Could not load your account."),
      });
    }
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
    get().stopRealtime();
    // "local" signs out this phone even without internet
    await supabase.auth.signOut({ scope: "local" });
    // Forget the shop data so the next person loads it fresh
    set({
      session: null,
      profile: null,
      products: [],
      sales: [],
      hasMoreSales: false,
      salesSummary: [],
      summarySince: defaultSummarySince(),
      error: null,
      startupError: null,
      isInitialized: false,
    });
  },

  products: [],
  sales: [],
  hasMoreSales: false,
  loadingMoreSales: false,
  salesSummary: [],
  summarySince: defaultSummarySince(),
  loading: false,
  error: null,
  isInitialized: false,

  // Load the shop data from Supabase after login
  initializeApp: async () => {
    if (get().isInitialized) return;

    set({ loading: true, error: null, startupError: null });
    // The role decides what the app shows, so the account must load first
    if (!get().profile) {
      await get().loadProfile();
      if (!get().profile) {
        set({ loading: false });
        return;
      }
    }
    get().startRealtime();
    try {
      const summarySince = defaultSummarySince();
      const [products, page, salesSummary] = await Promise.all([
        getProducts(),
        getSalesPage(),
        getSalesSummary(summarySince),
      ]);
      set({
        products,
        sales: page.sales,
        hasMoreSales: page.hasMore,
        salesSummary,
        summarySince,
        loading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
      // The loading screen shows this with Retry and Log out buttons
      set({
        startupError: getErrorMessage(error, "Failed to load data"),
        loading: false,
      });
    }
  },

  retryStartup: async () => {
    await get().initializeApp();
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

  // Product changes wait for one request only, then change the list on this
  // phone (other phones get them through live updates)
  addProduct: async (product: Product) => {
    const id = await saveProduct(product);
    set((state) => ({
      products: upsertById<ProductList[number]>(state.products, { ...product, id }).sort(byName),
      productsVersion: state.productsVersion + 1,
    }));
  },

  editProduct: async (product: Product & { id: number }) => {
    await updateProduct(product);
    set((state) => ({
      products: upsertById<ProductList[number]>(state.products, product).sort(byName),
      productsVersion: state.productsVersion + 1,
    }));
  },

  removeProduct: async (productId: number) => {
    await deleteProduct(productId);
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
      productsVersion: state.productsVersion + 1,
    }));
  },

  // Sale actions
  // Load the newest page of sales and the dashboard numbers again
  fetchSales: async () => {
    set({ loading: true, error: null });
    try {
      const since = get().summarySince;
      const [page, salesSummary] = await Promise.all([getSalesPage(), getSalesSummary(since)]);
      set({ sales: page.sales, hasMoreSales: page.hasMore, salesSummary, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error, "Failed to fetch sales"), loading: false });
    }
  },

  loadMoreSales: async () => {
    const { sales, hasMoreSales, loadingMoreSales } = get();
    if (!hasMoreSales || loadingMoreSales || !sales.length) return;
    set({ loadingMoreSales: true });
    try {
      const page = await getSalesPage(sales[sales.length - 1]);
      set((state) => ({
        sales: page.sales
          .reduce((list, sale) => upsertById<SaleList[number]>(list, sale), state.sales)
          .sort(byDateDesc),
        hasMoreSales: page.hasMore,
        loadingMoreSales: false,
      }));
    } catch (error) {
      set({ loadingMoreSales: false });
      throw error;
    }
  },

  // Load older dashboard rows when the Home chart goes further back
  ensureSummarySince: async (since: Date) => {
    while (summaryRequest) await summaryRequest;
    const loadedSince = get().summarySince;
    if (since.getTime() >= loadedSince.getTime()) return;
    // Load 6 more months at once, so going back step by step is quick
    const from = new Date(since.getFullYear(), since.getMonth() - 6, 1);
    summaryRequest = (async () => {
      try {
        const older = await getSalesSummary(from, loadedSince);
        set((state) => ({
          salesSummary: older.reduce((list, row) => upsertById(list, row), state.salesSummary),
          summarySince: from,
        }));
      } catch (error) {
        console.warn("Failed to load older sales summary:", error);
      } finally {
        summaryRequest = null;
      }
    })();
    await summaryRequest;
  },

  addSale: async (sale: Omit<Sale, "id">, clientId?: string) => {
    // Save the sale (the server checks and updates stock in one transaction).
    // Only this request is waited for, so the next sale can start at once.
    const saved = await saveSale(sale, clientId);
    // Take the sold pieces off this phone's stock now (the real numbers follow)
    set((state) => ({
      products: state.products.map((product) => {
        const sold = sale.items
          .filter((item) => item.productId === product.id)
          .reduce((sum, item) => sum + item.quantity, 0);
        return sold ? { ...product, stockQty: Math.max(0, product.stockQty - sold) } : product;
      }),
    }));
    get().syncSale(saved.id, productIdsOf(sale));
    return saved;
  },

  editSale: async (sale: Sale & { id: number }) => {
    const before = get().sales.find((s) => s.id === sale.id);
    // Update the sale (the server adjusts stock in one transaction)
    await updateSale(sale);
    get().syncSale(sale.id, productIdsOf(before, sale));
  },

  // Load one saved sale and the stock of its products; never throws
  syncSale: async (saleId: number, productIds: number[]) => {
    try {
      const [sale, products] = await Promise.all([
        getSaleById(saleId),
        getProductsByIds(productIds),
      ]);
      set((state) => ({
        sales: sale
          ? upsertById<SaleList[number]>(state.sales, sale).sort(byDateDesc)
          : state.sales,
        salesSummary:
          sale && new Date(sale.orderDate) >= state.summarySince
            ? upsertById(state.salesSummary, toSaleSummary(sale))
            : state.salesSummary,
        products: products
          .reduce((list, product) => upsertById<ProductList[number]>(list, product), state.products)
          .sort(byName),
        productsVersion: products.length ? state.productsVersion + 1 : state.productsVersion,
      }));
    } catch (error) {
      console.warn("Saved, but failed to refresh the sale:", error);
    }
  },

  // Reload stock, the newest sales and the dashboard; never throws
  refreshData: async () => {
    try {
      const since = get().summarySince;
      const [page, products, salesSummary] = await Promise.all([
        getSalesPage(),
        getProducts(),
        getSalesSummary(since),
      ]);
      set({
        sales: page.sales,
        hasMoreSales: page.hasMore,
        products,
        salesSummary,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.warn("Failed to refresh data:", error);
      set({ loading: false });
    }
  },

  productsVersion: 0,
  customersVersion: 0,

  startRealtime: () => {
    if (realtimeChannel) return;
    hasSubscribedOnce = false;

    // Many stock rows change in one sale; tell screens once, a moment later
    const bumpProductsVersion = () => {
      if (productsVersionTimer) clearTimeout(productsVersionTimer);
      productsVersionTimer = setTimeout(() => {
        productsVersionTimer = null;
        set((state) => ({ productsVersion: state.productsVersion + 1 }));
      }, 400);
    };
    const bumpCustomersVersion = () => {
      if (customersVersionTimer) clearTimeout(customersVersionTimer);
      customersVersionTimer = setTimeout(() => {
        customersVersionTimer = null;
        set((state) => ({ customersVersion: state.customersVersion + 1 }));
      }, 400);
    };

    const onProductChange = (
      payload: RealtimePostgresChangesPayload<ProductRow>,
    ) => {
      if (payload.eventType === "DELETE") {
        const id = payload.old.id;
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
      } else {
        const product = toProduct(payload.new);
        set((state) => ({
          products: upsertById<ProductList[number]>(state.products, product).sort(byName),
        }));
      }
      bumpProductsVersion();
    };

    const onSaleChange = async (
      payload: RealtimePostgresChangesPayload<{ id: number }>,
    ) => {
      if (payload.eventType === "DELETE") {
        const id = payload.old.id;
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id),
          salesSummary: state.salesSummary.filter((s) => s.id !== id),
        }));
        return;
      }
      // The change message has no items, so load the whole sale
      try {
        const sale = await getSaleById(payload.new.id);
        if (!sale || realtimeChannel === null) return;
        set((state) => ({
          sales: upsertById<SaleList[number]>(state.sales, sale).sort(byDateDesc),
          salesSummary:
            new Date(sale.orderDate) >= state.summarySince
              ? upsertById(state.salesSummary, toSaleSummary(sale))
              : state.salesSummary,
        }));
      } catch (error) {
        console.warn("Live update: failed to load sale:", error);
      }
    };

    realtimeChannel = supabase
      .channel("shop-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        onProductChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        onSaleChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        bumpCustomersVersion,
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          // Reconnected after a break: load again to catch missed changes
          if (hasSubscribedOnce) {
            get().refreshData();
            bumpProductsVersion();
            bumpCustomersVersion();
          }
          hasSubscribedOnce = true;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // supabase-js keeps trying to reconnect by itself
          console.warn("Live updates interrupted:", status, error?.message ?? "");
        }
      });
  },

  stopRealtime: () => {
    if (productsVersionTimer) clearTimeout(productsVersionTimer);
    if (customersVersionTimer) clearTimeout(customersVersionTimer);
    productsVersionTimer = null;
    customersVersionTimer = null;
    if (realtimeChannel) {
      const channel = realtimeChannel;
      realtimeChannel = null;
      supabase.removeChannel(channel);
    }
  },

  removeSale: async (saleId: number) => {
    const before = get().sales.find((s) => s.id === saleId);
    // Delete the sale (the server puts the stock back in one transaction)
    await deleteSale(saleId);
    set((state) => ({
      sales: state.sales.filter((s) => s.id !== saleId),
      salesSummary: state.salesSummary.filter((s) => s.id !== saleId),
    }));
    // Load the stock that came back (all products if the sale was not loaded)
    if (before) {
      get().syncSale(saleId, productIdsOf(before));
    } else {
      getProducts()
        .then((products) => set({ products }))
        .catch((error) => console.warn("Failed to refresh products:", error));
    }
  },
}));

// True when the signed-in user is an admin (staff cannot edit/delete/export)
export const useIsAdmin = () =>
  useAppStore((state) => state.profile?.role === "admin");
