import DateTimePickerNative from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface DateTimePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (selectedDate) {
      const newDate = new Date(selectedDate);
      // Preserve the time from current value
      newDate.setHours(tempDate.getHours());
      newDate.setMinutes(tempDate.getMinutes());
      setTempDate(newDate);

      if (Platform.OS === "android") {
        // On Android, automatically show time picker after date selection
        setShowTimePicker(true);
      } else {
        // On iOS, update immediately since datetime mode is used
        onChange(newDate);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");

    if (selectedTime) {
      const newDateTime = new Date(tempDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setTempDate(newDateTime);
      onChange(newDateTime);
    }
  };

  const handlePress = () => {
    setTempDate(value);
    if (Platform.OS === "ios") {
      // iOS supports datetime mode directly
      setShowDatePicker(true);
    } else {
      // Android: start with date picker
      setShowDatePicker(true);
    }
  };

  const formatDateTime = (date: Date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <TouchableOpacity style={styles.dateButton} onPress={handlePress}>
        <ThemedText>{formatDateTime(value)}</ThemedText>
      </TouchableOpacity>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePickerNative
          value={tempDate}
          mode={Platform.OS === "ios" ? "datetime" : "date"}
          display="default"
          onChange={onDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {/* Time Picker (Android only, as iOS uses datetime mode) */}
      {showTimePicker && Platform.OS === "android" && (
        <DateTimePickerNative
          value={tempDate}
          mode="time"
          display="spinner"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 6,
    backgroundColor: "#fff",
  },
});
