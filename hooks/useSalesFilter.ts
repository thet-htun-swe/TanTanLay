import { useState, useEffect, useMemo } from 'react';
import { Sale } from '@/types';

interface FilterState {
  searchQuery: string;
  startDate: Date;
  endDate: Date;
  dateRangeActive: boolean;
}

export const useSalesFilter = (sales: Sale[]) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    dateRangeActive: false,
  });

  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    // Apply date range filter if active
    if (filters.dateRangeActive) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= filters.startDate && saleDate <= filters.endDate;
      });
    }

    // Apply search query filter
    if (filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sale) =>
          sale.customer.name.toLowerCase().includes(query) ||
          sale.customer.contact.toLowerCase().includes(query)
      );
    }

    // Sort by date with latest at the top
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return filtered;
  }, [sales, filters]);

  const updateSearchQuery = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const updateDateRange = (startDate: Date, endDate: Date) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const applyDateFilter = () => {
    setFilters(prev => ({ ...prev, dateRangeActive: true }));
  };

  const clearDateFilter = () => {
    setFilters(prev => ({ ...prev, dateRangeActive: false }));
  };

  return {
    filteredSales,
    searchQuery: filters.searchQuery,
    startDate: filters.startDate,
    endDate: filters.endDate,
    dateRangeActive: filters.dateRangeActive,
    updateSearchQuery,
    updateDateRange,
    applyDateFilter,
    clearDateFilter,
  };
};