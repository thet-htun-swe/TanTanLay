import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Dimensions, StyleSheet, Text, View } from "react-native";

import { ActionButtons } from "@/components/common/ActionButtons";
import { SalesHistoryFilter } from "@/components/common/SalesHistoryFilter";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { SalesList } from "@/components/sales/SalesList";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useSalesFilter } from "@/hooks/useSalesFilter";
import { printBluetoothSales } from "@/services/bluetoothPrinter";
import { getPrinterSettings } from "@/services/database";
import { printWifiSales } from "@/services/thermalPrinter";
import { useAppStore } from "@/store";
import { ExportUtils } from "@/utils/exportUtils";
import { getReceiptPreviewText } from "@/utils/escPos";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function SalesScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { sales, fetchSales } = useAppStore();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState<number[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

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

  const toggleSaleSelection = (saleId: number) => {
    setSelectedSaleIds((ids) =>
      ids.includes(saleId) ? ids.filter((id) => id !== saleId) : [...ids, saleId],
    );
  };

  const toggleFilteredSelection = () => {
    const filteredIds = filteredSales.map((sale) => sale.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedSaleIds.includes(id));
    setSelectedSaleIds((ids) =>
      allSelected
        ? ids.filter((id) => !filteredIds.includes(id))
        : [...new Set([...ids, ...filteredIds])],
    );
  };

  const handlePrintSelected = async () => {
    const selectedSales = sales.filter((sale) => selectedSaleIds.includes(sale.id));
    if (!selectedSales.length) return;

    const settings = await getPrinterSettings();
    if (!settings) {
      Alert.alert("Printer setup", "Choose a Wi-Fi or Bluetooth printer first.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open settings", onPress: () => router.push("/printer-settings") },
      ]);
      return;
    }

    setIsPrinting(true);
    try {
      if (settings.connectionType === "bluetooth") {
        await printBluetoothSales(selectedSales, settings);
      } else {
        await printWifiSales(selectedSales, settings);
      }
      setSelectedSaleIds([]);
      Alert.alert("Printed", `${selectedSales.length} receipt${selectedSales.length === 1 ? "" : "s"} sent to the printer`);
    } catch (error) {
      Alert.alert("Print failed", error instanceof Error ? error.message : "Could not print receipts");
    } finally {
      setIsPrinting(false);
    }
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

  const selectionButtons = [
    {
      title: "Select all",
      onPress: toggleFilteredSelection,
      variant: "secondary" as const,
      disabled: filteredSales.length === 0,
    },
    {
      title: `Preview (${selectedSaleIds.length})`,
      onPress: () => setIsPreviewSheetOpen(true),
      variant: "secondary" as const,
      disabled: selectedSaleIds.length === 0,
    },
    {
      title: "Printer",
      onPress: () => router.push("/printer-settings"),
      variant: "secondary" as const,
      disabled: isPrinting,
    },
  ];

  const printButtons = [
    {
      title: isPrinting ? "Printing..." : `Print selected (${selectedSaleIds.length})`,
      onPress: handlePrintSelected,
      disabled: selectedSaleIds.length === 0 || isPrinting,
    },
  ];

  const selectedSales = sales.filter((sale) => selectedSaleIds.includes(sale.id));

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Sales History" />

      <SearchBar
        value={searchQuery}
        onChangeText={updateSearchQuery}
        placeholder="Search by customer name, contact, or invoice number"
        showFilterButton={true}
        onFilterPress={() => setIsFilterSheetOpen(true)}
        filterActive={hasActiveFilters}
      />

      <ActionButtons buttons={exportButtons} direction="row" spacing={8} />

      <ActionButtons buttons={selectionButtons} direction="row" spacing={8} />
      <ActionButtons buttons={printButtons} direction="row" spacing={8} />

      <SalesList
        sales={filteredSales}
        onSalePress={viewSaleDetails}
        selectedSaleIds={selectedSaleIds}
        onToggleSale={toggleSaleSelection}
      />

      <BottomSheet
        isVisible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        height={Dimensions.get("window").height * 0.6}
        // expandable={true}
        // scrollable={true}
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

      <BottomSheet
        isVisible={isPreviewSheetOpen}
        onClose={() => setIsPreviewSheetOpen(false)}
        height={Dimensions.get("window").height * 0.78}
        scrollable={true}
      >
        <ThemedText style={styles.sheetTitle}>Receipt preview</ThemedText>
        <ThemedText style={styles.sheetHint}>
          58 mm receipt layout. Paper output may vary by printer font and paper width.
        </ThemedText>
        {selectedSales.map((sale) => (
          <View key={sale.id} style={[styles.receiptPreview, { backgroundColor: theme.surface }]}>
            <Text style={[styles.receiptText, { color: theme.text }]}>{getReceiptPreviewText(sale)}</Text>
          </View>
        ))}
      </BottomSheet>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  sheetHint: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  receiptPreview: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  receiptText: {
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 18,
  },
});
