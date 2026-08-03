// Screens/CaseDetailsScreen/components/PlaceholderBottomSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Theme } from "../../../Providers/ThemeProvider";

interface PlaceholderBottomSheetProps {
  visible: boolean;
  placeholderLabel: string;
  cleanLabel: string;
  theme: Theme;
  onApply: (originalLabel: string, newValue: string) => void;
  onClose: () => void;
}

export const PlaceholderBottomSheet: React.FC<PlaceholderBottomSheetProps> = ({
  visible,
  placeholderLabel,
  cleanLabel,
  theme,
  onApply,
  onClose,
}) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue("");
  }, [placeholderLabel, visible]);

  const handleSave = () => {
    if (value.trim()) {
      onApply(placeholderLabel, value.trim());
      onClose();
    }
  };

  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons
                name="create-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.title}>Fill Placeholder Details</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              testID="close-placeholder-modal"
            >
              <Ionicons name="close" size={22} color={theme.colors.subText} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Field Name:</Text>
          <Text style={styles.fieldTag}>{cleanLabel || placeholderLabel}</Text>

          <Text style={styles.inputLabel}>Enter Details / Content:</Text>
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            placeholder={`Enter ${cleanLabel || "details"}...`}
            placeholderTextColor={theme.colors.subText}
            autoFocus
            testID="placeholder-value-input"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, !value.trim() && styles.disabledBtn]}
              onPress={handleSave}
              disabled={!value.trim()}
              testID="apply-placeholder-btn"
            >
              <Text style={styles.applyBtnText}>Update Placeholder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    backdrop: {
      flex: 1,
    },
    content: {
      backgroundColor: theme.colors.cardBackground,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    fieldLabel: {
      fontSize: 13,
      color: theme.colors.subText,
      marginBottom: 4,
    },
    fieldTag: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.primary,
      backgroundColor: theme.colors.inputBackground,
      padding: 8,
      borderRadius: 6,
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 13,
      color: theme.colors.subText,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 20,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12,
    },
    cancelBtn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.inputBackground,
    },
    cancelBtnText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    applyBtn: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    disabledBtn: {
      opacity: 0.5,
    },
    applyBtnText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "bold",
    },
  });
