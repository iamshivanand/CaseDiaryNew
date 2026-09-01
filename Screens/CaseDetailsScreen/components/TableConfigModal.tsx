// Screens/CaseDetailsScreen/components/TableConfigModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { Theme } from "../../../Providers/ThemeProvider";

interface TableConfigModalProps {
  visible: boolean;
  theme: Theme;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertBorderlessColumns?: (cols: 2 | 3) => void;
  onClose: () => void;
}

export const TableConfigModal: React.FC<TableConfigModalProps> = ({
  visible,
  theme,
  onInsertTable,
  onInsertBorderlessColumns,
  onClose,
}) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const handleConfirm = () => {
    onInsertTable(rows, cols);
    onClose();
  };

  const handleInsert2Col = () => {
    if (onInsertBorderlessColumns) {
      onInsertBorderlessColumns(2);
    } else {
      onInsertTable(1, 2);
    }
    onClose();
  };

  const handleInsert3Col = () => {
    if (onInsertBorderlessColumns) {
      onInsertBorderlessColumns(3);
    } else {
      onInsertTable(1, 3);
    }
    onClose();
  };

  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons
                name="grid-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.title}>Insert Table or Columns</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="close-table-modal">
              <Ionicons name="close" size={22} color={theme.colors.subText} />
            </TouchableOpacity>
          </View>

          {/* Quick Borderless Multi-Column Presets */}
          <Text style={styles.sectionHeading}>QUICK MULTI-COLUMN (NO BORDERS)</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={handleInsert2Col}
              testID="insert-2col-preset-btn"
            >
              <Ionicons name="browsers-outline" size={18} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.presetTitle}>2-Column Split</Text>
                <Text style={styles.presetSub}>Memo of parties, signatures, grounds</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtn}
              onPress={handleInsert3Col}
              testID="insert-3col-preset-btn"
            >
              <Ionicons name="grid-outline" size={18} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.presetTitle}>3-Column Split</Text>
                <Text style={styles.presetSub}>Tripartite details or 3-way notes</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionHeading, { marginTop: 14 }]}>CUSTOM COURT TABLE GRID</Text>
          <Text style={styles.subtitle}>
            Select rows and columns for schedules, document index, or evidence lists:
          </Text>

          {/* Rows Selector */}
          <View style={styles.counterRow}>
            <Text style={styles.label}>Rows (1 - 10):</Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={[styles.counterBtn, rows <= 1 && styles.disabledBtn]}
                onPress={() => setRows((r) => Math.max(1, r - 1))}
                disabled={rows <= 1}
                testID="decrement-rows-btn"
              >
                <Ionicons name="remove" size={18} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{rows}</Text>
              <TouchableOpacity
                style={[styles.counterBtn, rows >= 10 && styles.disabledBtn]}
                onPress={() => setRows((r) => Math.min(10, r + 1))}
                disabled={rows >= 10}
                testID="increment-rows-btn"
              >
                <Ionicons name="add" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Columns Selector */}
          <View style={styles.counterRow}>
            <Text style={styles.label}>Columns (1 - 10):</Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={[styles.counterBtn, cols <= 1 && styles.disabledBtn]}
                onPress={() => setCols((c) => Math.max(1, c - 1))}
                disabled={cols <= 1}
                testID="decrement-cols-btn"
              >
                <Ionicons name="remove" size={18} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{cols}</Text>
              <TouchableOpacity
                style={[styles.counterBtn, cols >= 10 && styles.disabledBtn]}
                onPress={() => setCols((c) => Math.min(10, c + 1))}
                disabled={cols >= 10}
                testID="increment-cols-btn"
              >
                <Ionicons name="add" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Table Preview Tag */}
          <View style={styles.previewTag}>
            <Text style={styles.previewText}>
              Will insert a {rows} x {cols} table with headers
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.insertBtn}
              onPress={handleConfirm}
              testID="confirm-insert-table-btn"
            >
              <Text style={styles.insertText}>Insert Grid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 20,
    },
    content: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 20,
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
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.subText,
      marginBottom: 16,
    },
    counterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    counterControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      padding: 4,
    },
    counterBtn: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: theme.colors.cardBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    disabledBtn: {
      opacity: 0.4,
    },
    counterValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.primary,
      minWidth: 24,
      textAlign: "center",
    },
    previewTag: {
      backgroundColor: `${theme.colors.primary}12`,
      borderColor: `${theme.colors.primary}40`,
      borderWidth: 1,
      borderRadius: 6,
      padding: 8,
      alignItems: "center",
      marginBottom: 20,
    },
    previewText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    sectionHeading: {
      fontSize: 11,
      fontWeight: "bold",
      color: theme.colors.subText,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    presetRow: {
      flexDirection: "column",
      gap: 8,
      marginBottom: 8,
    },
    presetBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    presetTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    presetSub: {
      fontSize: 11,
      color: theme.colors.subText,
      marginTop: 2,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12,
    },
    cancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.inputBackground,
    },
    cancelText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    insertBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    insertText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "bold",
    },
  });
