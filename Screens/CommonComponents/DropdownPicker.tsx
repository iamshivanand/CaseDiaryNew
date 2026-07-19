import React, { useContext, useState } from "react";
import {
  View,
  Text,
  Platform,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDropdownPickerStyles } from "./DropdownPickerStyle";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { DropdownOption } from "../../Types/appTypes";

interface DropdownPickerProps {
  label: string;
  selectedValue: string | number | undefined;
  onValueChange: (itemValue: string | number, itemIndex: number) => void;
  options: DropdownOption[];
  enabled?: boolean;
  error?: string | null;
  placeholder?: string;
  onOtherValueChange?: (text: string) => void;
  otherValue?: string;
  testID?: string;
}

const DropdownPicker: React.FC<DropdownPickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  options,
  enabled = true,
  error,
  placeholder,
  onOtherValueChange,
  otherValue,
  testID,
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getDropdownPickerStyles(theme);
  const mStyles = modalSt(theme);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localOtherValue, setLocalOtherValue] = useState("");

  const displayOtherValue = otherValue !== undefined ? otherValue : localOtherValue;

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayText = selectedOption
    ? selectedOption.label
    : (placeholder || `Select ${label}...`);

  const filteredOptions = options.filter((opt) =>
    opt.label.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOption = (option: DropdownOption, index: number) => {
    onValueChange(option.value, index);
    setSearchQuery("");
    setModalVisible(false);
    if (option.value !== "Other") {
      setLocalOtherValue("");
      if (onOtherValueChange) {
        onOtherValueChange("");
      }
    }
  };

  const handleOtherTextChange = (text: string) => {
    setLocalOtherValue(text);
    if (onOtherValueChange) {
      onOtherValueChange(text);
    }
  };

  return (
    <View style={styles.inputContainer} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => enabled && setModalVisible(true)}
        style={[
          styles.pickerContainer,
          error ? { borderColor: theme.colors.danger } : {},
          !enabled ? styles.disabledPickerContainer : {},
        ]}
      >
        <View style={mStyles.pickerButton}>
          <Text
            numberOfLines={1}
            style={
              selectedOption
                ? mStyles.pickerButtonText
                : mStyles.placeholderText
            }
          >
            {displayText}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={theme.colors.textSecondary || "#666"}
          />
        </View>
      </TouchableOpacity>

      {selectedValue === "Other" && (
        <TextInput
          style={styles.otherInput}
          placeholder="Please specify"
          placeholderTextColor={theme.colors.textSecondary}
          value={displayOtherValue}
          onChangeText={handleOtherTextChange}
        />
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSearchQuery("");
          setModalVisible(false);
        }}
      >
        <SafeAreaView style={mStyles.modalOverlay}>
          <View style={mStyles.modalContent}>
            <View style={mStyles.modalHeader}>
              <Text style={mStyles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setModalVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={mStyles.searchBar}
              placeholder="Search..."
              placeholderTextColor={theme.colors.textSecondary || "#999"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => item.value?.toString() || index.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={mStyles.itemRow}
                    onPress={() => handleSelectOption(item, index)}
                  >
                    <Text
                      style={[
                        mStyles.itemText,
                        isSelected ? mStyles.selectedItemText : {},
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={mStyles.emptyText}>No matches found</Text>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const modalSt = (theme: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.colors.cardBackground || theme.colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      height: "75%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    searchBar: {
      height: 44,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
      color: theme.colors.text,
      backgroundColor: theme.colors.inputBackground,
      fontSize: 16,
    },
    itemRow: {
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    selectedItemText: {
      fontWeight: "bold",
      color: theme.colors.primary,
    },
    pickerButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      height: "100%",
      width: "100%",
    },
    pickerButtonText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    placeholderText: {
      fontSize: 16,
      color: theme.colors.textSecondary || "#888",
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.textSecondary || "#999",
      marginTop: 20,
      fontSize: 16,
    },
  });

export default DropdownPicker;
