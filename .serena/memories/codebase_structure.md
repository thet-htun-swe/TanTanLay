# Codebase Structure

## Root Directory Structure
```
tantanlay/
├── app/                 # Expo Router screens (file-based routing)
├── assets/              # Static assets (images, fonts, etc.)
├── components/          # Reusable React components
├── constants/           # App constants and configurations
├── hooks/               # Custom React hooks
├── services/            # Data persistence and business logic
├── store/               # Zustand state management
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── scripts/             # Build and development scripts
```

## App Directory (Screens)
```
app/
├── (tabs)/             # Tab-based navigation screens
│   ├── index.tsx       # Home screen
│   ├── products.tsx    # Products list
│   ├── new-sale.tsx    # New sale creation
│   ├── sales.tsx       # Sales history
│   └── customers.tsx   # Customer management
├── product/            # Product management screens
├── sale/               # Individual sale screens
├── customer/           # Customer detail screens
└── _layout.tsx         # Root layout configuration
```

## Components Structure
```
components/
├── ui/                 # Generic UI components
│   ├── Button.tsx      # Custom button component
│   ├── Card.tsx        # Card wrapper component
│   ├── Input.tsx       # Form input component
│   └── CreatableSelect.tsx  # Advanced dropdown
├── common/             # Shared utility components
├── sales/              # Sales-specific components
├── products/           # Product-specific components
└── index.ts            # Barrel exports
```

## Key Data Models
- **Product**: `name`, `price`, `stockQty` with database persistence
- **Customer**: `name`, `contact`, `address` with relationship tracking
- **Sale**: Complete transaction with items, customer, totals
- **SaleItem**: Individual line items with product snapshot

## Services Layer
- **database.ts**: SQLite service with full CRUD operations
- **Centralized data access**: All database operations go through service layer
- **Transaction support**: Ensures data consistency across operations