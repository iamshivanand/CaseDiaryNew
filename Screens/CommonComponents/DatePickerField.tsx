// Screens/CommonComponents/DatePickerField.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, Modal, Button, StyleSheet } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { DatePickerFieldStyles } from "./DatePickerFieldStyle";
import { format } from 'date-fns'; // Using date-fns for formatting

interface DatePickerFieldProps {
  label: string;
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string | null;
  dateFormat?: string; // e.g., "MM/dd/yyyy" or "dd MMM, yyyy"
  minimumDate?: Date;
  maximumDate?: Date;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select date",
  error,
  dateFormat = "MMM dd, yyyy",
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  // Temporary date state for iOS modal behavior
  const [iosDate, setIosDate] = useState<Date>(value || new Date());

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false); // Close picker on Android after selection/dismiss
      if (event.type === "set" && selectedDate) {
        onChange(selectedDate);
      } else if (event.type === "dismissed") {
        // User cancelled, do nothing or handle as needed
      }
    } else if (Platform.OS === 'ios') {
      // For iOS, the picker is typically part of a modal
      // The onChange event fires continuously as the user spins the wheel
      if (selectedDate) {
        setIosDate(selectedDate); // Update temporary date
      }
    }
  };

  const confirmIosDate = () => {
    onChange(iosDate);
    setShowPicker(false);
  };

  const cancelIosDate = () => {
    // Reset iosDate to original value if needed, or just close
    setIosDate(value || new Date()); // Reset to current value or default
    setShowPicker(false);
  };

  const displayDate = value ? format(value, dateFormat) : placeholder;

  const openPicker = () => {
    if (Platform.OS === 'ios') {
        setIosDate(value || new Date()); // Initialize iOS date before showing picker
    }
    setShowPicker(true);
  }

  return (
    <View style={DatePickerFieldStyles.inputContainer}>
      <Text style={DatePickerFieldStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[
            DatePickerFieldStyles.dateTouchable,
            error ? { borderColor: 'red' } : {}
        ]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Text style={value ? DatePickerFieldStyles.dateText : DatePickerFieldStyles.placeholderText}>
          {displayDate}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default" // "spinner" or "calendar" also available
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Modal
            transparent={true}
            animationType="slide"
            visible={showPicker}
            onRequestClose={cancelIosDate}
        >
            <View style={iosPickerStyles.modalOverlay}>
                <View style={iosPickerStyles.modalContainer}>
                    <DateTimePicker
                        value={iosDate}
                        mode="date"
                        display="spinner" // "inline" or "compact" also possible
                        onChange={handleDateChange}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        textColor="#000" // Example: ensure text is visible in dark mode
                    />
                    <View style={iosPickerStyles.buttonContainer}>
                        <Button title="Cancel" onPress={cancelIosDate} color="#FF3B30" />
                        <Button title="Done" onPress={confirmIosDate} color="#007AFF" />
                    </View>
                </View>
            </View>
        </Modal>
      )}
      {error && <Text style={DatePickerFieldStyles.errorText}>{error}</Text>}
    </View>
  );
};

// Styles for iOS Picker Modal
const iosPickerStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
        backgroundColor: '#FFF', // Or use a theme-based color
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        padding: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    }
});

export default DatePickerField;
