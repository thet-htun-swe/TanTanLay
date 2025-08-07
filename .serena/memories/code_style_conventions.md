# Code Style and Conventions

## TypeScript Configuration
- **Strict mode enabled** - All TypeScript strict checks are enforced
- **Path aliases**: `@/*` maps to project root for clean imports
- **JSX**: Uses react-jsx transform
- **Module resolution**: ES modules with synthetic default imports allowed

## File Organization Patterns
- **File-based routing**: Using Expo Router convention in `app/` directory
- **Component structure**: 
  - `components/ui/` - Reusable UI components
  - `components/common/` - Shared business logic components
  - `components/[domain]/` - Domain-specific components (sales, products)
- **Barrel exports**: Index files (`index.ts`) for clean component imports
- **Service layer**: All database operations in `services/` directory

## Naming Conventions
- **Files**: kebab-case for most files, PascalCase for React components
- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Interfaces**: PascalCase with descriptive names (e.g., `Product`, `SaleItem`)
- **Services**: camelCase with service suffix (e.g., `databaseService`)
- **Stores**: Descriptive names with "Store" suffix (e.g., `useAppStore`)

## Component Patterns
- **Themed components**: Use `useColorScheme` hook for light/dark theme support
- **Custom UI components**: Located in `components/ui/` with consistent API
- **Form handling**: React Hook Form with Yup validation schemas
- **State management**: Zustand store with database integration
- **Error handling**: Comprehensive validation with user-friendly alerts

## Database Patterns
- **Transaction safety**: Use database transactions for data integrity
- **Custom product IDs**: Format `custom-${uuid}` for non-inventory items
- **Foreign keys**: Properly defined relationships with referential integrity
- **Migration**: Automatic data migration from AsyncStorage to SQLite

## Linting and Code Quality
- **ESLint**: Uses expo/flat config with standard Expo rules
- **No custom formatting rules**: Relies on Expo's default configuration
- **Code quality**: Must pass `npm run lint` before committing