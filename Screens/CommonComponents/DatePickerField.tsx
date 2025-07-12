// Screens/CommonComponents/DatePickerField.tsx
import React, { useState, useContext } from "react"; // Added useContext
import { View, Text, TouchableOpacity, Platform, Modal, Button, StyleSheet } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { getDatePickerFieldStyles } from "./DatePickerFieldStyle"; // Import function
import { ThemeContext } from "../../Providers/ThemeProvider"; // Adjust path
import { format } from 'date-fns';

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
  const { theme } = useContext(ThemeContext);
  const styles = getDatePickerFieldStyles(theme); // Generate themed styles
  // Note: iosPickerStyles are defined locally below, they could also be part of getDatePickerFieldStyles

  const [showPicker, setShowPicker] = useState(false);
  const [iosDate, setIosDate] = useState<Date>(value || new Date());

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === "set" && selectedDate) {
        onChange(selectedDate);
      }
    } else if (Platform.OS === 'ios') {
      if (selectedDate) {
        setIosDate(selectedDate);
      }
    }
  };

  const confirmIosDate = () => {
    onChange(iosDate);
    setShowPicker(false);
  };

  const cancelIosDate = () => {
    setIosDate(value || new Date());
    setShowPicker(false);
  };

  const displayDate = value ? format(value, dateFormat) : placeholder;

  const openPicker = () => {
    if (Platform.OS === 'ios') {
        setIosDate(value || new Date());
    }
    setShowPicker(true);
  }

  // Local styles for iOS modal, using theme where appropriate
  const localIosPickerStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: theme.colors.modalOverlayBg || 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
        backgroundColor: theme.colors.modalBackground || theme.colors.background,
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


  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
            styles.dateTouchable,
            error ? { borderColor: theme.colors.errorBorder || 'red' } : {}
        ]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.dateText : styles.placeholderText}>
          {displayDate}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          // accentColor={theme.colors.primary} // For Android spinner/calendar color
        />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Modal
            transparent={true}
            animationType="slide"
            visible={showPicker}
            onRequestClose={cancelIosDate}
        >
            <View style={localIosPickerStyles.modalOverlay}>
                <View style={localIosPickerStyles.modalContainer}>
                    <DateTimePicker
                        value={iosDate}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        textColor={theme.colors.text} // iOS picker text color
                        // themeVariant={theme.isDarkMode ? "dark" : "light"} // If theme has isDarkMode
                    />
                    <View style={localIosPickerStyles.buttonContainer}>
                        <Button title="Cancel" onPress={cancelIosDate} color={theme.colors.errorText || "#FF3B30"} />
                        <Button title="Done" onPress={confirmIosDate} color={theme.colors.primary} />
                    </View>
                </View>
            </View>
        </Modal>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default DatePickerField;
