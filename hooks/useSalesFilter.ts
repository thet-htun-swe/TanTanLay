import { useState, useEffect, useMemo } from 'react';
import { Sale } from '@/types';
import { SortOrder } from '@/components/common/SalesHistoryFilter';

interface FilterState {
  searchQuery: string;
  // Order date filter
  orderStartDate: Date;
  orderEndDate: Date;
  orderDateRangeActive: boolean;
  // Created date filter
  createdStartDate: Date;
  createdEndDate: Date;
  createdDateRangeActive: boolean;
  // Sort order
  sortOrder: SortOrder;
}

export const useSalesFilter = (sales: (Sale & { id: number })[]) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    // Order date filter - default to last 30 days
    orderStartDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    orderEndDate: new Date(),
    orderDateRangeActive: false,
    // Created date filter - default to last 30 days
    createdStartDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    createdEndDate: new Date(),
    createdDateRangeActive: false,
    // Sort order - default to newest first
    sortOrder: 'desc',
  });

  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    // Apply order date range filter if active
    if (filters.orderDateRangeActive) {
      filtered = filtered.filter((sale) => {
        const orderDate = new Date(sale.orderDate);
        return orderDate >= filters.orderStartDate && orderDate <= filters.orderEndDate;
      });
    }

    // Apply created date range filter if active
    if (filters.createdDateRangeActive) {
      filtered = filtered.filter((sale) => {
        const createdDate = new Date(sale.date);
        return createdDate >= filters.createdStartDate && createdDate <= filters.createdEndDate;
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

    // Sort by date based on sort order
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [sales, filters]);

  const updateSearchQuery = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const updateOrderDateRange = (startDate: Date, endDate: Date) => {
    setFilters(prev => ({ ...prev, orderStartDate: startDate, orderEndDate: endDate }));
  };

  const updateCreatedDateRange = (startDate: Date, endDate: Date) => {
    setFilters(prev => ({ ...prev, createdStartDate: startDate, createdEndDate: endDate }));
  };

  const updateSortOrder = (sortOrder: SortOrder) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  };

  const applyOrderDateFilter = () => {
    setFilters(prev => ({ ...prev, orderDateRangeActive: true }));
  };

  const clearOrderDateFilter = () => {
    setFilters(prev => ({ ...prev, orderDateRangeActive: false }));
  };

  const applyCreatedDateFilter = () => {
    setFilters(prev => ({ ...prev, createdDateRangeActive: true }));
  };

  const clearCreatedDateFilter = () => {
    setFilters(prev => ({ ...prev, createdDateRangeActive: false }));
  };

  const clearAllFilters = () => {
    setFilters(prev => ({ 
      ...prev, 
      orderDateRangeActive: false,
      createdDateRangeActive: false 
    }));
  };

  const hasActiveFilters = filters.orderDateRangeActive || filters.createdDateRangeActive;

  return {
    filteredSales,
    searchQuery: filters.searchQuery,
    // Order date filter
    orderStartDate: filters.orderStartDate,
    orderEndDate: filters.orderEndDate,
    orderDateRangeActive: filters.orderDateRangeActive,
    // Created date filter
    createdStartDate: filters.createdStartDate,
    createdEndDate: filters.createdEndDate,
    createdDateRangeActive: filters.createdDateRangeActive,
    // Sort order
    sortOrder: filters.sortOrder,
    // Filter status
    hasActiveFilters,
    // Functions
    updateSearchQuery,
    updateOrderDateRange,
    updateCreatedDateRange,
    updateSortOrder,
    applyOrderDateFilter,
    clearOrderDateFilter,
    applyCreatedDateFilter,
    clearCreatedDateFilter,
    clearAllFilters,
  };
};;