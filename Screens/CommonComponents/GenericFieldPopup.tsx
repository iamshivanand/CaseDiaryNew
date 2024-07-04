import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import { View, Text, TextInput, Button, Modal, StyleSheet } from "react-native";
import { formatDate } from "../../utils/commonFunctions";

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
        <View style={styles.modalContent}>
          {fields.map((field) => (
            <View key={field.name} style={styles.fieldContainer}>
              <Text style={styles.label}>{field.label}</Text>
              {field.type === "text" && (
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  onChangeText={(value) => handleChange(field.name, value)}
                />
              )}
              {field.type === "select" && (
                <Picker
                  selectedValue={formData[field.name]}
                  onValueChange={(value) => handleChange(field.name, value)}
                >
                  {field.options?.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              )}
              {field.type === "date" && (
                <>
                  <Button
                    title="Select Date"
                    onPress={() => setSelectedDateField(field.name)}
                  />
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
          <Button title="Submit" onPress={handleFormSubmit} />
          <Button title="Close" onPress={onClose} />
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
  },
});

export default GenericModal;
