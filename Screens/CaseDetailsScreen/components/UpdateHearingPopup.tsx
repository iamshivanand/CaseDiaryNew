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
import speechRecognitionService from "../../../utils/speechRecognitionService";

interface UpdateHearingPopupProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    notes: string,
    nextHearingDate: Date,
    dateFeeCollectedToday?: number,
    totalFeeCollectedToday?: number,
    paymentMode?: string,
    paymentNotes?: string
  ) => void;
}

const UpdateHearingPopup: React.FC<UpdateHearingPopupProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useContext(ThemeContext);
  const [notes, setNotes] = useState("");
  const [dateFeeToday, setDateFeeToday] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [baseNotesForDictation, setBaseNotesForDictation] = useState("");

  const handleSave = () => {
    const dateFeePaidNum = dateFeeToday.trim() ? parseFloat(dateFeeToday.trim()) : 0;

    if (!notes.trim() && dateFeePaidNum <= 0) {
      Alert.alert(
        "No Details Entered",
        "You haven't entered any hearing notes or fee payment details. Would you like to proceed or write notes?",
        [
          {
            text: "Go Back",
            style: "cancel",
          },
          {
            text: "Proceed",
            style: "destructive",
            onPress: () => {
              onSave(notes, nextHearingDate, dateFeePaidNum, 0, paymentMode, paymentNotes);
              onClose();
            },
          },
        ]
      );
    } else {
      onSave(notes, nextHearingDate, dateFeePaidNum, 0, paymentMode, paymentNotes);
      onClose();
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || nextHearingDate;
    setShowDatePicker(Platform.OS === "ios");
    setNextHearingDate(currentDate);
  };

  const paymentModes = ["Cash", "UPI / GPay", "Bank Transfer", "Cheque", "Online"];

  const toggleDictation = async () => {
    if (isDictating) {
      await speechRecognitionService.stopListening();
      setIsDictating(false);
    } else {
      setBaseNotesForDictation(notes);
      setIsDictating(true);
      const started = await speechRecognitionService.startListening("hi-IN", {
        onStart: () => setIsDictating(true),
        onFullResult: (fullTxt) => {
          if (fullTxt) {
            let processed = fullTxt
              .replace(/\b(full stop|period)\b/gi, ".")
              .replace(/\b(पूर्ण विराम)\b/gi, "।")
              .replace(/\b(comma)\b/gi, ",")
              .replace(/\b(अल्पविराम)\b/gi, ",")
              .replace(/\b(new paragraph|next paragraph)\b/gi, "\n\n")
              .replace(/\b(नया पैराग्राफ|नया पैरा)\b/gi, "\n\n");
            setNotes(baseNotesForDictation ? `${baseNotesForDictation.trim()} ${processed}` : processed);
          }
        },
        onError: (err) => {
          setIsDictating(false);
          console.warn("Voice note error:", err);
        },
        onEnd: () => setIsDictating(false),
      });
      if (!started) setIsDictating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.popup,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: theme.colors.text }]}>Update Hearing & Fee Details</Text>

            {/* SECTION 1: HEARING NOTES & STAGE */}
            <View style={styles.sectionHeader}>
              <Icon name="notebook-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                Hearing & Proceedings Notes
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 4 }}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 0 }]}>
                Hearing Proceedings & Notes:
              </Text>
              <TouchableOpacity
                onPress={toggleDictation}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDictating ? "#EF4444" : theme.colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 18,
                }}
              >
                <Icon name={isDictating ? "microphone-off" : "microphone"} size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: "bold", color: "#FFFFFF" }}>
                  {isDictating ? "Stop Dictating..." : "🎙️ Voice Dictate"}
                </Text>
              </TouchableOpacity>
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
              placeholder="Dictate or type today's court hearing notes..."
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

            {/* SECTION 2: FEE & PAYMENT DETAILS */}
            <View style={[styles.sectionHeader, { marginTop: 14 }]}>
              <Icon name="cash-multiple" size={18} color="#16A34A" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: theme.isDark ? '#34D399' : '#15803D' }]}>
                Hearing Date Fee Received Today
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginBottom: 4 }]}>
                Date Fee Received Today (₹)
              </Text>
              <TextInput
                style={[
                  styles.inputSmall,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    width: '100%',
                  },
                ]}
                placeholder="e.g. 2000"
                placeholderTextColor={theme.colors.textSecondary}
                value={dateFeeToday}
                onChangeText={setDateFeeToday}
                keyboardType="numeric"
              />
            </View>

            {/* Payment Mode Selector Tags */}
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginBottom: 6 }]}>
              Payment Mode (If Received Today)
            </Text>
            <View style={{ marginBottom: 12 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: "row", gap: 6 }}
              >
                {paymentModes.map((mode) => {
                  const isSelected = paymentMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setPaymentMode(mode)}
                      style={{
                        backgroundColor: isSelected
                          ? (theme.isDark ? '#064E3B' : '#DCFCE7')
                          : (theme.colors.inputBackground || (theme.isDark ? '#1E293B' : '#F1F5F9')),
                        borderWidth: 1,
                        borderColor: isSelected ? '#16A34A' : theme.colors.border,
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected
                            ? (theme.isDark ? '#34D399' : '#15803D')
                            : theme.colors.text,
                        }}
                      >
                        {isSelected ? "✓ " : ""}{mode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <TextInput
              style={[
                styles.inputSmall,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  marginBottom: 18,
                },
              ]}
              placeholder="Payment description / notes (e.g. Received via GPay)"
              placeholderTextColor={theme.colors.textSecondary}
              value={paymentNotes}
              onChangeText={setPaymentNotes}
            />

            <View style={styles.buttonContainer}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ActionButton title="Cancel" onPress={onClose} type="secondary" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <ActionButton title="Save" onPress={handleSave} type="primary" />
              </View>
            </View>
          </ScrollView>
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
  popup: {
    width: "92%",
    maxHeight: "88%",
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  dateTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
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
