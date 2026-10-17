# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Supabase Backend (read first)

All shop data (products, customers, sales) lives in **Supabase**. The app is **online-only**: there is no local copy of shop data. Users log in with email + password and have a role, `admin` or `staff`. The decisions, database design and history of the move from SQLite are in `docs/supabase-plan.md`. Ask the owner before changing any decision listed there.

- **Never** put the database password or the `service_role` / secret key in the app or the repo. The app only needs the two `EXPO_PUBLIC_*` values in `.env` (git-ignored; see `.env.example`).
- `EXPO_PUBLIC_SUPABASE_URL` points to a **Cloudflare Worker reverse proxy** (`*.workers.dev`) because `*.supabase.co` is sometimes blocked in the shop's country. The Worker forwards REST, Auth and Realtime (WebSocket). To go direct, change only this URL.
- Database changes go in new files under `supabase/migrations/` (`001_init.sql` is the starting schema). The owner runs them in the Supabase SQL Editor.

## Development Commands

- **Start development server**: `npm start` or `npx expo start`
- **Run on Android**: `npm run android`
- **Run on iOS**: `npm run ios`
- **Run on web**: `npm run web`
- **Lint code**: `npm run lint`
- **Type-check**: `npx tsc --noEmit`
- **Reset project**: `npm run reset-project`

## Architecture Overview

### Core Structure
- **Framework**: Expo ~57 with React Native ~0.86, TypeScript, file-based routing via Expo Router
- **Backend**: Supabase (Postgres + Auth + Realtime), client in `lib/supabase.ts` (session saved in AsyncStorage, auto-refresh only while the app is active)
- **State Management**: Zustand store (`store/index.ts`): login session + profile (role), products, sales, realtime subscription
- **Data Access**: `services/api.ts` (all Supabase reads/writes, snake_case ↔ camelCase mapping, friendly errors)
- **Phone-only settings**: `services/localSettings.ts` (printer settings in AsyncStorage)
- **Navigation**: Login screen when signed out; otherwise tabs: Home, Products, New Sale, Sales History, Customers

### Data Models (`types/index.ts`)
- **Product**: `id`, `name`, `price`, `stockQty`
- **Customer**: `name`, `contact`, `address`
- **SaleItem**: `productId` (number = inventory product, `"custom-<uuid>"` string = custom item), `productName`, `quantity`, `unitPrice`, `lineTotal`
- **Sale**: `id`, `invoiceNumber`, `date`, `orderDate`, `customer`, `items[]`, `subtotal`, `total`
- **Profile**: `id`, `fullName`, `role` (`admin` | `staff`)

### Database (Supabase, `supabase/migrations/001_init.sql`)
- **profiles**: one row per login (created by a trigger on `auth.users`), `role` defaults to `staff`
- **products**: `id`, `name`, `price numeric(12,2)`, `stock_qty int >= 0`, timestamps, `updated_by`
- **customers**: `id`, `name`, `contact`, `address`, timestamps
- **sales**: `id`, `client_id uuid unique`, `invoice_number unique`, `customer_id` (set null on customer delete), customer snapshot, `subtotal`, `total`, `date`, `order_date`, `created_by`, `created_by_name` (seller's profile name copied at sale time by `create_sale`, migration `002`; staff cannot read other profiles, so the name lives on the sale)
- **sale_items**: `sale_id` (cascade), `product_id` (null for custom items or deleted products), `custom_key` (`custom-<uuid>`), product name snapshot, `quantity`, `unit_price`, `line_total`, `discount`, `discount_type` (`amount`/`percent`), `discount_value` (migration `003`)
- **invoice_counters**: per-day counter for invoice numbers
- **Row Level Security** on every table. Helper `is_admin()`.

### Key Business Logic
- **Sales are written only through server functions** (`supabase.rpc`): `create_sale`, `update_sale` (admin), `delete_sale` (admin). They lock the products, check stock, change stock and write the sale in one transaction, and raise clear errors such as `Not enough stock for <name>`.
- **Retries are safe**: each sale carries a phone-made `client_id`; `create_sale` returns the existing sale for a repeated `client_id`. The New Sale screen keeps one id per sale form, and `saveSale` retries network failures with the same id.
- **Invoice numbers**: `YYMMDD` + 3-digit counter per order day, made on the server from the phone's local day (`order_day`).
- **Custom products**: `custom-<uuid>` items never change stock.
- **Customers**: `create_sale` finds or creates a customer by name + contact.
- **Updating a sale** changes customer, totals and items, not the dates or invoice number.
- **Discounts** (admin and staff): per item, on the whole line, as an amount or a percentage. `lineTotal = quantity * unitPrice - discount`; sale `subtotal` = before discounts, `total` = after. All maths in `utils/saleMath.ts` (checked by `scripts/verify-sale-math.ts`); the server rejects a discount above the line price. Receipt shows each discount and Subtotal/Discount/TOTAL.

### Roles (enforced in the database AND hidden in the UI)
- **Staff**: view everything, create sales (incl. custom items), add/edit customers, print.
- **Admin only**: add/edit/delete products, edit/delete sales, delete customers, Excel export. Use `useIsAdmin()` from the store to hide these actions; admin-only routes are wrapped in `Stack.Protected guard={isAdmin}` in `app/_layout.tsx`.
- **Staff accounts** (admin only): Settings > Staff accounts (`app/settings/users/`) lists, adds, renames, changes role, sets a new password and disables/enables accounts (no delete; disabled = banned, sales history kept). It calls the Edge Function `supabase/functions/manage-users` (`services/users.ts`), which uses the service_role key that Supabase provides to the function and checks the caller is an admin. You cannot disable yourself or remove your own admin role. The function is deployed from the Supabase dashboard (Edge Functions), not built with the app; `supabase/functions` is excluded from the app's tsconfig and eslint.

### Live Updates
- After login the store subscribes to Realtime changes on `products`, `sales` and `customers` (`startRealtime`), and unsubscribes on logout (`stopRealtime`).
- Product changes patch `products`; sale changes reload that sale (`getSaleById`) and patch `sales`.
- Screens with their own paged lists (Products, Customers tabs) watch `productsVersion` / `customersVersion` and reload quietly.
- After a reconnect, everything is reloaded once to catch missed changes.

### Errors and Offline
- `services/api.ts` turns network failures into `NoConnectionError` ("No internet connection…"); use `getErrorMessage(error, fallback)` and `isNoConnectionError(error)` in screens.
- `components/common/ErrorBanner.tsx` shows load errors with a Retry button.
- After a successful save, a failed list refresh must not be reported as a failed save (`refreshData` never throws).

### UI Components Architecture
- **Theme System**: Uses `@/hooks/useColorScheme` with light/dark theme support (`constants/Colors.ts`)
- **Custom Components**: Located in `components/ui/` (Button, Card, Input, CreatableSelect, BottomSheet)
- **Common Components**: `components/common/` (ScreenHeader, SearchBar, ActionButtons, ErrorBanner, date pickers)

### Key Features & Implementation
- **New Sale Flow**: Customer info → Product selection (with search/create) → Quantity adjustment → Sale creation via `create_sale`
- **Receipts**: one source of rows, `receiptLines()` in `utils/escPos.ts` (shop name `SHOP_NAME` = "KHA"), used by the printer, the on-screen receipt (`components/sales/ReceiptView.tsx`, used for the print preview and the shared image) and the text preview. There is no PDF invoice.
- **Home dashboard** (`components/home/SalesDashboard.tsx`): Daily / Monthly total sales (hero number, change vs previous period, sales / items / discounts) and a 7-day or 6-month column chart (tap a column to select). Sales count on their order date, phone's local time. Maths in `utils/salesStats.ts` (checked by `scripts/verify-sales-stats.ts`). Bar colour token `Colors.*.chart` (validated with the dataviz palette script).
- **Sale Details** (`app/sale/[id].tsx`, `components/sales/SaleDetailsView.tsx`): shop view with **Created by** (not on the customer receipt). The receipt for sharing is rendered off-screen. Excel export also has a **Created By** column.
- **Share receipt as image**: `services/receiptImage.ts` captures `ReceiptView` with `react-native-view-shot` and opens the share sheet (`expo-sharing`)
- **Receipt Printing**: Wi-Fi (`services/thermalPrinter.ts`) and Bluetooth (`services/bluetoothPrinter.ts`) ESC/POS printers; printer chosen per phone in `app/settings/printer.tsx` (Settings > Printer & receipt, also opened from the printer icon on Sales History)
- **Myanmar text on paper**: the printer font is ASCII only, so non-ASCII lines are drawn as pictures (GS v 0) by a hidden WebView (`components/ReceiptTextRenderer.tsx`, `services/textRaster.ts`) using the phone's fonts. Check with `scripts/verify-esc-pos.ts`.
- **Settings screen** (`app/settings/index.tsx`, gear icon on Home): account (name, role, **Log out**), link to Printer & receipt, app version.
- **Receipt width** (per phone, Printer & receipt): "Standard" (default, 32 characters / 384 dots) works on every printer: each row is padded to exactly 32 characters and printed centred, so on 80 mm paper it is a centred column. "80 mm full width" (48 characters / 576 dots) is optional and must not be used on 58 mm printers.
- **Bluetooth printing** sends data in small chunks and waits before disconnecting; cheap printers (e.g. BRINT BP06) otherwise lose the end of the receipt.
- **Excel Export / Shipping Labels**: `utils/exportUtils.ts` (Excel export is admin only)

### File Organization
- `app/` - Screens (Expo Router), incl. `login.tsx`
- `components/` - Reusable UI components
- `lib/supabase.ts` - Supabase client
- `services/` - `api.ts` (Supabase data), `localSettings.ts` (phone settings), printer services
- `store/` - Zustand store
- `supabase/migrations/` - SQL to run in the Supabase SQL Editor
- `types/` - TypeScript interfaces
- `utils/` - UUID, ESC/POS, export helpers
- `docs/supabase-plan.md` - decisions and migration plan

### Important Patterns
- **Custom Product IDs**: Use `custom-${generateUUID()}` for non-inventory items
- **Form Reset**: Use `useFocusEffect` to reset forms when screens come into focus
- **Theme Consistency**: All components should use the `useColorScheme` hook
- **Web**: static web output pre-renders in Node; `lib/supabase.ts` gives Realtime a stand-in WebSocket there

### EAS Build & Deployment
- Configured for Android APK builds (preview/production profiles, build number auto-increment)
- Package name: `com.thethtun.clothingsales` (see `app.json`)
- `.env` values are read at build time; make sure they are available to EAS builds (e.g. EAS environment variables)
