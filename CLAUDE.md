# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm start` or `npx expo start`
- **Run on Android**: `npm run android`  
- **Run on iOS**: `npm run ios`
- **Run on web**: `npm run web`
- **Lint code**: `npm run lint`
- **Reset project**: `npm run reset-project`

## Architecture Overview

### Core Structure
- **Framework**: Expo 53 with React Native 0.79.2, TypeScript, file-based routing via Expo Router
- **State Management**: Zustand store (`store/index.ts`) with centralized product/sales actions
- **Data Storage**: SQLite database via `expo-sqlite` with service layer (`services/database.ts`) providing full CRUD operations and relational data support
- **Migration**: Automatic migration from AsyncStorage to SQLite on first app launch (`services/migration.ts`)
- **Navigation**: Tab-based navigation with 4 main screens: Home, Products, New Sale, Sales History

### Data Models (`types/index.ts`)
- **Product**: `id`, `name`, `price`, `stockQty`
- **Customer**: `name`, `contact`, `address` 
- **SaleItem**: `productId`, `productName`, `quantity`, `unitPrice`, `lineTotal`
- **Sale**: `id`, `date`, `customer`, `items[]`, `subtotal`, `total`

### Database Schema
- **products**: `id` (PRIMARY KEY), `name`, `price`, `stock_qty`, timestamps
- **customers**: `id` (AUTO INCREMENT), `name`, `contact`, `address`, timestamps  
- **sales**: `id` (PRIMARY KEY), `customer_id` (FK), customer info snapshot, `subtotal`, `total`, `date`
- **sale_items**: `id` (AUTO INCREMENT), `sale_id` (FK), `product_id`, product info snapshot, `quantity`, `unit_price`, `line_total`

### Key Business Logic
- **Inventory Management**: Stock quantities automatically decrement when sales are processed using database transactions
- **Custom Products**: Sales can include custom products (not in inventory) with `custom-${uuid}` IDs - these don't affect inventory
- **Stock Validation**: Prevents overselling by checking inventory levels before sale creation
- **Data Integrity**: Uses SQLite foreign keys, indexes, and transactions for data consistency
- **Customer Management**: Automatic customer creation/lookup with relationship tracking

### UI Components Architecture
- **Theme System**: Uses `@/hooks/useColorScheme` with light/dark theme support
- **Custom Components**: Located in `components/ui/` (Button, Card, Input, CreatableSelect)
- **CreatableSelect**: Advanced dropdown component supporting search and custom option creation (`components/ui/CreatableSelect.tsx`)

### Key Features & Implementation
- **New Sale Flow**: 
  - Customer info collection → Product selection (with search/create) → Quantity adjustment → Sale creation
  - Supports both inventory products and custom products with price input
  - Real-time calculations and stock validation
- **PDF Invoice Generation**: Uses `expo-print` to generate HTML-based PDF invoices (`app/sale/[id].tsx:58-184`)
- **Product Management**: Full CRUD with floating action button pattern

### File Organization
- `app/` - Screen components using Expo Router file-based routing
- `components/` - Reusable UI components, themed components
- `services/` - Data persistence layer:
  - `database.ts` - SQLite database service with full CRUD operations
  - `migration.ts` - AsyncStorage to SQLite migration service
  - `storage.ts` - Legacy AsyncStorage service (deprecated)
- `store/` - Zustand state management with database integration
- `types/` - TypeScript interfaces and types
- `utils/` - Utility functions (UUID generation)

### Important Patterns
- **Database Initialization**: App automatically initializes SQLite database and migrates existing AsyncStorage data on first launch
- **Stock Updates**: Inventory updates are handled via database transactions in `databaseService.saveSale()`
- **Custom Product IDs**: Use `custom-${generateUUID()}` pattern for non-inventory items (these don't affect stock)
- **Error Handling**: Comprehensive validation with user-friendly alerts and database transaction rollbacks
- **Form Reset**: Use `useFocusEffect` to reset forms when screens come into focus
- **Theme Consistency**: All components should use `useColorScheme` hook for theming
- **Data Migration**: Existing AsyncStorage data is automatically migrated to SQLite - no data loss

### EAS Build & Deployment
- Configured for Android APK builds (preview/production channels)
- App version 1.0.1 with auto-increment enabled
- Package name: `com.thethtun.tantanlay`