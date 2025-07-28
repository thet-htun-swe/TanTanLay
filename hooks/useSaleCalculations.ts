import { useMemo } from 'react';
import { SaleItem } from '@/types';

export const useSaleCalculations = (items: SaleItem[]) => {
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal; // Add tax calculation here if needed

    return {
      subtotal,
      total,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items]);

  return calculations;
};