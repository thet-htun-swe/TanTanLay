import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";

import { SalesHistoryFilter } from "@/components/common/SalesHistoryFilter";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { ReceiptView } from "@/components/sales/ReceiptView";
import { SalesList } from "@/components/sales/SalesList";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Chip } from "@/components/ui/Chip";
import { useSalesFilter } from "@/hooks/useSalesFilter";
import { printBluetoothSales } from "@/services/bluetoothPrinter";
import { getPrinterSettings } from "@/services/localSettings";
import { printWifiSales } from "@/services/thermalPrinter";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { useAppStore, useIsAdmin } from "@/store";
import { ExportUtils } from "@/utils/exportUtils";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function SalesScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { sales, fetchSales, error } = useAppStore();
  const isAdmin = useIsAdmin();
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
        { text: "Set up printer", onPress: () => router.push("/settings/printer") },
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

  const allFilteredSelected =
    filteredSales.length > 0 && filteredSales.every((sale) => selectedSaleIds.includes(sale.id));

  const selectedSales = sales.filter((sale) => selectedSaleIds.includes(sale.id));

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader
        title="Sales History"
        subtitle={`${filteredSales.length} ${filteredSales.length === 1 ? "sale" : "sales"}`}
        rightComponent={
          <TouchableOpacity
            onPress={() => router.push("/settings/printer")}
            hitSlop={10}
            accessibilityLabel="Printer setup"
          >
            <Ionicons name="print-outline" size={26} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <ErrorBanner message={error} onRetry={fetchSales} />

      <SearchBar
        value={searchQuery}
        onChangeText={updateSearchQuery}
        placeholder="Search by customer name, contact, or invoice number"
        showFilterButton={true}
        onFilterPress={() => setIsFilterSheetOpen(true)}
        filterActive={hasActiveFilters}
      />

      {/* One compact toolbar; print actions appear in the bar below when receipts are selected */}
      <View style={styles.toolbar}>
        <Chip
          label={allFilteredSelected ? "Unselect all" : "Select all"}
          icon={allFilteredSelected ? "close-circle-outline" : "checkmark-done-outline"}
          onPress={toggleFilteredSelection}
          disabled={filteredSales.length === 0}
        />
        <Chip label="Labels" icon="pricetags-outline" onPress={handleExportLabels} />
        {/* Excel export is admin only */}
        {isAdmin && <Chip label="Export" icon="download-outline" onPress={handleExportExcel} />}
      </View>

      <SalesList
        sales={filteredSales}
        onSalePress={viewSaleDetails}
        selectedSaleIds={selectedSaleIds}
        onToggleSale={toggleSaleSelection}
      />

      {selectedSaleIds.length > 0 && (
        <View
          style={[
            styles.selectionBar,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setSelectedSaleIds([])}
            hitSlop={10}
            accessibilityLabel="Clear selection"
          >
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={styles.selectionText}>{selectedSaleIds.length} selected</ThemedText>
          <Chip label="Preview" icon="eye-outline" onPress={() => setIsPreviewSheetOpen(true)} />
          <Chip
            label={isPrinting ? "Printing..." : "Print"}
            icon="print-outline"
            onPress={handlePrintSelected}
            disabled={isPrinting}
            primary
          />
        </View>
      )}

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
          Printed receipts use the receipt width set in Printer settings.
        </ThemedText>
        {selectedSales.map((sale) => (
          <View key={sale.id} style={[styles.receiptPreview, { backgroundColor: theme.surface }]}>
            <ReceiptView sale={sale} />
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
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12, // space under the search box
    marginBottom: 8,
  },
  selectionBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  selectionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
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
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
});
