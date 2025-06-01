import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { utils as XLSXUtils, write as XLSXWrite } from "xlsx";

import { BottomSheet } from "@/components/ui/BottomSheet";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store";
import { Sale } from "@/types";

export default function SalesScreen() {
  const { sales, fetchSales } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);

  // Date range state
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRangeFiltered, setDateRangeFiltered] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Store filter dates separately from the actual applied filter dates
  const [appliedStartDate, setAppliedStartDate] = useState<Date>(startDate);
  const [appliedEndDate, setAppliedEndDate] = useState<Date>(endDate);

  useEffect(() => {
    let filtered = [...sales];

    // Apply date range filter if active
    if (dateRangeFiltered) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= appliedStartDate && saleDate <= appliedEndDate;
      });
    }

    // Apply search query filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
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

    setFilteredSales(filtered);
  }, [sales, searchQuery, dateRangeFiltered, appliedStartDate, appliedEndDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString();
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const applyDateFilter = () => {
    if (startDate > endDate) {
      Alert.alert("Invalid Date Range", "Start date cannot be after end date");
      return;
    }

    // Update the applied dates when user presses Apply
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setDateRangeFiltered(true);
  };

  const clearDateFilter = () => {
    setDateRangeFiltered(false);
    // Reset the applied dates to match the current selection
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const generateExcel = async () => {
    try {
      // Create worksheet data
      const wsData = [
        ["Sale ID", "Date", "Customer", "Contact", "Items", "Total"],
      ];

      filteredSales.forEach((sale) => {
        wsData.push([
          sale.id,
          formatDate(sale.date),
          sale.customer.name,
          sale.customer.contact,
          sale.items.length.toString(),
          sale.total.toFixed(2),
        ]);
      });

      // Create detailed items worksheet
      const itemsData = [
        [
          "Sale ID",
          "Date",
          "Customer",
          "Product",
          "Quantity",
          "Unit Price",
          "Line Total",
        ],
      ];

      filteredSales.forEach((sale) => {
        sale.items.forEach((item) => {
          itemsData.push([
            sale.id,
            formatDate(sale.date),
            sale.customer.name,
            item.productName,
            item.quantity.toString(),
            item.unitPrice.toFixed(2),
            item.lineTotal.toFixed(2),
          ]);
        });
      });

      // Create workbook with multiple sheets
      const wb = XLSXUtils.book_new();
      const ws = XLSXUtils.aoa_to_sheet(wsData);
      const itemsWs = XLSXUtils.aoa_to_sheet(itemsData);

      XLSXUtils.book_append_sheet(wb, ws, "Sales Summary");
      XLSXUtils.book_append_sheet(wb, itemsWs, "Sales Items");

      // Generate Excel file
      const wbout = XLSXWrite(wb, { type: "base64", bookType: "xlsx" });

      // Define file path
      const fileName = `TanTanLay_Sales_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Sales Data",
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      Alert.alert("Error", "Failed to generate Excel file");
    }
  };

  const generateShippingLabels = async () => {
    try {
      if (filteredSales.length === 0) {
        Alert.alert(
          "No Sales",
          "There are no sales to generate shipping labels for."
        );
        return;
      }

      // Create HTML content for shipping labels
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 15px;
              width: 100%;
              box-sizing: border-box;
            }
            .page {
              page-break-after: always;
              width: 100%;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .labels-container {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              width: 100%;
            }
            .shipping-label {
              border: 1px solid #000;
              padding: 15px;
              width: calc(50% - 10px);
              height: 180px;
              position: relative;
              margin-bottom: 20px;
              box-sizing: border-box;
              break-inside: avoid;
            }
            .label-header {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 10px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .customer-info {
              margin-bottom: 10px;
              font-size: 14px;
            }
            .customer-name {
              font-weight: bold;
              font-size: 16px;
            }
            .customer-detail {
              margin: 5px 0;
              font-size: 12px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .total {
              position: absolute;
              bottom: 15px;
              right: 15px;
              font-weight: bold;
              font-size: 16px;
              border-top: 1px solid #ccc;
              padding-top: 5px;
            }
            .date {
              position: absolute;
              bottom: 15px;
              left: 15px;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .page { height: 100%; }
              .shipping-label { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
      `;

      // Calculate how many labels can fit on a page (2 columns, 3 rows = 6 per page)
      const LABELS_PER_PAGE = 6;

      // Group labels into pages
      const totalSales = filteredSales.length;
      const totalPages = Math.ceil(totalSales / LABELS_PER_PAGE);

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        // Start a new page
        htmlContent += '<div class="page"><div class="labels-container">';

        // Calculate start and end indices for this page
        const startIdx = pageIndex * LABELS_PER_PAGE;
        const endIdx = Math.min(startIdx + LABELS_PER_PAGE, totalSales);

        // Generate labels for this page
        for (let i = startIdx; i < endIdx; i++) {
          const sale = filteredSales[i];
          const saleDate = formatDate(sale.date);

          htmlContent += `
            <div class="shipping-label">
              <div class="label-header">Tan Tan Lay</div>
              <div class="customer-info">
                <div class="customer-name">${sale.customer.name}</div>
                <div class="customer-detail">${
                  sale.customer.address || "No address provided"
                }</div>
                <div class="customer-detail">Contact: ${
                  sale.customer.contact || "No contact provided"
                }</div>
              </div>
              <div class="total">Total: $${sale.total.toFixed(2)}</div>
              <div class="date">Order Date: ${saleDate}</div>
            </div>
          `;
        }

        // Close the page container
        htmlContent += "</div></div>";
      }

      htmlContent += `
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Shipping Labels",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error generating shipping labels:", error);
      Alert.alert("Error", "Failed to generate shipping labels");
    }
  };

  const viewSaleDetails = (saleId: string) => {
    router.push(`/sale/${saleId}`);
  };

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity onPress={() => viewSaleDetails(item.id)}>
      <Card style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <ThemedText style={styles.saleDate}>
            {formatDate(item.date)}
          </ThemedText>
          <ThemedText style={styles.saleTotal}>
            {item.total.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.saleDetails}>
          <ThemedText>Customer: {item.customer.name}</ThemedText>
          {item.customer.contact && (
            <ThemedText>Contact: {item.customer.contact}</ThemedText>
          )}
          <ThemedText>Items: {item.items.length}</ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => viewSaleDetails(item.id)}
          style={styles.viewDetailsLink}
        >
          <ThemedText style={styles.viewDetailsText}>
            View Details <Ionicons name="chevron-forward" size={14} />
          </ThemedText>
        </TouchableOpacity>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Sales History</ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Input
            placeholder="Search by customer name or contact"
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.searchInput}
          />

          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setIsFilterSheetOpen(true)}
          >
            <Ionicons
              name={dateRangeFiltered ? "filter" : "filter-outline"}
              size={24}
              color={dateRangeFiltered ? "#007bff" : "#666"}
            />
            {dateRangeFiltered && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        </View>

        <BottomSheet
          isVisible={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          height={Dimensions.get("window").height * 0.4}
        >
          <View style={styles.bottomSheetContent}>
            <ThemedText style={styles.bottomSheetTitle}>
              Filter Sales
            </ThemedText>

            <View style={styles.dateFilterControls}>
              <View style={styles.datePickerRow}>
                <ThemedText style={styles.datePickerLabel}>
                  Start Date:
                </ThemedText>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <ThemedText>{formatDateForDisplay(startDate)}</ThemedText>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                  />
                )}
              </View>

              <View style={styles.datePickerRow}>
                <ThemedText style={styles.datePickerLabel}>
                  End Date:
                </ThemedText>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <ThemedText>{formatDateForDisplay(endDate)}</ThemedText>
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={onEndDateChange}
                  />
                )}
              </View>
            </View>

            <View style={styles.filterActions}>
              <View style={styles.filterButtonsRow}>
                {dateRangeFiltered && (
                  <Button
                    title="Clear Filter"
                    variant="secondary"
                    onPress={() => {
                      clearDateFilter();
                      setIsFilterSheetOpen(false);
                    }}
                    style={styles.filterButton}
                  />
                )}
                <Button
                  title="Apply Filter"
                  variant="primary"
                  onPress={() => {
                    applyDateFilter();
                    setIsFilterSheetOpen(false);
                  }}
                  style={styles.filterButton}
                />
              </View>
            </View>
          </View>
        </BottomSheet>
      </View>

      <View style={styles.exportButtonContainer}>
        <Button
          title="Export"
          variant="secondary"
          onPress={generateExcel}
          style={styles.exportButton}
          textStyle={styles.exportButtonText}
        />
        <Button
          title="Print Labels"
          variant="secondary"
          onPress={generateShippingLabels}
          style={styles.exportButton}
          textStyle={styles.exportButtonText}
        />
      </View>

      {/* No export modal needed anymore */}

      <FlatList
        data={filteredSales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.salesList}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No sales found. Create your first sale!
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 32,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  filterIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  filterActiveDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007bff",
  },
  bottomSheetContent: {
    paddingVertical: 12,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  dateFilterControls: {
    marginBottom: 16,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  datePickerLabel: {
    width: 80,
    fontSize: 16,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    flex: 1,
  },
  filterActions: {
    marginTop: 8,
  },
  filterButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4,
  },

  activeDateFilter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  clearFilterButton: {
    padding: 4,
  },
  clearFilterText: {
    color: "#ff6b6b",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  exportButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
    gap: 8,
  },
  exportButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  exportButtonText: {
    fontSize: 14,
  },
  salesList: {
    paddingBottom: 100,
  },
  saleCard: {
    marginBottom: 12,
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  saleDate: {
    fontSize: 16,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: "600",
  },
  saleDetails: {
    marginBottom: 12,
  },
  viewDetailsLink: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewDetailsText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
    flexDirection: "row",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  modalDatePickerLabel: {
    marginBottom: 8,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateSelectButton: {
    marginLeft: 8,
    minWidth: 80,
  },
  modalButtons: {
    marginTop: 8,
  },
  modalButton: {
    marginBottom: 8,
  },
});
