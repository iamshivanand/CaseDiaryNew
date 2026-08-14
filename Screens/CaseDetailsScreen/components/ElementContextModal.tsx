// Screens/CaseDetailsScreen/components/ElementContextModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

import { Theme } from "../../../Providers/ThemeProvider";

interface ElementContextModalProps {
  visible: boolean;
  elementType: "table" | "signature" | null;
  theme: Theme;
  onDeleteElement: () => void;
  onAddRowAbove?: () => void;
  onAddRowBelow?: () => void;
  onAddColLeft?: () => void;
  onAddColRight?: () => void;
  onDeleteRow?: () => void;
  onDeleteCol?: () => void;
  onClose: () => void;
}

export const ElementContextModal: React.FC<ElementContextModalProps> = ({
  visible,
  elementType,
  theme,
  onDeleteElement,
  onAddRowAbove,
  onAddRowBelow,
  onAddColLeft,
  onAddColRight,
  onDeleteRow,
  onDeleteCol,
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
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
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
            Select an action for the selected{" "}
            {isTable ? "table" : "signature stamp"}:
          </Text>

          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            {isTable && (
              <View style={styles.tableActionsGroup}>
                <Text style={styles.sectionLabel}>Row Controls</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.actionGridBtn}
                    onPress={() => {
                      onAddRowAbove?.();
                      onClose();
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.actionGridText}>Add Row Above</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionGridBtn}
                    onPress={() => {
                      onAddRowBelow?.();
                      onClose();
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.actionGridText}>Add Row Below</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionLabel}>Column Controls</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.actionGridBtn}
                    onPress={() => {
                      onAddColLeft?.();
                      onClose();
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.actionGridText}>Add Col Left</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionGridBtn}
                    onPress={() => {
                      onAddColRight?.();
                      onClose();
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.actionGridText}>Add Col Right</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionLabel}>Delete Controls</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionGridBtn, styles.dangerBorderBtn]}
                    onPress={() => {
                      onDeleteRow?.();
                      onClose();
                    }}
                  >
                    <Ionicons name="remove-circle-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionGridText, { color: "#ef4444" }]}>Delete Row</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionGridBtn, styles.dangerBorderBtn]}
                    onPress={() => {
                      onDeleteCol?.();
                      onClose();
                    }}
                  >
                    <Ionicons name="remove-circle-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionGridText, { color: "#ef4444" }]}>Delete Column</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

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
                Delete Entire {isTable ? "Table" : "Signature Stamp"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

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
      justify: "flex-end",
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
    tableActionsGroup: {
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "bold",
      color: theme.colors.subText,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      marginTop: 4,
    },
    btnRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    actionGridBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    dangerBorderBtn: {
      borderColor: "#fca5a5",
      backgroundColor: "#fef2f2",
    },
    actionGridText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.text,
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
