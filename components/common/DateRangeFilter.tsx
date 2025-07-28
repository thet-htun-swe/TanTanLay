import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Button } from '../ui/Button';
import { DatePicker } from './DatePicker';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onApply: () => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
  showClearButton = false,
}) => {
  const handleApply = () => {
    if (startDate > endDate) {
      Alert.alert("Invalid Date Range", "Start date cannot be after end date");
      return;
    }
    onApply();
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Filter by Date Range</ThemedText>
      
      <View style={styles.dateRow}>
        <DatePicker
          label="Start Date:"
          value={startDate}
          onChange={onStartDateChange}
        />
      </View>
      
      <View style={styles.dateRow}>
        <DatePicker
          label="End Date:"
          value={endDate}
          onChange={onEndDateChange}
          minimumDate={startDate}
        />
      </View>
      
      <View style={styles.buttonRow}>
        {showClearButton && onClear && (
          <Button
            title="Clear Filter"
            variant="secondary"
            onPress={onClear}
            style={styles.button}
          />
        )}
        <Button
          title="Apply Filter"
          variant="primary"
          onPress={handleApply}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateRow: {
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});