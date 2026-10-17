import { useMemo } from 'react';
import { SaleItem } from '@/types';
import { saleTotals } from '@/utils/saleMath';

export const useSaleCalculations = (items: SaleItem[]) => {
  const calculations = useMemo(() => {
    // subtotal = before discounts, total = after discounts
    const { subtotal, total, discountTotal } = saleTotals(items);

    return {
      subtotal,
      total,
      discountTotal,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items]);

  return calculations;
};