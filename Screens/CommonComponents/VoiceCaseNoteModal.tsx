import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import speechRecognitionService from "../../utils/speechRecognitionService";

interface VoiceCaseNoteModalProps {
  visible: boolean;
  caseId: number;
  caseTitle: string;
  existingNextHearingDate?: string | null;
  onClose: () => void;
  onSave: (data: {
    notes: string;
    updateNextDate: boolean;
    nextHearingDate?: string | null;
  }) => Promise<void>;
}

export const VoiceCaseNoteModal: React.FC<VoiceCaseNoteModalProps> = ({
  visible,
  caseId,
  caseTitle,
  existingNextHearingDate,
  onClose,
  onSave,
}) => {
  const { theme } = useContext(ThemeContext);
  const { locale } = useTranslation();
  const [notes, setNotes] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [dictationLang, setDictationLang] = useState<"en" | "hi">("en");
  const [isSaving, setIsSaving] = useState(false);

  // DATE SAFETY GUARDRAIL: Pre-fill with existing NextHearingDate (NOT today's date!)
  const [updateNextDate, setUpdateNextDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (existingNextHearingDate) {
      const d = new Date(existingNextHearingDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setNotes("");
      setUpdateNextDate(false);
      if (existingNextHearingDate) {
        const d = new Date(existingNextHearingDate);
        if (!isNaN(d.getTime())) {
          setSelectedDate(d);
        }
      } else {
        setSelectedDate(new Date());
      }
    }
  }, [visible, existingNextHearingDate]);

  const toggleDictation = async () => {
    if (isDictating) {
      await speechRecognitionService.stopListening();
      setIsDictating(false);
    } else {
      setIsDictating(true);
      const targetLocale =
        dictationLang === "hi" || locale === "hi" ? "hi-IN" : "en-IN";
      const started = await speechRecognitionService.startListening(
        targetLocale,
        {
          onStart: () => setIsDictating(true),
          onResult: (text) => {
            if (text) {
              const processed = text
                .replace(/\b(full stop|period)\b/gi, ".")
                .replace(/\b(पूर्ण विराम)\b/gi, "।")
                .replace(/\b(comma)\b/gi, ",")
                .replace(/\b(अल्पविराम)\b/gi, ",")
                .replace(/\b(new paragraph|next paragraph)\b/gi, "\n\n")
                .replace(/\b(नया पैराग्राफ|नया पैरा)\b/gi, "\n\n");

              setNotes((prev) => (prev ? prev + " " + processed : processed));
            }
          },
          onError: (err) => {
            setIsDictating(false);
            console.warn("Dictation error:", err);
          },
          onEnd: () => setIsDictating(false),
        }
      );

      if (!started) {
        setIsDictating(false);
        Alert.alert("Mic Error", "Could not start voice recognition.");
      }
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setUpdateNextDate(true);
    }
  };

  const handleSave = async () => {
    if (!notes.trim()) {
      Alert.alert(
        "Empty Note",
        "Please type or dictate proceeding notes first."
      );
      return;
    }

    setIsSaving(true);
    try {
      const dateString = selectedDate.toISOString().split("T")[0];
      await onSave({
        notes: notes.trim(),
        updateNextDate,
        nextHearingDate: updateNextDate ? dateString : existingNextHearingDate,
      });
      onClose();
    } catch (e) {
      console.error("Save case note error:", e);
      Alert.alert("Error", "Could not save case proceeding note.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateDisplay = (d: Date) => {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.cardBackground },
          ]}
        >
          {/* HEADER */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View
              style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
            >
              <Icon
                name="microphone"
                size={20}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Case Proceeding Note
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* DICTATION TOOLBAR */}
            <View style={styles.dictationRow}>
              <View style={styles.langToggleGroup}>
                <TouchableOpacity
                  onPress={() => setDictationLang("en")}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor:
                        dictationLang === "en"
                          ? theme.colors.primary
                          : `${theme.colors.border}40`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      {
                        color:
                          dictationLang === "en"
                            ? "#FFFFFF"
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    English
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDictationLang("hi")}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor:
                        dictationLang === "hi"
                          ? theme.colors.primary
                          : `${theme.colors.border}40`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      {
                        color:
                          dictationLang === "hi"
                            ? "#FFFFFF"
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    Hindi (Devanagari)
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={toggleDictation}
                style={[
                  styles.micBtn,
                  {
                    backgroundColor: isDictating
                      ? "#FF3B30"
                      : theme.colors.primary,
                  },
                ]}
              >
                {isDictating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Icon name="microphone" size={20} color="#FFF" />
                )}
                <Text style={styles.micBtnText}>
                  {isDictating ? "Listening..." : "Tap to Speak"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* NOTES INPUT */}
            <Text
              style={[styles.inputLabel, { color: theme.colors.textSecondary }]}
            >
              Proceeding Notes / Court Action (Saved under Today's Date):
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: isDictating
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              multiline
              numberOfLines={5}
              value={notes}
              onChangeText={setNotes}
              placeholder="Dictate or type court proceedings, advocate statements, or orders..."
              placeholderTextColor={theme.colors.textSecondary}
              textAlignVertical="top"
            />

            {/* DATE SAFETY GUARDRAIL CARD */}
            <View
              style={[
                styles.dateGuardrailCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                },
              ]}
            >
              <View style={styles.switchRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={[styles.switchTitle, { color: theme.colors.text }]}
                  >
                    Update Next Hearing Date
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: theme.colors.textSecondary }}
                  >
                    {existingNextHearingDate
                      ? `Existing Date: ${existingNextHearingDate}`
                      : "Case is currently undated"}
                  </Text>
                </View>
                <Switch
                  value={updateNextDate}
                  onValueChange={setUpdateNextDate}
                  trackColor={{
                    false: "#767577",
                    true: `${theme.colors.primary}80`,
                  }}
                  thumbColor={updateNextDate ? theme.colors.primary : "#f4f3f4"}
                />
              </View>

              {updateNextDate ? (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.dateSelectBtn,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.cardBackground,
                    },
                  ]}
                >
                  <Icon
                    name="calendar-month"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.dateSelectText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Next Date: {formatDateDisplay(selectedDate)}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[
                styles.saveBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon
                    name="check"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.saveBtnText}>Save Note</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  caseSubTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 16,
  },
  dictationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  langToggleGroup: {
    flexDirection: "row",
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  micBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  micBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 16,
  },
  dateGuardrailCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dateSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    justifyContent: "center",
  },
  dateSelectText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default VoiceCaseNoteModal;
