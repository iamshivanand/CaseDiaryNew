import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { formatDate } from "../../utils/commonFunctions";
import { ThemeContext } from "../../Providers/ThemeProvider";
import ActionButton from "./ActionButton";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface FieldConfig {
  name: string;
  type: "text" | "select" | "date";
  placeholder?: string;
  label: string;
  options?: { label: string; value: string }[]; // For select type fields
}

interface GenericModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: { [key: string]: any }) => void;
  fields: FieldConfig[];
}

const GenericModal: React.FC<GenericModalProps> = ({
  visible,
  onClose,
  onSubmit,
  fields,
}) => {
  const { theme } = useContext(ThemeContext);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [selectedDateField, setSelectedDateField] = useState<string | null>(
    null
  );

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDatePickerChange = (
    fieldName: string,
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === "set" && selectedDate) {
      handleChange(fieldName, formatDate(selectedDate));
      setSelectedDateField(null);
    } else if (event.type === "dismissed") {
      setSelectedDateField(null);
    }
  };

  const handleFormSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Add Custom Field</Text>
          
          {fields.map((field) => (
            <View key={field.name} style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{field.label}</Text>
              
              {field.type === "text" && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.colors.textSecondary}
                  onChangeText={(value) => handleChange(field.name, value)}
                />
              )}
              
              {field.type === "select" && (
                <View
                  style={[
                    styles.pickerWrapper,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Picker
                    selectedValue={formData[field.name]}
                    style={{ color: theme.colors.text }}
                    dropdownIconColor={theme.colors.text}
                    onValueChange={(value) => handleChange(field.name, value)}
                  >
                    {field.options?.map((option) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                        color={theme.colors.text}
                        style={{ backgroundColor: theme.colors.cardBackground }}
                      />
                    ))}
                  </Picker>
                </View>
              )}
              
              {field.type === "date" && (
                <>
                  <TouchableOpacity
                    onPress={() => setSelectedDateField(field.name)}
                    style={[
                      styles.dateTrigger,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Icon name="calendar" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ color: formData[field.name] ? theme.colors.text : theme.colors.textSecondary }}>
                      {formData[field.name] || "Select Date"}
                    </Text>
                  </TouchableOpacity>

                  {selectedDateField === field.name && (
                    <DateTimePicker
                      value={new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) =>
                        handleDatePickerChange(field.name, event, selectedDate)
                      }
                    />
                  )}
                </>
              )}
            </View>
          ))}

          <View style={styles.buttonContainer}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <ActionButton title="Close" onPress={onClose} type="secondary" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <ActionButton title="Submit" onPress={handleFormSubmit} type="primary" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  dateTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});

export default GenericModal;
