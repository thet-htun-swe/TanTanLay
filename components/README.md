# Components Documentation

This directory contains clean, reusable components organized by domain and functionality.

## Directory Structure

```
components/
├── common/           # Shared UI components
├── sales/           # Sales-specific components
├── products/        # Product-specific components
├── ui/              # Base UI components (Button, Card, Input, etc.)
├── ThemedText.tsx   # Theme-aware text component
└── ThemedView.tsx   # Theme-aware view component
```

## Usage Examples

### Common Components

#### SearchBar
```tsx
import { SearchBar } from '@/components/common';

<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search products..."
  showFilterButton={true}
  onFilterPress={() => setShowFilter(true)}
  filterActive={isFilterActive}
/>
```

#### DateRangeFilter
```tsx
import { DateRangeFilter } from '@/components/common';

<DateRangeFilter
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
  onApply={handleApplyFilter}
  onClear={handleClearFilter}
  showClearButton={true}
/>
```

#### ActionButtons
```tsx
import { ActionButtons } from '@/components/common';

const buttons = [
  { title: "Export", onPress: handleExport, variant: "secondary" },
  { title: "Delete", onPress: handleDelete, variant: "danger" },
];

<ActionButtons buttons={buttons} direction="row" spacing={8} />
```

### Sales Components

#### SalesList
```tsx
import { SalesList } from '@/components/sales';

<SalesList
  sales={salesData}
  onSalePress={viewSaleDetails}
  emptyMessage="No sales found"
/>
```

#### CustomerForm
```tsx
import { CustomerForm } from '@/components/sales';

<CustomerForm
  name={customerName}
  contact={customerContact}
  address={customerAddress}
  onNameChange={setCustomerName}
  onContactChange={setCustomerContact}
  onAddressChange={setCustomerAddress}
/>
```

#### ProductSelector
```tsx
import { ProductSelector } from '@/components/sales';

<ProductSelector
  products={availableProducts}
  onAddItem={addProductToSale}
/>
```

### Products Components

#### ProductsList
```tsx
import { ProductsList } from '@/components/products';

<ProductsList
  products={productsData}
  onEditProduct={handleEditProduct}
  onDeleteProduct={handleDeleteProduct}
  emptyMessage="No products available"
/>
```

## Design Principles

### 1. Single Responsibility
Each component has a single, well-defined purpose.

### 2. Composition over Inheritance
Components are designed to work together through composition.

### 3. Consistent Styling
All components follow consistent styling patterns and use theme-aware colors.

### 4. Prop Interfaces
Every component has well-defined TypeScript interfaces for props.

### 5. Reusability
Components are designed to be reusable across different screens and contexts.

## Best Practices

### Component Structure
```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ComponentProps {
  // Define all props with types
}

export const Component: React.FC<ComponentProps> = ({
  // Destructure props
}) => {
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles here
  },
});
```

### Naming Conventions
- Component files: PascalCase (e.g., `SearchBar.tsx`)
- Component names: PascalCase (e.g., `SearchBar`)
- Props interfaces: PascalCase with Props suffix (e.g., `SearchBarProps`)
- Style objects: camelCase (e.g., `styles.container`)

### State Management
- Keep component state minimal
- Use custom hooks for complex state logic
- Pass data down through props, events up through callbacks

### Performance
- Use React.memo for components that receive stable props
- Avoid inline styles and functions in render
- Use StyleSheet.create for better performance