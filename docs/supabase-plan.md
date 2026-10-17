# Supabase Integration Plan (TanTanLay)

> **For Claude Code:** this file is the hand-off from a planning conversation with the owner
> (Thet Htun Swe). All decisions below are confirmed by the owner. Follow the phases in order,
> stop at the end of each phase for the owner to check, and ask before changing any decision.
> Last updated: 2026-10-17.

## 1. Goal

Move all shop data (products, customers, sales) from the phone's local SQLite database to
Supabase, add login with two roles (admin, staff), and make stock/sales update live across
phones. Printer settings stay on each phone.

## 2. Background (why things are the way they are)

- **Blocked domain.** In the shop's country, internet providers have blocked `*.supabase.co`
  at times. A **Cloudflare Worker reverse proxy** (free plan, on a `*.workers.dev` address) was
  set up in front of Supabase. Users tested both the proxy and the direct Supabase URL from
  their networks: **both work**. The app uses the **proxy URL by default**; switching to direct is
  a one-line `.env` change.
- **Worker code** (already deployed by the owner; not part of this repo). It forwards every
  request (REST, Auth, Realtime WebSockets) to Supabase, and serves `/ping` for testing:

  ```js
  export default {
    async fetch(req, env) {
      const url = new URL(req.url);
      if (url.pathname === "/ping") {
        const r = await fetch(`https://${env.SUPABASE_HOST}/auth/v1/health`);
        return new Response(`proxy ok, supabase status: ${r.status}`);
      }
      url.hostname = env.SUPABASE_HOST;
      return fetch(new Request(url, req));
    }
  };
  ```
- **Supabase project:** region Singapore, free plan. Project URL:
  `https://zulteqlxedmtabdnivxi.supabase.co`. Ask the owner for the Worker URL
  (`https://<name>.<subdomain>.workers.dev`) when creating `.env`.
- **The app is not in real use yet.** No existing data needs to be moved. Supabase starts empty.
- **Working copy:** this folder (`D:\weekend projects\tantanlay`). An older Linux copy is retired.
- **Note:** `CLAUDE.md` says Expo 53 / RN 0.79, but `package.json` is now Expo ~57 / RN ~0.86.
  Trust `package.json`. Update `CLAUDE.md` in Phase 7.

## 3. Confirmed decisions

| Topic | Decision |
| --- | --- |
| Data storage | Supabase only for products, customers, sales. **No local SQLite copy.** |
| Offline | **Online-only.** Without internet, show a clear "no connection" message; sales cannot be saved. (View-only offline may be added later; don't build it now.) |
| Printer settings | Stay on each phone. Move from SQLite to AsyncStorage. |
| Connection | URL from `.env`; proxy by default. |
| Login | Email + password, one account per person. Roles: `admin`, `staff`. |
| Shops | One shop only (no multi-tenant columns). |
| Stock safety | Stock checked and changed **on the server** inside one transaction (Postgres functions). |
| Retries | Each sale carries a client-generated UUID (`client_id`); the server ignores a repeat, so a retried sale is saved once. |
| Live updates | Supabase Realtime on `products` and `sales` (and `customers`). |
| Dangerous actions | Remove "Clear all data" and "Recreate tables" (they would wipe the shared DB). |

## 4. Security (Phase 0, do first)

- `supabase.md` in the project root contains the **database password** in plain text and is
  **not** in `.gitignore`. The owner will reset the DB password and delete the file.
  Do **not** copy its password anywhere. Do **not** commit it. If it was ever committed, tell the owner.
- The app needs only two values, in `.env` (git-ignored):

  ```
  EXPO_PUBLIC_SUPABASE_URL=https://<worker>.workers.dev
  EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
  ```

  Expo only exposes `EXPO_PUBLIC_*` variables (the `NEXT_PUBLIC_*` names in `supabase.md` are wrong
  for Expo). Add `.env` and `.env*` to `.gitignore`; add a committed `.env.example` with placeholders.
- Never put the `service_role` / secret key or DB password in the app or repo.

## 5. Current code (what exists today)

- `services/database.ts`: `DatabaseService` class over `expo-sqlite`, plus exported functions
  (`getProducts`, `searchProducts`, `saveProduct`, `updateProduct`, `deleteProduct`, `saveSale`,
  `getSales`, `getSaleById`, `updateSale`, `deleteSale`, `getCustomers`, `searchCustomers`,
  `saveCustomer`, `updateCustomer`, `deleteCustomer`, `getSalesByDateRange`,
  `getTotalSalesAmount`, `getLowStockProducts`, `getPrinterSettings`, `savePrinterSettings`).
- Invoice number format: `YYMMDD` + 3-digit counter per order date (e.g. `251017001`),
  generated from `order_date`.
- Custom (non-inventory) items use `productId = "custom-<uuid>"` (string) and never change
  stock; inventory items have numeric `productId`. Stock logic checks `typeof productId === "number"`.
- `getSales()` does one query per sale for items (N+1).
- `updateSale` changes customer, totals and items, but **not** `date` / `order_date`.
- `store/index.ts` (Zustand) calls the service and re-fetches after writes.
- Files importing `services/database` directly (must switch to the new API):
  - `store/index.ts`
  - `app/(tabs)/products.tsx` (`searchProducts`)
  - `app/(tabs)/customers.tsx` (`searchCustomers`)
  - `app/(tabs)/sales.tsx` (`getPrinterSettings`)
  - `app/sale/[id].tsx` (`getSaleById`)
  - `app/edit-sale/[id].tsx` (`getSaleById`)
  - `app/printer-settings.tsx` (`getPrinterSettings`, `savePrinterSettings`)
  - `app/customer/create/index.tsx` (`databaseService.saveCustomer`)
  - `app/customer/[id]/edit.tsx` (`databaseService.getCustomers`, `updateCustomer`)
  - `components/CustomerDetailsBottomSheet.tsx` (`deleteCustomer`)
  - `components/sales/CustomerSelector.tsx` (`saveCustomer`)
  - `components/sales/CustomerForm.tsx` (`searchCustomers`)
- `components/ui/ClearDataButton.tsx` uses the store's `clearAllData`.

## 6. Database design (Supabase / Postgres)

Mirror the SQLite tables so the TS types (`Product`, `Customer`, `Sale`, `SaleItem`) keep their
shape. IDs stay numeric (`bigint generated always as identity`). Money uses `numeric(12,2)`.

| Table | Columns | Notes |
| --- | --- | --- |
| `profiles` (new) | `id uuid pk references auth.users on delete cascade`, `full_name text`, `role text check (role in ('admin','staff')) default 'staff'`, `created_at` | Auto-create a row on signup via trigger on `auth.users`. |
| `products` | `id`, `name`, `price numeric(12,2)`, `stock_qty int check (stock_qty >= 0)`, `created_at`, `updated_at`, `updated_by uuid` | `updated_at` trigger. Index on `name`. |
| `customers` | `id`, `name`, `contact`, `address`, `created_at`, `updated_at` | Keep find-or-create by name + contact. Index on `name`. |
| `sales` | `id`, `client_id uuid unique` (new), `invoice_number text unique`, `customer_id fk`, `customer_name`, `customer_contact`, `customer_address`, `subtotal`, `total`, `date timestamptz`, `order_date timestamptz`, `created_at`, `created_by uuid` | Index on `date`. |
| `sale_items` | `id`, `sale_id fk on delete cascade`, `product_id bigint null references products on delete set null`, `custom_key text null`, `product_name`, `quantity int > 0`, `unit_price`, `line_total` | Inventory item → `product_id` set; custom item → `product_id` null, `custom_key` = the `custom-<uuid>` string. |
| `invoice_counters` (new) | `day date pk`, `last_number int` | Race-free invoice numbers. |

Mapping in the app: `SaleItem.productId` = `product_id` (number) or `custom_key` (string), so
UI code that checks `typeof productId === "number"` keeps working.

### Row Level Security (enable on every table)

Helper: `is_admin()` (security definer) → `exists(select 1 from profiles where id = auth.uid() and role = 'admin')`.

| Table | select | insert | update | delete |
| --- | --- | --- | --- | --- |
| profiles | own row; admin all | trigger only | admin | — |
| products | authenticated | admin | admin | admin |
| customers | authenticated | authenticated | authenticated | admin |
| sales, sale_items | authenticated | via RPC only | via RPC only | via RPC only |
| invoice_counters | — | via RPC only | via RPC only | — |

### Server functions (call with `supabase.rpc`)

All `security definer`, `set search_path = public`, check `auth.uid()` is not null, run as one
transaction, raise clear errors (e.g. `Not enough stock for <name>`).

- `create_sale(p_sale jsonb) returns table(id bigint, invoice_number text)` — admin and staff.
  1. If a sale with `p_sale->>'client_id'` exists, return it (idempotent retry).
  2. Lock inventory products in the sale (`select ... for update`), check stock.
  3. Find or create the customer (name + contact).
  4. Get the next invoice number from `invoice_counters` for `order_date`'s day (upsert + increment; format `YYMMDD` + 3 digits).
  5. Insert sale (`created_by = auth.uid()`), insert items, decrement stock.
- `update_sale(p_id bigint, p_sale jsonb)` — admin only. Restore old items' stock, lock and
  check new items' stock, update customer + totals, replace items, decrement stock.
  (Dates unchanged, same as today.)
- `delete_sale(p_id bigint)` — admin only. Restore stock for inventory items, delete sale (items cascade).

### Realtime

`alter publication supabase_realtime add table products, sales, customers;`

## 7. Roles (confirmed by owner)

| Action | Admin | Staff |
| --- | --- | --- |
| View products and stock | Yes | Yes |
| Add, edit, delete products; change prices or stock | Yes | No |
| View, add, edit customers | Yes | Yes |
| Delete customers | Yes | No |
| Create a sale (incl. custom items) | Yes | Yes |
| View sales history and invoices; print | Yes | Yes |
| Edit or delete a sale | Yes | No |
| Export sales to Excel | Yes | No |
| Clear all data | Removed | No |
| Create staff accounts | Yes, in Supabase dashboard (no in-app screen for now) | No |

Enforce in the database (RLS + function checks) **and** hide the buttons in the UI.

## 8. App changes

| File | Change |
| --- | --- |
| `lib/supabase.ts` (new) | `createClient` with `.env` URL/key; AsyncStorage session storage; `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`; start/stop auto-refresh on `AppState` changes (Supabase Expo guide). Import `react-native-url-polyfill/auto`. |
| `services/api.ts` (new) | Same exported function names/signatures as `services/database.ts` for products, customers, sales, implemented with Supabase. Sales loaded with items in one query (`select('*, sale_items(*)')`). Map snake_case ↔ camelCase. Map network failures to a friendly "No internet connection" error. |
| `services/localSettings.ts` (new) | `getPrinterSettings` / `savePrinterSettings` on AsyncStorage (same types and validation as today). |
| `services/database.ts` | Delete at the end (Phase 7) and remove `expo-sqlite`. |
| `store/index.ts` | Use `api.ts`; add `session`, `profile` (role), `signIn`, `signOut`; subscribe to realtime changes after login (refetch or patch products/sales); remove `clearAllData` / `recreateTables`. |
| `app/_layout.tsx` | Replace DB init with session check; show login screen when signed out. |
| `app/login.tsx` (new) | Email + password login, error messages, follows existing theme (`useColorScheme`, `components/ui`). |
| Products screens (`app/(tabs)/products.tsx`, `app/product/create`, `app/product/[id]`) | Add/edit/delete only for admin. |
| Sales screens (`app/(tabs)/sales.tsx`, `app/sale/[id].tsx`, `app/edit-sale/[id].tsx`) | Edit/delete/export only for admin; printer settings from `localSettings`. |
| Customer files (see §5 list) | Switch imports to `api.ts`; delete only for admin. |
| `app/printer-settings.tsx` | Use `localSettings`; add **Log out** button and show signed-in name/role. |
| `components/ui/ClearDataButton.tsx` | Remove (and its usages). |
| `.env`, `.env.example`, `.gitignore` | See §4. |

New packages (install with `npx expo install`): `@supabase/supabase-js`,
`@react-native-async-storage/async-storage`, `react-native-url-polyfill`.

## 9. Phases

Work on a new git branch (e.g. `feature/supabase`). Commit at the end of each phase and stop
for the owner to check. Follow the repo's `CLAUDE.md` rules (GitNexus impact analysis before
editing symbols, change detection before commits).

| # | Phase | Claude Code does | Owner does | Done when |
| --- | --- | --- | --- | --- |
| 0 | Prepare | Branch; `.env.example`; `.gitignore` update; ask owner for Worker URL and fill `.env` | Reset DB password; delete `supabase.md` | Secret out of the repo; `.env` ignored |
| 1 | Database | Write `supabase/migrations/001_init.sql` (tables, triggers, RLS, `is_admin`, functions, realtime) | Paste into Supabase **SQL Editor** and Run; report errors | Tables visible in Table Editor |
| 2 | Login & roles | Install packages; `lib/supabase.ts`; login screen; session gate; role in store | Create own account in Supabase Auth, set `role = 'admin'` in `profiles`; create one test staff account | Owner can log in as admin and staff |
| 3 | Data layer | `services/api.ts`, `services/localSettings.ts`, store update | — | App shows Supabase data; sales save via `create_sale` |
| 4 | Screens & roles | Switch all imports; hide admin-only actions; no-connection messages; remove ClearDataButton | — | Staff can't see edit/delete/export |
| 5 | Live updates | Realtime subscriptions in store; unsubscribe on logout | — | Sale on phone A updates stock on phone B |
| 6 | Move existing data | **Skipped** (app not in real use) | Enter starting products as admin | Products ready |
| 7 | Test & release | Remove `services/database.ts` + `expo-sqlite`; lint/type-check; update `CLAUDE.md` | Run testing checklist; build APK with EAS | Staff phones on new version |

## 10. Testing checklist

- [ ] Log in as admin and as staff; wrong password shows an error
- [ ] Staff cannot see or use edit/delete for products and sales, or export
- [ ] Create a sale: stock goes down; invoice number `YYMMDD001`, next `YYMMDD002`
- [ ] Sale with a custom item: saves; stock unchanged
- [ ] Selling more than stock shows "Not enough stock" and saves nothing
- [ ] Two phones sell the last item at the same time: one succeeds, one gets the stock error
- [ ] Phone A adds a sale; phone B's stock and sales list update within a few seconds
- [ ] Admin edits a sale: stock adjusts correctly; admin deletes a sale: stock comes back
- [ ] Airplane mode: clear "no connection" message, no crash, nothing half-saved
- [ ] A sale retried after a network cut is saved only once
- [ ] Printing (Wi-Fi and Bluetooth) and Excel export still work
- [ ] Works through the proxy URL on the shop's mobile data

## 11. Out of scope for now

Offline mode; in-app staff management screen; multi-shop support; buying a custom domain for the
proxy (only needed if `workers.dev` gets blocked; then change the URL in `.env`).
