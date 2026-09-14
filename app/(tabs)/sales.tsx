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
import { Input } from "@/components/ui/Input";
import { useSalesFilter } from "@/hooks/useSalesFilter";
import { getWifiPrinterSettings, saveWifiPrinterSettings } from "@/services/database";
import { printSales, printTestReceipt } from "@/services/thermalPrinter";
import { useAppStore } from "@/store";
import { WifiPrinterSettings } from "@/types";
import { ExportUtils } from "@/utils/exportUtils";
import { getReceiptPreviewText } from "@/utils/escPos";

export default function SalesScreen() {
  const { sales, fetchSales } = useAppStore();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isPrinterSheetOpen, setIsPrinterSheetOpen] = useState(false);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState<number[]>([]);
  const [printerHost, setPrinterHost] = useState("");
  const [printerPort, setPrinterPort] = useState("9100");
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

  useEffect(() => {
    getWifiPrinterSettings()
      .then((settings) => {
        if (!settings) return;
        setPrinterHost(settings.host);
        setPrinterPort(String(settings.port));
      })
      .catch((error) => console.warn("Failed to load printer settings:", error));
  }, []);

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

  const savePrinter = async (): Promise<WifiPrinterSettings | null> => {
    const settings = { host: printerHost, port: Number(printerPort) };
    try {
      await saveWifiPrinterSettings(settings);
      return { ...settings, host: settings.host.trim() };
    } catch (error) {
      Alert.alert("Printer setup", error instanceof Error ? error.message : "Could not save printer settings");
      return null;
    }
  };

  const handleSavePrinter = async () => {
    const settings = await savePrinter();
    if (settings) Alert.alert("Printer setup", "Wi-Fi printer saved");
  };

  const handleTestPrint = async () => {
    const settings = await savePrinter();
    if (!settings) return;

    setIsPrinting(true);
    try {
      await printTestReceipt(settings);
      Alert.alert("Printer test", "Test receipt sent");
    } catch (error) {
      Alert.alert("Printer test failed", error instanceof Error ? error.message : "Could not reach printer");
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintSelected = async () => {
    if (!printerHost.trim()) {
      setIsPrinterSheetOpen(true);
      return;
    }

    const selectedSales = sales.filter((sale) => selectedSaleIds.includes(sale.id));
    if (!selectedSales.length) return;

    const settings = await savePrinter();
    if (!settings) {
      setIsPrinterSheetOpen(true);
      return;
    }

    setIsPrinting(true);
    try {
      await printSales(selectedSales, settings);
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
      onPress: () => setIsPrinterSheetOpen(true),
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
          <View key={sale.id} style={styles.receiptPreview}>
            <Text style={styles.receiptText}>{getReceiptPreviewText(sale)}</Text>
          </View>
        ))}
      </BottomSheet>

      <BottomSheet
        isVisible={isPrinterSheetOpen}
        onClose={() => setIsPrinterSheetOpen(false)}
        height={Dimensions.get("window").height * 0.52}
      >
        <ThemedText style={styles.sheetTitle}>Wi-Fi thermal printer</ThemedText>
        <ThemedText style={styles.sheetHint}>
          Connect the phone and printer to the same Wi-Fi network. Most ESC/POS printers use port 9100.
        </ThemedText>
        <Input
          label="Printer IP address"
          value={printerHost}
          onChangeText={setPrinterHost}
          placeholder="192.168.1.100"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Port"
          value={printerPort}
          onChangeText={setPrinterPort}
          placeholder="9100"
          keyboardType="number-pad"
          containerStyle={styles.portInput}
        />
        <ActionButtons
          buttons={[
            { title: "Save", onPress: handleSavePrinter, variant: "secondary" },
            { title: isPrinting ? "Printing..." : "Test print", onPress: handleTestPrint, disabled: isPrinting },
          ]}
          direction="row"
          spacing={8}
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
  portInput: {
    marginTop: 12,
  },
  receiptPreview: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  receiptText: {
    color: "#111",
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 18,
  },
});
