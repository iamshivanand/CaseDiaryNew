// Screens/CaseDetailsScreen/components/ElementContextModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../../Providers/ThemeProvider";

interface ElementContextModalProps {
  visible: boolean;
  elementType: "table" | "signature" | null;
  theme: Theme;
  onDeleteElement: () => void;
  onClose: () => void;
}

export const ElementContextModal: React.FC<ElementContextModalProps> = ({
  visible,
  elementType,
  theme,
  onDeleteElement,
  onClose,
}) => {
  if (!elementType) return null;

  const styles = getStyles(theme);
  const isTable = elementType === "table";
  const title = isTable ? "Court Table Options" : "Signature Stamp Options";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons
                name={isTable ? "grid-outline" : "ribbon-outline"}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="close-context-modal">
              <Ionicons name="close" size={22} color={theme.colors.subText} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select an action for the selected {isTable ? "table" : "signature stamp"}:
          </Text>

          {/* Delete Element Action Button */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              onDeleteElement();
              onClose();
            }}
            testID="delete-element-btn"
          >
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
            <Text style={styles.deleteBtnText}>
              Delete {isTable ? "Table" : "Signature Stamp"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Keep Element</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.subText,
      marginBottom: 16,
    },
    deleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#ef4444",
      paddingVertical: 14,
      borderRadius: 10,
      marginBottom: 12,
    },
    deleteBtnText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "bold",
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: 10,
    },
    cancelText: {
      color: theme.colors.subText,
      fontSize: 14,
      fontWeight: "600",
    },
  });
