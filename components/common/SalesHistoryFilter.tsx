import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Button } from "../ui/Button";
import { DateTimePicker } from "./DateTimePicker";

export type SortOrder = "asc" | "desc";

interface SalesHistoryFilterProps {
  // Order date filter
  orderStartDate: Date;
  orderEndDate: Date;
  orderDateRangeActive: boolean;
  onOrderStartDateChange: (date: Date) => void;
  onOrderEndDateChange: (date: Date) => void;

  // Created date filter
  createdStartDate: Date;
  createdEndDate: Date;
  createdDateRangeActive: boolean;
  onCreatedStartDateChange: (date: Date) => void;
  onCreatedEndDateChange: (date: Date) => void;

  // Sort options
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;

  // Single controls for entire filter
  onApplyFilters: () => void;
  onClearAllFilters: () => void;
  hasActiveFilters: boolean;
}

export const SalesHistoryFilter: React.FC<SalesHistoryFilterProps> = ({
  orderStartDate,
  orderEndDate,
  orderDateRangeActive,
  onOrderStartDateChange,
  onOrderEndDateChange,
  createdStartDate,
  createdEndDate,
  createdDateRangeActive,
  onCreatedStartDateChange,
  onCreatedEndDateChange,
  sortOrder,
  onSortOrderChange,
  onApplyFilters,
  onClearAllFilters,
  hasActiveFilters,
}) => {
  const handleApplyFilters = () => {
    if (orderStartDate > orderEndDate) {
      Alert.alert(
        "Invalid Date Range",
        "Order start date cannot be after end date"
      );
      return;
    }
    if (createdStartDate > createdEndDate) {
      Alert.alert(
        "Invalid Date Range",
        "Created start date cannot be after end date"
      );
      return;
    }
    onApplyFilters();
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Filter</ThemedText>

      {/* Order Date Filter Section */}
      <View style={styles.filterSection}>
        <ThemedText style={styles.sectionTitle}>Order Date Range</ThemedText>

        <View style={styles.dateRowSideBySide}>
          <View style={styles.datePickerHalf}>
            <DateTimePicker
              value={orderStartDate}
              onChange={onOrderStartDateChange}
            />
          </View>
          <ThemedText style={styles.separator}>--</ThemedText>
          <View style={styles.datePickerHalf}>
            <DateTimePicker
              value={orderEndDate}
              onChange={onOrderEndDateChange}
              minimumDate={orderStartDate}
            />
          </View>
        </View>
      </View>

      {/* Created Date Filter Section */}
      <View style={styles.filterSection}>
        <ThemedText style={styles.sectionTitle}>Created Date Range</ThemedText>

        <View style={styles.dateRowSideBySide}>
          <View style={styles.datePickerHalf}>
            <DateTimePicker
              value={createdStartDate}
              onChange={onCreatedStartDateChange}
            />
          </View>
          <ThemedText style={styles.separator}>--</ThemedText>
          <View style={styles.datePickerHalf}>
            <DateTimePicker
              value={createdEndDate}
              onChange={onCreatedEndDateChange}
              minimumDate={createdStartDate}
            />
          </View>
        </View>
      </View>

      {/* Sort Options Section */}
      <View style={styles.filterSection}>
        <ThemedText style={styles.sectionTitle}>Sort Order</ThemedText>

        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => onSortOrderChange("desc")}
          >
            <View
              style={[
                styles.radioCircle,
                sortOrder === "desc" && styles.radioCircleSelected,
              ]}
            >
              {sortOrder === "desc" && <View style={styles.radioDot} />}
            </View>
            <ThemedText style={styles.radioLabel}>Newest First</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => onSortOrderChange("asc")}
          >
            <View
              style={[
                styles.radioCircle,
                sortOrder === "asc" && styles.radioCircleSelected,
              ]}
            >
              {sortOrder === "asc" && <View style={styles.radioDot} />}
            </View>
            <ThemedText style={styles.radioLabel}>Oldest First</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Single Apply/Clear Buttons */}
      <View style={styles.actionButtonsSection}>
        <View style={styles.buttonRow}>
          {hasActiveFilters && (
            <Button
              title="Clear All Filters"
              variant="secondary"
              onPress={onClearAllFilters}
              style={styles.button}
            />
          )}
          <Button
            title="Apply Filters"
            variant="primary"
            onPress={handleApplyFilters}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  filterSection: {
    paddingBottom: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  dateRow: {
    marginBottom: 4,
  },
  dateRowSideBySide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  datePickerHalf: {
    flex: 1,
  },
  separator: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 4,
  },
  actionButtonsSection: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  radioGroup: {
    // gap: 8,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioCircleSelected: {
    borderColor: "#007AFF",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  radioLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "400",
  },
});
