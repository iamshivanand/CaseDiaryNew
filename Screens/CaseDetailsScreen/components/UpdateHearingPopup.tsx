import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import ActionButton from "../../CommonComponents/ActionButton";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";

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
  const { theme } = useContext(ThemeContext);
  const [notes, setNotes] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    if (!notes.trim()) {
      Alert.alert(
        "No Notes Entered",
        "You haven't entered any notes for today's hearing. Would you like to proceed or go back to write notes?",
        [
          {
            text: "Go Back",
            style: "cancel",
          },
          {
            text: "Proceed",
            style: "destructive",
            onPress: () => {
              onSave(notes, nextHearingDate);
              onClose();
            },
          },
        ]
      );
    } else {
      onSave(notes, nextHearingDate);
      onClose();
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || nextHearingDate;
    setShowDatePicker(Platform.OS === "ios");
    setNextHearingDate(currentDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.popup, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Update Hearing</Text>
          
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Notes for today's hearing"
            placeholderTextColor={theme.colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            style={[
              styles.dateTrigger,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="calendar-month-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.dateTriggerText, { color: theme.colors.text }]}>
              Next Date: {nextHearingDate.toDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={nextHearingDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              textColor={theme.colors.text}
            />
          )}

          <View style={styles.buttonContainer}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <ActionButton title="Cancel" onPress={onClose} type="secondary" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <ActionButton title="Save" onPress={handleSave} type="primary" />
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
    backgroundColor: "rgba(15, 23, 42, 0.75)", // Slate dark overlay
    paddingHorizontal: 20,
  },
  popup: {
    width: "90%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 14,
  },
  dateTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  dateTriggerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default UpdateHearingPopup;
