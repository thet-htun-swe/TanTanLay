import { supabase } from "@/lib/supabase";
import { Customer, Product, Sale, SaleItem } from "@/types";
import { generateUUID } from "@/utils/uuid";

// Data functions for products, customers and sales, backed by Supabase.
// Sales are written only through the database functions create_sale /
// update_sale / delete_sale (stock is checked and changed on the server).

const PAGE_SIZE = 50; // rows per page in search lists
const FETCH_ALL_BATCH = 1000; // Supabase returns at most 1000 rows per request

export const NO_CONNECTION_MESSAGE =
  "No internet connection. Please check your connection and try again.";

// Thrown when the phone cannot reach the server (screens can check for it)
export class NoConnectionError extends Error {
  constructor() {
    super(NO_CONNECTION_MESSAGE);
    this.name = "NoConnectionError";
  }
}

export const isNoConnectionError = (error: unknown) =>
  error instanceof Error && error.name === "NoConnectionError";

// Message to show the user for any error from this file (or a fallback)
export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

type ApiError = { message?: string; code?: string } | null | undefined;

const isNetworkFailure = (error: ApiError | unknown) => {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");
  return /network request failed|failed to fetch|fetch failed|network ?error|timed? ?out|aborted/i.test(
    message,
  );
};

// Turn a Supabase error into a short message for the user
const toError = (error: ApiError | unknown, fallback: string): Error => {
  if (isNetworkFailure(error)) return new NoConnectionError();

  const { message, code } = (error ?? {}) as { message?: string; code?: string };
  if (code === "42501") {
    return new Error("You don't have permission to do this.");
  }
  if (code === "23514" && message?.includes("stock_qty")) {
    return new Error("Stock cannot be below 0.");
  }
  // Errors raised by our database functions (e.g. "Not enough stock for ...")
  if (code === "P0001" && message) return new Error(message);
  return new Error(message || fallback);
};

// Run a Supabase request; turn thrown network errors into NoConnectionError
const run = async <T>(
  request: PromiseLike<{ data: T; error: ApiError }>,
  fallback: string,
): Promise<T> => {
  let result: { data: T; error: ApiError };
  try {
    result = await request;
  } catch (error) {
    throw toError(error, fallback);
  }
  if (result.error) throw toError(result.error, fallback);
  return result.data;
};

// Load every row of a query in batches of 1000
const fetchAll = async <T>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: ApiError }>,
  fallback: string,
): Promise<T[]> => {
  const rows: T[] = [];
  for (let from = 0; ; from += FETCH_ALL_BATCH) {
    const page =
      (await run(makeQuery(from, from + FETCH_ALL_BATCH - 1), fallback)) ?? [];
    rows.push(...page);
    if (page.length < FETCH_ALL_BATCH) return rows;
  }
};

// "contains" pattern for ilike; % and _ typed by the user are matched literally
const likePattern = (text: string) =>
  `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// Same pattern, quoted for use inside a PostgREST or() filter
const quotedLikePattern = (text: string) =>
  `"${likePattern(text).replace(/[\\"]/g, (c) => `\\${c}`)}"`;

// ---------------------------------------------------------------------------
// Row types and mapping (snake_case in the database, camelCase in the app)
// ---------------------------------------------------------------------------

export type ProductRow = { id: number; name: string; price: number; stock_qty: number };
type CustomerRow = {
  id: number;
  name: string;
  contact: string | null;
  address: string | null;
};
type SaleItemRow = {
  id: number;
  product_id: number | null;
  custom_key: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};
type SaleRow = {
  id: number;
  invoice_number: string | null;
  customer_name: string;
  customer_contact: string | null;
  customer_address: string | null;
  subtotal: number;
  total: number;
  date: string;
  order_date: string;
  created_by_name?: string | null; // added by migration 002
  sale_items?: SaleItemRow[];
};

const PRODUCT_COLUMNS = "id, name, price, stock_qty";
const CUSTOMER_COLUMNS = "id, name, contact, address";
// One string literal (not joined) so supabase-js can read its type.
// "*" (all sale columns) also works before migration 002 adds created_by_name.
const SALE_COLUMNS =
  "*, sale_items(id, product_id, custom_key, product_name, quantity, unit_price, line_total)";

// Also used for live updates (realtime rows have the same columns)
export const toProduct = (row: ProductRow): Product & { id: number } => ({
  id: row.id,
  name: row.name,
  price: Number(row.price),
  stockQty: row.stock_qty,
});

const toCustomer = (row: CustomerRow): Customer & { id: number } => ({
  id: row.id,
  name: row.name,
  contact: row.contact ?? "",
  address: row.address ?? "",
});

const toSaleItem = (row: SaleItemRow): SaleItem => ({
  // Inventory item -> numeric id; custom item -> "custom-<uuid>" string.
  // An item whose product was deleted becomes a string id, so it never touches stock.
  productId: row.product_id ?? row.custom_key ?? `deleted-${row.id}`,
  productName: row.product_name,
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  lineTotal: Number(row.line_total),
});

const toSale = (row: SaleRow): Sale & { id: number } => ({
  id: row.id,
  invoiceNumber: row.invoice_number || undefined,
  date: row.date,
  orderDate: row.order_date,
  customer: {
    name: row.customer_name,
    contact: row.customer_contact ?? "",
    address: row.customer_address ?? "",
  },
  items: [...(row.sale_items ?? [])]
    .sort((a, b) => a.id - b.id)
    .map(toSaleItem),
  subtotal: Number(row.subtotal),
  total: Number(row.total),
  createdByName: row.created_by_name ?? undefined,
});

// Phone's local calendar day (YYYY-MM-DD); the invoice number uses this day
const localDay = (iso: string) => {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const toSalePayload = (sale: Omit<Sale, "id">) => ({
  customer: {
    name: sale.customer.name,
    contact: sale.customer.contact,
    address: sale.customer.address,
  },
  items: sale.items.map((item) =>
    typeof item.productId === "number"
      ? {
          product_id: item.productId,
          custom_key: null,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
        }
      : {
          product_id: null,
          custom_key: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
        },
  ),
  subtotal: sale.subtotal,
  total: sale.total,
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const getProducts = async (): Promise<(Product & { id: number })[]> => {
  const rows = await fetchAll<ProductRow>(
    (from, to) =>
      supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .order("name")
        .order("id")
        .range(from, to),
    "Failed to load products",
  );
  return rows.map(toProduct);
};

export const searchProducts = async (
  searchTerm: string,
  offset = 0,
): Promise<(Product & { id: number })[]> => {
  const query = searchTerm.trim();
  let request = supabase.from("products").select(PRODUCT_COLUMNS);
  if (query) request = request.ilike("name", likePattern(query));
  const rows = await run(
    request.order("name").order("id").range(offset, offset + PAGE_SIZE - 1),
    "Failed to search products",
  );
  return (rows ?? []).map(toProduct);
};

export const getProductById = async (
  id: number,
): Promise<(Product & { id: number }) | null> => {
  const row = await run(
    supabase.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle(),
    "Failed to load product",
  );
  return row ? toProduct(row) : null;
};

export const saveProduct = async (product: Omit<Product, "id">): Promise<number> => {
  const row = await run(
    supabase
      .from("products")
      .insert({
        name: product.name,
        price: product.price,
        stock_qty: product.stockQty,
      })
      .select("id")
      .single(),
    "Failed to add product",
  );
  if (!row) throw new Error("Failed to add product");
  return row.id;
};

export const updateProduct = async (product: Product & { id: number }): Promise<void> => {
  const rows = await run(
    supabase
      .from("products")
      .update({
        name: product.name,
        price: product.price,
        stock_qty: product.stockQty,
      })
      .eq("id", product.id)
      .select("id"),
    "Failed to update product",
  );
  // Row rules hide a blocked change as "0 rows"; report it instead of failing silently
  if (!rows?.length) throw new Error("Product not found, or you don't have permission.");
};

export const deleteProduct = async (id: number): Promise<void> => {
  const rows = await run(
    supabase.from("products").delete().eq("id", id).select("id"),
    "Failed to delete product",
  );
  if (!rows?.length) throw new Error("Product not found, or you don't have permission.");
};

export const getLowStockProducts = async (
  threshold: number = 5,
): Promise<(Product & { id: number })[]> => {
  const rows = await fetchAll<ProductRow>(
    (from, to) =>
      supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .lte("stock_qty", threshold)
        .order("stock_qty")
        .range(from, to),
    "Failed to load products",
  );
  return rows.map(toProduct);
};

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const getCustomers = async (): Promise<(Customer & { id: number })[]> => {
  const rows = await fetchAll<CustomerRow>(
    (from, to) =>
      supabase
        .from("customers")
        .select(CUSTOMER_COLUMNS)
        .order("name")
        .order("id")
        .range(from, to),
    "Failed to load customers",
  );
  return rows.map(toCustomer);
};

export const searchCustomers = async (
  searchTerm: string,
  offset = 0,
): Promise<(Customer & { id: number })[]> => {
  const query = searchTerm.trim();
  let request = supabase.from("customers").select(CUSTOMER_COLUMNS);
  if (query) {
    const pattern = quotedLikePattern(query);
    request = request.or(`name.ilike.${pattern},contact.ilike.${pattern}`);
  }
  const rows = await run(
    request.order("name").order("id").range(offset, offset + PAGE_SIZE - 1),
    "Failed to search customers",
  );
  return (rows ?? []).map(toCustomer);
};

export const getCustomerById = async (
  id: number,
): Promise<(Customer & { id: number }) | null> => {
  const row = await run(
    supabase.from("customers").select(CUSTOMER_COLUMNS).eq("id", id).maybeSingle(),
    "Failed to load customer",
  );
  return row ? toCustomer(row) : null;
};

export const saveCustomer = async (customer: Customer): Promise<number> => {
  const row = await run(
    supabase
      .from("customers")
      .insert({
        name: customer.name,
        contact: customer.contact || null,
        address: customer.address || null,
      })
      .select("id")
      .single(),
    "Failed to add customer",
  );
  if (!row) throw new Error("Failed to add customer");
  return row.id;
};

export const updateCustomer = async (customer: Customer & { id: number }): Promise<void> => {
  const rows = await run(
    supabase
      .from("customers")
      .update({
        name: customer.name,
        contact: customer.contact || null,
        address: customer.address || null,
      })
      .eq("id", customer.id)
      .select("id"),
    "Failed to update customer",
  );
  if (!rows?.length) throw new Error("Customer not found, or you don't have permission.");
};

export const deleteCustomer = async (id: number): Promise<void> => {
  const rows = await run(
    supabase.from("customers").delete().eq("id", id).select("id"),
    "Failed to delete customer",
  );
  if (!rows?.length) throw new Error("Customer not found, or you don't have permission.");
};

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

// Saves a sale on the server (stock is checked there). Pass the same clientId
// when retrying the same sale; the server then saves it only once.
// Returns the new sale's id.
export const saveSale = async (
  sale: Omit<Sale, "id">,
  clientId: string = generateUUID(),
): Promise<number> => {
  const payload = {
    ...toSalePayload(sale),
    client_id: clientId,
    date: sale.date,
    order_date: sale.orderDate,
    order_day: localDay(sale.orderDate),
  };

  // A dropped connection may have saved the sale anyway; retrying with the
  // same clientId is safe, so try a couple more times on network errors.
  for (let attempt = 1; ; attempt++) {
    try {
      const rows = await run(
        supabase.rpc("create_sale", { p_sale: payload }),
        "Failed to save sale",
      );
      const created = (rows as { id: number; invoice_number: string }[] | null)?.[0];
      if (!created) throw new Error("Failed to save sale");
      return created.id;
    } catch (error) {
      if (!isNoConnectionError(error) || attempt >= 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const getSales = async (): Promise<(Sale & { id: number })[]> => {
  const rows = await fetchAll<SaleRow>(
    (from, to) =>
      supabase
        .from("sales")
        .select(SALE_COLUMNS)
        .order("date", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    "Failed to load sales",
  );
  return rows.map(toSale);
};

export const getSaleById = async (id: number): Promise<(Sale & { id: number }) | null> => {
  const row = await run(
    supabase.from("sales").select(SALE_COLUMNS).eq("id", id).maybeSingle<SaleRow>(),
    "Failed to load sale",
  );
  return row ? toSale(row) : null;
};

// Admin only. Dates and invoice number are not changed (same as before).
export const updateSale = async (sale: Sale & { id: number }): Promise<void> => {
  await run(
    supabase.rpc("update_sale", { p_id: sale.id, p_sale: toSalePayload(sale) }),
    "Failed to update sale",
  );
};

// Admin only. Stock for inventory items comes back.
export const deleteSale = async (id: number): Promise<void> => {
  await run(supabase.rpc("delete_sale", { p_id: id }), "Failed to delete sale");
};

export const getSalesByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<(Sale & { id: number })[]> => {
  const rows = await fetchAll<SaleRow>(
    (from, to) =>
      supabase
        .from("sales")
        .select(SALE_COLUMNS)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    "Failed to load sales",
  );
  return rows.map(toSale);
};

export const getTotalSalesAmount = async (): Promise<number> => {
  const rows = await fetchAll<{ total: number }>(
    (from, to) => supabase.from("sales").select("total").order("id").range(from, to),
    "Failed to load sales",
  );
  return rows.reduce((sum, row) => sum + Number(row.total), 0);
};
