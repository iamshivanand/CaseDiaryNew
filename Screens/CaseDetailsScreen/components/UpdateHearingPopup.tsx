import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import ActionButton from "../../CommonComponents/ActionButton";

interface UpdateHearingPopupProps {
  visible: boolean;
  onClose: () => void;
  onSave: (notes: string, nextHearingDate: Date) => void;
}

const UpdateHearingPopup: React.FC<UpdateHearingPopupProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [notes, setNotes] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    onSave(notes, nextHearingDate);
    onClose();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || nextHearingDate;
    setShowDatePicker(Platform.OS === "ios");
    setNextHearingDate(currentDate);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.popup}>
          <Text style={styles.title}>Update Hearing</Text>
          <TextInput
            style={styles.input}
            placeholder="Notes for today's hearing"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerText}>
              Next Hearing Date: {nextHearingDate.toDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={nextHearingDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
          <View style={styles.buttonContainer}>
            <ActionButton title="Cancel" onPress={onClose} type="secondary" />
            <ActionButton title="Save" onPress={handleSave} type="primary" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  popup: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    minHeight: 100,
  },
  datePickerText: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default UpdateHearingPopup;
