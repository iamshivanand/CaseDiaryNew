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
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import ActionButton from "../../CommonComponents/ActionButton";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface UpdateHearingPopupProps {
  visible: boolean;
  onClose: () => void;
  onSave: (notes: string, nextHearingDate: Date, feeReceivedToday?: number) => void;
}

const UpdateHearingPopup: React.FC<UpdateHearingPopupProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useContext(ThemeContext);
  const [notes, setNotes] = useState("");
  const [feeToday, setFeeToday] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    const feeNum = feeToday.trim() ? parseFloat(feeToday.trim()) : 0;
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
              onSave(notes, nextHearingDate, feeNum);
              onClose();
            },
          },
        ]
      );
    } else {
      onSave(notes, nextHearingDate, feeNum);
      onClose();
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || nextHearingDate;
    setShowDatePicker(Platform.OS === "ios");
    setNextHearingDate(currentDate);
  };

  const quickOutcomeChips = [
    "Adjourned",
    "Arguments Heard",
    "Order Reserved",
    "Interim Relief Granted",
    "Evidence Recorded",
  ];

  const handleSelectChip = (chip: string) => {
    if (notes.trim()) {
      setNotes(`${notes.trim()} - ${chip}`);
    } else {
      setNotes(chip);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.popup, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Update Hearing</Text>

          <View style={{ marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", gap: 8 }}>
              {quickOutcomeChips.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectChip(chip)}
                  style={{
                    backgroundColor: `${theme.colors.primary}15`,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.primary }}>
                    + {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
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

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                minHeight: 44,
              },
            ]}
            placeholder="Fee Received Today (₹) (Optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={feeToday}
            onChangeText={setFeeToday}
            keyboardType="numeric"
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
