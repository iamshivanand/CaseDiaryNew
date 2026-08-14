import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { ThemeContext } from "../../Providers/ThemeProvider";
import {
  AVAILABLE_CAUSE_LIST_FIELDS,
  AVAILABLE_SORT_OPTIONS,
  DEFAULT_SELECTED_FIELD_IDS,
  DEFAULT_SORT_CONFIG,
  SortConfig,
  getCauseListSelectedFields,
  getCauseListSortConfig,
  saveCauseListSelectedFields,
  saveCauseListSortConfig,
} from "../../utils/causeListConfig";

interface CauseListCustomizerModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (
    selectedFields: string[],
    sortField: string,
    sortDirection: "asc" | "desc"
  ) => void;
  title?: string;
}

export const CauseListCustomizerModal: React.FC<
  CauseListCustomizerModalProps
> = ({
  visible,
  onClose,
  onGenerate,
  title = "Customize Cause List PDF",
}) => {
  const { theme } = useContext(ThemeContext);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      Promise.all([getCauseListSelectedFields(), getCauseListSortConfig()])
        .then(([fields, sort]) => {
          setSelectedFieldIds(fields);
          setSortConfig(sort);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [visible]);

  const toggleField = (id: string) => {
    setSelectedFieldIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          // Keep at least one field selected
          return prev;
        }
        return prev.filter((f) => f !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedFieldIds(AVAILABLE_CAUSE_LIST_FIELDS.map((f) => f.id));
  };

  const handleResetToDefault = () => {
    setSelectedFieldIds([...DEFAULT_SELECTED_FIELD_IDS]);
    setSortConfig({ ...DEFAULT_SORT_CONFIG });
  };

  const toggleSortDirection = () => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectSortField = (fieldId: string) => {
    setSortConfig((prev) => ({
      ...prev,
      field: fieldId,
    }));
  };

  const handleConfirm = async () => {
    await saveCauseListSelectedFields(selectedFieldIds);
    await saveCauseListSortConfig(sortConfig);
    onClose();
    // Yield to allow the modal to unmount cleanly on Android before initiating PDF & Alert
    setTimeout(() => {
      onGenerate(selectedFieldIds, sortConfig.field, sortConfig.direction);
    }, 150);
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
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                Each case occupies a single compact line for maximum page density.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Mandatory Columns Info Banner */}
              <View style={styles.mandatoryCard}>
                <View style={styles.mandatoryRow}>
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={theme.colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.mandatoryTitle}>
                    Mandatory Fixed Columns:
                  </Text>
                </View>
                <View style={styles.mandatoryPillsContainer}>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>1. S.No (First)</Text>
                  </View>
                  <View style={styles.mandatoryPill}>
                    <Text style={styles.mandatoryPillText}>
                      Last. Notes / Next Date (Blank Box)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sort Section */}
              <View style={styles.sortSection}>
                <View style={styles.sortHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="funnel-outline"
                      size={16}
                      color={theme.colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.sectionHeader}>Sort Cases By:</Text>
                  </View>
                  {sortConfig.field !== "default" && (
                    <TouchableOpacity
                      onPress={toggleSortDirection}
                      style={styles.sortDirectionBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={
                          sortConfig.direction === "asc"
                            ? "arrow-up"
                            : "arrow-down"
                        }
                        size={14}
                        color={theme.colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.sortDirectionText}>
                        {sortConfig.direction === "asc" ? "Ascending" : "Descending"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sortOptionsRow}
                >
                  {AVAILABLE_SORT_OPTIONS.map((opt) => {
                    const isSelected = sortConfig.field === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => handleSelectSortField(opt.id)}
                        activeOpacity={0.7}
                        style={[
                          styles.sortChip,
                          isSelected && styles.sortChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sortChipText,
                            isSelected && styles.sortChipTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Visible Columns Quick Actions */}
              <View style={styles.quickActionsRow}>
                <Text style={styles.sectionHeader}>Select Visible Columns:</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleSelectAll}
                    style={styles.secondaryActionChip}
                  >
                    <Text style={styles.secondaryActionText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleResetToDefault}
                    style={styles.secondaryActionChip}
                  >
                    <Text style={styles.secondaryActionText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field Checkboxes */}
              <View style={styles.fieldsGrid}>
                {AVAILABLE_CAUSE_LIST_FIELDS.map((field) => {
                  const isSelected = selectedFieldIds.includes(field.id);
                  return (
                    <TouchableOpacity
                      key={field.id}
                      activeOpacity={0.7}
                      onPress={() => toggleField(field.id)}
                      style={[
                        styles.fieldItem,
                        isSelected && styles.fieldItemSelected,
                      ]}
                    >
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={20}
                        color={
                          isSelected
                            ? theme.colors.primary
                            : theme.colors.textSecondary || "#9CA3AF"
                        }
                        style={{ marginRight: 10 }}
                      />
                      <Text
                        style={[
                          styles.fieldLabel,
                          isSelected && styles.fieldLabelSelected,
                        ]}
                      >
                        {field.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.actionBtn, styles.cancelBtn]}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.actionBtn, styles.generateBtn]}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.generateBtnText}>Generate PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    container: {
      width: "100%",
      maxWidth: 460,
      maxHeight: "88%",
      backgroundColor: theme.colors.cardBackground || theme.colors.background,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border || "#E5E7EB",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || "#E5E7EB",
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary || "#6B7280",
      marginTop: 4,
    },
    closeButton: {
      padding: 4,
      marginLeft: 8,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollView: {
      maxHeight: 420,
    },
    mandatoryCard: {
      backgroundColor: `${theme.colors.primary}0D`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}33`,
      borderRadius: 10,
      padding: 10,
      marginBottom: 14,
    },
    mandatoryRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    mandatoryTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    mandatoryPillsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    mandatoryPill: {
      backgroundColor: theme.colors.cardBackground || "#FFFFFF",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border || "#E5E7EB",
    },
    mandatoryPillText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.colors.text,
    },
    sortSection: {
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || "#E5E7EB",
    },
    sortHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    sortDirectionBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${theme.colors.primary}15`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    sortDirectionText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    sortOptionsRow: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 2,
    },
    sortChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border || "#E5E7EB",
      backgroundColor: theme.colors.background,
    },
    sortChipSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}18`,
    },
    sortChipText: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.colors.textSecondary || "#6B7280",
    },
    sortChipTextSelected: {
      fontWeight: "700",
      color: theme.colors.primary,
    },
    quickActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      marginTop: 4,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.text,
    },
    secondaryActionChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: `${theme.colors.primary}12`,
    },
    secondaryActionText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    fieldsGrid: {
      flexDirection: "column",
      gap: 8,
    },
    fieldItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border || "#E5E7EB",
      backgroundColor: theme.colors.background,
    },
    fieldItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}08`,
    },
    fieldLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary || "#4B5563",
      fontWeight: "500",
      flex: 1,
    },
    fieldLabelSelected: {
      color: theme.colors.text,
      fontWeight: "600",
    },
    footer: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border || "#E5E7EB",
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    cancelBtn: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.colors.border || "#D1D5DB",
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textSecondary || "#6B7280",
    },
    generateBtn: {
      backgroundColor: theme.colors.primary,
    },
    generateBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
