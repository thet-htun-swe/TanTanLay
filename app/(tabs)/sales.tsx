import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Dimensions, StyleSheet } from "react-native";

import { ActionButtons } from "@/components/common/ActionButtons";
import { SalesHistoryFilter } from "@/components/common/SalesHistoryFilter";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { SalesList } from "@/components/sales/SalesList";
import { ThemedView } from "@/components/ThemedView";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useSalesFilter } from "@/hooks/useSalesFilter";
import { useAppStore } from "@/store";
import { ExportUtils } from "@/utils/exportUtils";

export default function SalesScreen() {
  const { sales, fetchSales } = useAppStore();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const {
    filteredSales,
    searchQuery,
    orderStartDate,
    orderEndDate,
    orderDateRangeActive,
    createdStartDate,
    createdEndDate,
    createdDateRangeActive,
    sortOrder,
    hasActiveFilters,
    updateSearchQuery,
    updateOrderDateRange,
    updateCreatedDateRange,
    updateSortOrder,
    applyOrderDateFilter,
    applyCreatedDateFilter,
    clearAllFilters,
  } = useSalesFilter(sales);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleExportExcel = async () => {
    try {
      await ExportUtils.generateExcel(filteredSales);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to export"
      );
    }
  };

  const handleExportLabels = async () => {
    try {
      await ExportUtils.generateShippingLabels(filteredSales);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to generate labels"
      );
    }
  };

  const viewSaleDetails = (saleId: number) => {
    router.push(`/sale/${saleId}`);
  };

  const exportButtons = [
    {
      title: "Export",
      onPress: handleExportExcel,
      variant: "secondary" as const,
    },
    {
      title: "Print Labels",
      onPress: handleExportLabels,
      variant: "secondary" as const,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Sales History" />

      <SearchBar
        value={searchQuery}
        onChangeText={updateSearchQuery}
        placeholder="Search by customer name or contact"
        showFilterButton={true}
        onFilterPress={() => setIsFilterSheetOpen(true)}
        filterActive={hasActiveFilters}
      />

      <ActionButtons buttons={exportButtons} direction="row" spacing={8} />

      <SalesList sales={filteredSales} onSalePress={viewSaleDetails} />

      <BottomSheet
        isVisible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        height={Dimensions.get("window").height * 0.6}
        expandable={true}
        scrollable={true}
      >
        <SalesHistoryFilter
          orderStartDate={orderStartDate}
          orderEndDate={orderEndDate}
          orderDateRangeActive={orderDateRangeActive}
          onOrderStartDateChange={(date) =>
            updateOrderDateRange(date, orderEndDate)
          }
          onOrderEndDateChange={(date) =>
            updateOrderDateRange(orderStartDate, date)
          }
          createdStartDate={createdStartDate}
          createdEndDate={createdEndDate}
          createdDateRangeActive={createdDateRangeActive}
          onCreatedStartDateChange={(date) =>
            updateCreatedDateRange(date, createdEndDate)
          }
          onCreatedEndDateChange={(date) =>
            updateCreatedDateRange(createdStartDate, date)
          }
          sortOrder={sortOrder}
          onSortOrderChange={updateSortOrder}
          onApplyFilters={() => {
            applyOrderDateFilter();
            applyCreatedDateFilter();
          }}
          onClearAllFilters={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </BottomSheet>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
