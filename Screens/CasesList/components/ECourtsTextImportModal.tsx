import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React, { useState, useContext } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";

import { useTranslation } from "../../../Providers/LanguageProvider";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { bulkInsertCases } from "../../../utils/backupManager";
import { getCurrentUserId } from "../../../utils/commonFunctions";
import {
  parseECourtsTxtFile,
  ParsedTextCase,
} from "../../../utils/ecourtsParser";
import { checkDuplicateAndDiffCases } from "../../../utils/caseMapper";
import { getDb } from "../../../DataBase";
import ActionButton from "../../CommonComponents/ActionButton";
import { useAdTrigger } from "../../CommonComponents/AdManager";

interface ECourtsTextImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ECourtsTextImportModal: React.FC<ECourtsTextImportModalProps> = ({
  visible,
  onClose,
  onImportSuccess,
}) => {
  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();
  const { showAdWithPreload } = useAdTrigger();

  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [scannedCases, setScannedCases] = useState<ParsedTextCase[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setFileName(result.assets[0].name);

      setIsScanning(true);
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const parsed = parseECourtsTxtFile(text);

      if (parsed.length === 0) {
        Alert.alert(
          t("alert_error") || "Error",
          locale === "hi"
            ? "इस फ़ाइल से कोई केस रिकॉर्ड नहीं मिल सका। कृपया फ़ाइल की जाँच करें।"
            : "Could not find any case records in this file. Please verify the content."
        );
      } else {
        const db = await getDb();
        const existingCases = await db.getAllAsync<any>(
          "SELECT * FROM Cases"
        );
        const marked = checkDuplicateAndDiffCases(parsed, existingCases);
        const sorted = [...marked].sort((a, b) => {
          const scoreA = (!a.alreadyExists || a.hasUpdates) ? 1 : 0;
          const scoreB = (!b.alreadyExists || b.hasUpdates) ? 1 : 0;
          return scoreB - scoreA;
        });
        setScannedCases(sorted);

        const initialSelected: number[] = [];
        sorted.forEach((c, idx) => {
          if (!c.alreadyExists || c.hasUpdates) {
            initialSelected.push(idx);
          }
        });
        setSelectedIndices(initialSelected);
      }
    } catch (err) {
      console.error("Error loading file:", err);
      Alert.alert("Error", "Failed to load the text file.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanPastedText = async () => {
    if (!pastedText.trim()) {
      Alert.alert(
        t("alert_error") || "Error",
        locale === "hi"
          ? "कृपया स्कैन करने के लिए कुछ टेक्स्ट पेस्ट करें।"
          : "Please paste some text to scan."
      );
      return;
    }

    setIsScanning(true);
    try {
      const parsed = parseECourtsTxtFile(pastedText);
      if (parsed.length === 0) {
        Alert.alert(
          t("alert_error") || "Error",
          locale === "hi"
            ? "पेस्ट किए गए टेक्स्ट से कोई केस नहीं मिला।"
            : "Could not detect any cases in the pasted text."
        );
      } else {
        const db = await getDb();
        const existingCases = await db.getAllAsync<any>(
          "SELECT * FROM Cases"
        );
        const marked = checkDuplicateAndDiffCases(parsed, existingCases);
        const sorted = [...marked].sort((a, b) => {
          const scoreA = (!a.alreadyExists || a.hasUpdates) ? 1 : 0;
          const scoreB = (!b.alreadyExists || b.hasUpdates) ? 1 : 0;
          return scoreB - scoreA;
        });
        setScannedCases(sorted);

        const initialSelected: number[] = [];
        sorted.forEach((c, idx) => {
          if (!c.alreadyExists || c.hasUpdates) {
            initialSelected.push(idx);
          }
        });
        setSelectedIndices(initialSelected);
      }
    } catch (err) {
      console.error("Error scanning text:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelectIndex = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((idx) => idx !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleImport = async () => {
    if (selectedIndices.length === 0) {
      Alert.alert(
        t("alert_error") || "Error",
        locale === "hi"
          ? "कृपया आयात करने के लिए कम से कम एक केस चुनें।"
          : "Please select at least one case to import."
      );
      return;
    }

    await showAdWithPreload("rewarded", async (adSuccess) => {
      if (!adSuccess) return;

      setIsImporting(true);
      try {
        const userId = await getCurrentUserId();
        const casesToImport = scannedCases.filter((_, idx) =>
          selectedIndices.includes(idx)
        );

        const count = await bulkInsertCases(casesToImport, userId);

        Alert.alert(
          locale === "hi" ? "सफलता" : "Success",
          locale === "hi"
            ? `${count} केस सफलतापूर्वक आयात किए गए।`
            : `Successfully imported ${count} cases.`,
          [
            {
              text: "OK",
              onPress: () => {
                setScannedCases([]);
                setSelectedIndices([]);
                setFileName("");
                setPastedText("");
                onImportSuccess();
                onClose();
              },
            },
          ]
        );
      } catch (err) {
        console.error("Error importing cases:", err);
        Alert.alert("Error", "Failed to save imported cases to database.");
      } finally {
        setIsImporting(false);
      }
    });
  };

  const renderCaseItem = ({
    item,
    index,
  }: {
    item: ParsedTextCase;
    index: number;
  }) => {
    const isSelected = selectedIndices.includes(index);
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.caseCard,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
        onPress={() => toggleSelectIndex(index)}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text
              style={[styles.caseTitleText, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {item.CaseTitle}
            </Text>
            {item.alreadyExists && (
              item.hasUpdates ? (
                <View style={[styles.badgeContainer, { backgroundColor: "#e67e2215", borderColor: "#e67e22" }]}>
                  <Ionicons name="sync-outline" size={14} color="#e67e22" style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: "#e67e22" }]}>
                    {locale === "hi" ? "केस में बदलाव हैं" : "Case Has Updates"}
                  </Text>
                </View>
              ) : (
                <View style={[styles.badgeContainer, { backgroundColor: theme.colors.warning + "15" }]}>
                  <Ionicons name="warning-outline" size={14} color={theme.colors.warning} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: theme.colors.warning }]}>
                    {locale === "hi" ? "केस पहले से मौजूद है" : "Case Already Exists"}
                  </Text>
                </View>
              )
            )}
          </View>
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={22}
            color={
              isSelected ? theme.colors.primary : theme.colors.textSecondary
            }
          />
        </View>
        <View style={styles.cardDetails}>
          {item.CNRNumber && (
            <Text
              style={[styles.detailText, { color: theme.colors.textSecondary }]}
            >
              <Text style={{ fontWeight: "bold" }}>CNR: </Text>
              {item.CNRNumber}
            </Text>
          )}
          {item.case_number && (
            <Text
              style={[styles.detailText, { color: theme.colors.textSecondary }]}
            >
              <Text style={{ fontWeight: "bold" }}>Case No: </Text>
              {item.case_number}
            </Text>
          )}
          {item.court_name && (
            <Text
              style={[styles.detailText, { color: theme.colors.textSecondary }]}
            >
              <Text style={{ fontWeight: "bold" }}>Court: </Text>
              {item.court_name}
            </Text>
          )}
          {item.NextDate && (
            <Text
              style={[styles.detailText, { color: theme.colors.textSecondary }]}
            >
              <Text style={{ fontWeight: "bold" }}>Next Date: </Text>
              {formatDate(item.NextDate)}
            </Text>
          )}
          {item.hasUpdates && item.changes && (
            <View style={{ marginTop: 8, padding: 8, backgroundColor: "#e67e2208", borderRadius: 4, borderWidth: 0.5, borderColor: "#e67e2230" }}>
              <Text style={{ fontWeight: "bold", fontSize: 12, color: "#e67e22", marginBottom: 4 }}>
                {locale === "hi" ? "बदलाव पाए गए:" : "Updates Found:"}
              </Text>
              {Object.keys(item.changes).map(key => {
                const change = item.changes![key];
                let displayKey = key;
                if (key === "NextDate") displayKey = locale === "hi" ? "अगली तारीख" : "Next Date";
                else if (key === "PreviousDate") displayKey = locale === "hi" ? "पिछली तारीख" : "Previous Date";
                else if (key === "CaseNotes") displayKey = locale === "hi" ? "टिप्पणी" : "Notes";
                else if (key === "court_name") displayKey = locale === "hi" ? "न्यायालय" : "Court";
                else if (key === "case_type_name") displayKey = locale === "hi" ? "केस का प्रकार" : "Case Type";
                else if (key === "Undersection") displayKey = locale === "hi" ? "धारा" : "Section";
                else if (key === "JudgeName") displayKey = locale === "hi" ? "न्यायाधीश" : "Judge";
                else if (key === "OpposingCounsel") displayKey = locale === "hi" ? "विपक्षी वकील" : "Opposing Counsel";
                
                const oldValStr = key.includes("Date") ? formatDate(change.oldValue) : change.oldValue;
                const newValStr = key.includes("Date") ? formatDate(change.newValue) : change.newValue;
                return (
                  <Text key={key} style={{ fontSize: 11, color: theme.colors.text, marginTop: 2 }}>
                    • {displayKey}: <Text style={{ textDecorationLine: "line-through", color: theme.colors.textSecondary }}>{oldValStr}</Text> ➔ <Text style={{ fontWeight: "bold" }}>{newValStr}</Text>
                  </Text>
                );
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {locale === "hi" ? "eCourts केस आयात करें" : "Import eCourts Cases"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {scannedCases.length === 0 ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text
              style={[styles.infoText, { color: theme.colors.textSecondary }]}
            >
              {locale === "hi"
                ? "eCourts Services ऐप से अपना केस पोर्टफोलियो (.txt फ़ाइल) निर्यात करें और यहाँ लोड करें।"
                : "Export your My Cases portfolio from eCourts Services app as a text file to import it here."}
            </Text>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "file"
                    ? { backgroundColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.border },
                ]}
                onPress={() => setActiveTab("file")}
              >
                <Text
                  style={
                    activeTab === "file"
                      ? styles.activeTabText
                      : { color: theme.colors.text }
                  }
                >
                  {locale === "hi" ? "फ़ाइल अपलोड करें" : "Upload File"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "paste"
                    ? { backgroundColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.border },
                ]}
                onPress={() => setActiveTab("paste")}
              >
                <Text
                  style={
                    activeTab === "paste"
                      ? styles.activeTabText
                      : { color: theme.colors.text }
                  }
                >
                  {locale === "hi" ? "टेक्स्ट पेस्ट करें" : "Paste Text"}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === "file" ? (
              <View style={styles.fileSection}>
                <TouchableOpacity
                  style={[
                    styles.uploadBox,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.cardBackground,
                    },
                  ]}
                  onPress={handlePickDocument}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={48}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[styles.uploadText, { color: theme.colors.text }]}
                  >
                    {fileName
                      ? fileName
                      : locale === "hi"
                        ? "myCases.txt चुनें"
                        : "Select myCases.txt"}
                  </Text>
                  <Text
                    style={[
                      styles.uploadSubText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {locale === "hi"
                      ? "या डिवाइस में फ़ाइल ढूंढें"
                      : "Or select backup file from device storage"}
                  </Text>
                </TouchableOpacity>

                {isScanning && (
                  <ActivityIndicator
                    style={{ marginTop: 20 }}
                    color={theme.colors.primary}
                    size="large"
                  />
                )}
              </View>
            ) : (
              <View style={styles.pasteSection}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.colors.cardBackground,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  multiline
                  numberOfLines={10}
                  placeholder={
                    locale === "hi"
                      ? "eCourts साझा किया गया टेक्स्ट यहाँ पेस्ट करें..."
                      : "Paste the shared eCourts cases text format here..."
                  }
                  placeholderTextColor={theme.colors.textSecondary}
                  value={pastedText}
                  onChangeText={setPastedText}
                />

                <View style={{ marginTop: 16 }}>
                  <ActionButton
                    title={locale === "hi" ? "टेक्स्ट स्कैन करें" : "Scan Text"}
                    onPress={handleScanPastedText}
                    type="primary"
                    disabled={isScanning}
                    loading={isScanning}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
                {locale === "hi"
                  ? `आयात के लिए ${scannedCases.length} केस मिले`
                  : `Found ${scannedCases.length} Cases to Import`}
              </Text>
              <TouchableOpacity
                style={{ padding: 4 }}
                onPress={() => {
                  if (selectedIndices.length === scannedCases.length) {
                    setSelectedIndices([]);
                  } else {
                    setSelectedIndices(scannedCases.map((_, idx) => idx));
                  }
                }}
              >
                <Text
                  style={{ color: theme.colors.primary, fontWeight: "bold" }}
                >
                  {selectedIndices.length === scannedCases.length
                    ? locale === "hi"
                      ? "सभी को अचयनित करें"
                      : "Deselect All"
                    : locale === "hi"
                      ? "सभी चुनें"
                      : "Select All"}
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={scannedCases}
              renderItem={renderCaseItem}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={{ padding: 16 }}
            />

            <View
              style={[styles.footer, { borderTopColor: theme.colors.border }]}
            >
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                onPress={() => setScannedCases([])}
              >
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontWeight: "600",
                  }}
                >
                  {locale === "hi" ? "पीछे जाएं" : "Go Back"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.importBtn,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: selectedIndices.length > 0 ? 1 : 0.6,
                  },
                ]}
                onPress={handleImport}
                disabled={isImporting || selectedIndices.length === 0}
              >
                {isImporting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    {locale === "hi"
                      ? `${selectedIndices.length} केस आयात करें`
                      : `Import (${selectedIndices.length}) Cases`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  fileSection: {
    alignItems: "center",
    paddingVertical: 20,
    width: "100%",
  },
  uploadBox: {
    width: "100%",
    height: 180,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
  },
  uploadSubText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  pasteSection: {
    width: "100%",
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 180,
    textAlignVertical: "top",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  caseCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  caseTitleText: {
    fontSize: 15,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  cardDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  importBtn: {
    flex: 2,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
