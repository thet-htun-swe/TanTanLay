import React, { useEffect, useState } from "react";
import { Dimensions, Alert, StyleSheet } from "react-native";
import { router } from "expo-router";

import { ThemedView } from "@/components/ThemedView";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { ActionButtons } from "@/components/common/ActionButtons";
import { SalesList } from "@/components/sales/SalesList";
import { useAppStore } from "@/store";
import { useSalesFilter } from "@/hooks/useSalesFilter";
import { ExportUtils } from "@/utils/exportUtils";

export default function SalesScreen() {
  const { sales, fetchSales } = useAppStore();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  const {
    filteredSales,
    searchQuery,
    startDate,
    endDate,
    dateRangeActive,
    updateSearchQuery,
    updateDateRange,
    applyDateFilter,
    clearDateFilter,
  } = useSalesFilter(sales);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);


  const handleExportExcel = async () => {
    try {
      await ExportUtils.generateExcel(filteredSales);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to export");
    }
  };

  const handleExportLabels = async () => {
    try {
      await ExportUtils.generateShippingLabels(filteredSales);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to generate labels");
    }
  };

  const handleApplyFilter = () => {
    applyDateFilter();
    setIsFilterSheetOpen(false);
  };

  const handleClearFilter = () => {
    clearDateFilter();
    setIsFilterSheetOpen(false);
  };

  const viewSaleDetails = (saleId: string) => {
    router.push(`/sale/${saleId}`);
  };

  const exportButtons = [
    { title: "Export", onPress: handleExportExcel, variant: "secondary" as const },
    { title: "Print Labels", onPress: handleExportLabels, variant: "secondary" as const },
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
        filterActive={dateRangeActive}
      />

      <ActionButtons 
        buttons={exportButtons}
        direction="row"
        spacing={8}
      />

      <SalesList
        sales={filteredSales}
        onSalePress={viewSaleDetails}
      />

      <BottomSheet
        isVisible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        height={Dimensions.get("window").height * 0.4}
      >
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(date) => updateDateRange(date, endDate)}
          onEndDateChange={(date) => updateDateRange(startDate, date)}
          onApply={handleApplyFilter}
          onClear={handleClearFilter}
          showClearButton={dateRangeActive}
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
