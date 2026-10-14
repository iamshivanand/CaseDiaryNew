import { Ionicons, FontAwesome } from "@expo/vector-icons";
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Theme } from "../../../Providers/ThemeProvider";

export interface ElementContextModalProps {
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
  onToggleBorders?: () => void;
  onAlignColumn?: (alignment: "left" | "center" | "right" | "justify") => void;
  onAlignCell?: (alignment: "left" | "center" | "right" | "justify") => void;
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
  onToggleBorders,
  onAlignColumn,
  onAlignCell,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  if (!elementType) return null;

  const styles = getStyles(theme, insets.bottom);
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

          <ScrollView 
            style={styles.scrollArea} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {isTable && (
              <View style={styles.tableActionsGroup}>
                {/* Column-Wise Text Alignment */}
                <Text style={styles.sectionLabel}>Column Text Alignment</Text>
                <Text style={styles.sectionHint}>
                  Applies text alignment to all rows in the active column:
                </Text>
                <View style={styles.alignBtnRow}>
                  <TouchableOpacity
                    style={styles.alignBtn}
                    onPress={() => {
                      onAlignColumn?.("left");
                      onClose();
                    }}
                    testID="align-col-left-btn"
                  >
                    <FontAwesome name="align-left" size={15} color={theme.colors.primary} />
                    <Text style={styles.alignBtnText}>Col Left</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.alignBtn}
                    onPress={() => {
                      onAlignColumn?.("center");
                      onClose();
                    }}
                    testID="align-col-center-btn"
                  >
                    <FontAwesome name="align-center" size={15} color={theme.colors.primary} />
                    <Text style={styles.alignBtnText}>Col Center</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.alignBtn}
                    onPress={() => {
                      onAlignColumn?.("right");
                      onClose();
                    }}
                    testID="align-col-right-btn"
                  >
                    <FontAwesome name="align-right" size={15} color={theme.colors.primary} />
                    <Text style={styles.alignBtnText}>Col Right</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.alignBtn}
                    onPress={() => {
                      onAlignColumn?.("justify");
                      onClose();
                    }}
                    testID="align-col-justify-btn"
                  >
                    <FontAwesome name="align-justify" size={15} color={theme.colors.primary} />
                    <Text style={styles.alignBtnText}>Col Justify</Text>
                  </TouchableOpacity>
                </View>

                {/* Single Cell Text Alignment */}
                <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Single Cell Alignment</Text>
                <View style={styles.alignBtnRow}>
                  <TouchableOpacity
                    style={styles.alignBtn}
                    onPress={() => {
                      onAlignCell?.("left");
                      onClose();
                    }}
                    testID="align-cell-left-btn"
                  >
                    <FontAwesome name="align-left" size={14} color={theme.colors.text} />
                    <Text style={[styles.alignBtnText, { color: theme.colors.text }]}>Cell Left</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.alignBtn}
                    onPress={() => {
                      onAlignCell?.("center");
                      onClose();
                    }}
                    testID="align-cell-center-btn"
                  >
                    <FontAwesome name="align-center" size={14} color={theme.colors.text} />
                    <Text style={[styles.alignBtnText, { color: theme.colors.text }]}>Cell Center</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.alignBtn}
                    onPress={() => {
                      onAlignCell?.("right");
                      onClose();
                    }}
                    testID="align-cell-right-btn"
                  >
                    <FontAwesome name="align-right" size={14} color={theme.colors.text} />
                    <Text style={[styles.alignBtnText, { color: theme.colors.text }]}>Cell Right</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.alignBtn}
                    onPress={() => {
                      onAlignCell?.("justify");
                      onClose();
                    }}
                    testID="align-cell-justify-btn"
                  >
                    <FontAwesome name="align-justify" size={14} color={theme.colors.text} />
                    <Text style={[styles.alignBtnText, { color: theme.colors.text }]}>Cell Justify</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Row Controls</Text>
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

                <Text style={styles.sectionLabel}>Border & Column Style</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionGridBtn, { flex: 1, backgroundColor: "#f8fafc" }]}
                    onPress={() => {
                      onToggleBorders?.();
                      onClose();
                    }}
                  >
                    <Ionicons name="scan-outline" size={18} color={theme.colors.primary} />
                    <Text style={[styles.actionGridText, { color: theme.colors.primary, fontWeight: "700" }]}>
                      Toggle Borders (Visible ↔ Borderless Columns)
                    </Text>
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

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Keep Element</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: Theme, bottomInset: number = 0) =>
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
      paddingTop: 18,
      paddingHorizontal: 18,
      paddingBottom: Math.max(bottomInset, 16),
      maxHeight: Dimensions.get("window").height * 0.78,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
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
      marginBottom: 12,
    },
    scrollArea: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingBottom: 16,
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
      marginBottom: 4,
      marginTop: 4,
    },
    sectionHint: {
      fontSize: 11,
      color: theme.colors.subText,
      marginBottom: 8,
    },
    alignBtnRow: {
      flexDirection: "row",
      gap: 6,
      marginBottom: 8,
    },
    alignBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 9,
      paddingHorizontal: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    alignBtnText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
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
