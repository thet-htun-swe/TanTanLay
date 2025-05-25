import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { utils as XLSXUtils, write as XLSXWrite } from "xlsx";

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

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    let filtered = [...sales];

    // Apply date range filter if active
    if (dateRangeFiltered) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
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

    setFilteredSales(filtered);
  }, [sales, searchQuery, dateRangeFiltered, startDate, endDate]);

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

    setDateRangeFiltered(true);
  };

  const clearDateFilter = () => {
    setDateRangeFiltered(false);
  };

  const generateExcel = async () => {
    try {
      // Create worksheet data
      const wsData = [
        ['Sale ID', 'Date', 'Customer', 'Contact', 'Items', 'Total']
      ];
      
      filteredSales.forEach(sale => {
        wsData.push([
          sale.id,
          formatDate(sale.date),
          sale.customer.name,
          sale.customer.contact,
          sale.items.length.toString(),
          sale.total.toFixed(2)
        ]);
      });
      
      // Create detailed items worksheet
      const itemsData = [
        ['Sale ID', 'Date', 'Customer', 'Product', 'Quantity', 'Unit Price', 'Discount', 'Line Total']
      ];
      
      filteredSales.forEach(sale => {
        sale.items.forEach(item => {
          itemsData.push([
            sale.id,
            formatDate(sale.date),
            sale.customer.name,
            item.productName,
            item.quantity.toString(),
            item.unitPrice.toFixed(2),
            item.discount.toString() + '%',
            item.lineTotal.toFixed(2)
          ]);
        });
      });
      
      // Create workbook with multiple sheets
      const wb = XLSXUtils.book_new();
      const ws = XLSXUtils.aoa_to_sheet(wsData);
      const itemsWs = XLSXUtils.aoa_to_sheet(itemsData);
      
      XLSXUtils.book_append_sheet(wb, ws, 'Sales Summary');
      XLSXUtils.book_append_sheet(wb, itemsWs, 'Sales Items');
      
      // Generate Excel file
      const wbout = XLSXWrite(wb, { type: 'base64', bookType: 'xlsx' });
      
      // Define file path
      const fileName = `TanTanLay_Sales_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Write file
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Share Sales Data',
        UTI: 'com.microsoft.excel.xlsx'
      });
      
      Alert.alert('Success', 'Sales data exported and shared successfully');
    } catch (error) {
      console.error('Error generating Excel:', error);
      Alert.alert('Error', 'Failed to generate Excel file');
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
            ${item.total.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.saleDetails}>
          <ThemedText>Customer: {item.customer.name}</ThemedText>
          {item.customer.contact && (
            <ThemedText>Contact: {item.customer.contact}</ThemedText>
          )}
          <ThemedText>Items: {item.items.length}</ThemedText>
        </View>
        <Button
          title="View Details"
          variant="secondary"
          onPress={() => viewSaleDetails(item.id)}
          style={styles.viewButton}
        />
      </Card>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Sales History</ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by customer name or contact"
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />

        <View style={styles.filterContainer}>
          <View style={styles.dateFilterControls}>
            <View style={styles.datePickerRow}>
              <ThemedText style={styles.datePickerLabel}>Start:</ThemedText>
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
              <ThemedText style={styles.datePickerLabel}>End:</ThemedText>
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
            
            <View style={styles.filterButtonsRow}>
              <Button
                title="Apply Filter"
                variant="secondary"
                onPress={applyDateFilter}
                style={styles.filterButton}
              />
              {dateRangeFiltered && (
                <Button
                  title="Clear"
                  variant="secondary"
                  onPress={clearDateFilter}
                  style={styles.filterButton}
                />
              )}
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <Button
              title="Export Excel"
              variant="secondary"
              onPress={generateExcel}
              style={styles.exportButton}
            />
          </View>
        </View>
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
    marginTop: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 8,
  },
  filterContainer: {
    marginBottom: 8,
  },
  dateFilterControls: {
    marginBottom: 12,
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 8,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginLeft: 8,
    flex: 1,
  },
  filterButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
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
  exportButton: {
    minWidth: 100,
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
  viewButton: {
    alignSelf: "flex-end",
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
  datePickerLabel: {
    marginBottom: 8,
  },
  /* datePickerButton is already defined above */
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
