import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";

import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { bulkInsertCases } from "../../utils/backupManager";
import { getCurrentUserId } from "../../utils/commonFunctions";
import { parseECourtsTxtFile, ParsedTextCase } from "../../utils/ecourtsParser";
import { checkDuplicateAndDiffCases } from "../../utils/caseMapper";
import { getDb } from "../../DataBase";
import ActionButton from "../CommonComponents/ActionButton";
import { useAdTrigger } from "../CommonComponents/AdManager";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=gov.ecourts.ecourtsServices";
const APP_STORE_URL =
  "https://apps.apple.com/in/app/ecourts-services/id1225884976";

const ECourtsAppImportScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();
  const { showAdWithPreload } = useAdTrigger();

  const [detectedFile, setDetectedFile] = useState<{
    name: string;
    uri: string;
  } | null>(null);
  const [scannedCases, setScannedCases] = useState<ParsedTextCase[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Auto-scan Downloads folder on mount
  useEffect(() => {
    autoScanDownloads();
  }, []);

  const autoScanDownloads = async () => {
    if (Platform.OS !== "android") return;
    try {
      setIsScanning(true);
      const downloadDir = "file:///storage/emulated/0/Download/";
      const files = await FileSystem.readDirectoryAsync(downloadDir);

      const textFiles = files.filter((f) => f.toLowerCase().endsWith(".txt"));
      const candidates: { name: string; uri: string; mtime: number }[] = [];

      for (const file of textFiles) {
        const fileUri = downloadDir + file;
        try {
          const info = await FileSystem.getInfoAsync(fileUri);
          if (info.exists && !info.isDirectory) {
            candidates.push({
              name: file,
              uri: fileUri,
              mtime: info.modificationTime || 0,
            });
          }
        } catch (e) {
          // ignore
        }
      }

      // Sort by modified time descending (newest first)
      candidates.sort((a, b) => b.mtime - a.mtime);

      // Check first 3 files
      for (const fileObj of candidates.slice(0, 3)) {
        const snippet = await FileSystem.readAsStringAsync(fileObj.uri, {
          length: 1500,
        });
        const lowerSnippet = snippet.toLowerCase();
        if (
          lowerSnippet.includes("cnr") ||
          lowerSnippet.includes("case number") ||
          lowerSnippet.includes("hearing date") ||
          snippet.includes("|") ||
          snippet.includes(";")
        ) {
          setDetectedFile(fileObj);
          break;
        }
      }
    } catch (err) {
      console.log("Could not auto-scan downloads folder:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenECourtsApp = async () => {
    if (Platform.OS === "android") {
      try {
        await IntentLauncher.startActivityAsync("android.intent.action.MAIN", {
          category: "android.intent.category.LAUNCHER",
          packageName: "gov.ecourts.ecourtsServices",
        });
      } catch (err) {
        Alert.alert(
          locale === "hi" ? "ऐप नहीं मिला" : "eCourts App Not Found",
          locale === "hi"
            ? "eCourts Services ऐप इस डिवाइस पर इंस्टॉल नहीं है। क्या आप इसे Google Play Store से डाउनलोड करना चाहते हैं?"
            : "eCourts Services app is not installed on this device. Would you like to install it from the Google Play Store?",
          [
            { text: t("alert_cancel") || "Cancel", style: "cancel" },
            {
              text: locale === "hi" ? "इंस्टॉल करें" : "Install",
              onPress: () => Linking.openURL(PLAY_STORE_URL),
            },
          ]
        );
      }
    } else {
      Alert.alert(
        locale === "hi" ? "ऐप खोलें" : "Open eCourts Services",
        locale === "hi"
          ? "कृपया eCourts Services ऐप खोलें और अपने केस पोर्टफोलियो को बैकअप के रूप में एक्सपोर्ट करें। यदि यह इंस्टॉल नहीं है, तो आप इसे ऐप स्टोर से डाउनलोड कर सकते हैं।"
          : "Please open the eCourts Services app manually to export your cases portfolio. If you don't have it installed, you can download it from the App Store.",
        [
          { text: t("alert_cancel") || "Cancel", style: "cancel" },
          {
            text: locale === "hi" ? "ऐप स्टोर खोलें" : "Open App Store",
            onPress: () => Linking.openURL(APP_STORE_URL),
          },
        ]
      );
    }
  };

  const handleLoadDetectedFile = async () => {
    if (!detectedFile) return;
    try {
      setIsScanning(true);
      const text = await FileSystem.readAsStringAsync(detectedFile.uri);
      await processFileText(text);
    } catch (err) {
      Alert.alert("Error", "Failed to read the detected file.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsScanning(true);
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
      await processFileText(text);
    } catch (err) {
      Alert.alert("Error", "Failed to read selected document.");
    } finally {
      setIsScanning(false);
    }
  };

  const processFileText = async (text: string) => {
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
  };

  const toggleSelectIndex = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((idx) => idx !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const selectAll = () => {
    setSelectedIndices(scannedCases.map((_, idx) => idx));
  };

  const deselectAll = () => {
    setSelectedIndices([]);
  };

  const handleImportSelected = async () => {
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
            ? `${count} केस सफलतापूर्वक डायरी में आयात किए गए।`
            : `Successfully imported ${count} cases into your diary.`,
          [
            {
              text: "OK",
              onPress: () => {
                setScannedCases([]);
                setSelectedIndices([]);
                setDetectedFile(null);
                autoScanDownloads();
              },
            },
          ]
        );
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to save cases to case diary.");
      } finally {
        setIsImporting(false);
      }
    });
  };

  const handleImportIndividual = async (item: ParsedTextCase) => {
    await showAdWithPreload("rewarded", async (adSuccess) => {
      if (!adSuccess) return;

      setIsImporting(true);
      try {
        const userId = await getCurrentUserId();
        const count = await bulkInsertCases([item], userId);

        Alert.alert(
          locale === "hi" ? "सफलता" : "Success",
          locale === "hi"
            ? "केस सफलतापूर्वक आयात किया गया।"
            : "Case successfully imported into your diary.",
          [
            {
              text: "OK",
              onPress: () => {
                // Remove the imported case from the list
                setScannedCases((prev) => prev.filter((c) => c !== item));
                setSelectedIndices((prev) =>
                  prev.filter((idx) => idx < scannedCases.length - 1)
                );
              },
            },
          ]
        );
      } catch (err) {
        Alert.alert("Error", "Failed to save case.");
      } finally {
        setIsImporting(false);
      }
    });
  };

  const renderCaseCard = ({
    item,
    index,
  }: {
    item: ParsedTextCase;
    index: number;
  }) => {
    const isSelected = selectedIndices.includes(index);
    return (
      <View
        style={[
          styles.caseCard,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.border,
            borderWidth: isSelected ? 1.5 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cardSelectableArea}
          onPress={() => toggleSelectIndex(index)}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text
                style={[styles.caseTitle, { color: theme.colors.text }]}
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
              size={24}
              color={
                isSelected ? theme.colors.primary : theme.colors.textSecondary
              }
            />
          </View>

          <View style={styles.metaRow}>
            <Text
              style={[styles.metaLabel, { color: theme.colors.textSecondary }]}
            >
              CNR No:
            </Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>
              {item.CNRNumber || "N/A"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text
              style={[styles.metaLabel, { color: theme.colors.textSecondary }]}
            >
              Case No:
            </Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>
              {item.case_number || "N/A"}
            </Text>
          </View>

          {item.court_name && (
            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.metaLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Court:
              </Text>
              <Text
                style={[styles.metaValue, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {item.court_name}
              </Text>
            </View>
          )}

          {item.NextDate && (
            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.metaLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Next Date:
              </Text>
              <Text
                style={[styles.hearingDate, { color: theme.colors.primary }]}
              >
                {formatDate(item.NextDate)}
              </Text>
            </View>
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
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.importIndividualButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => handleImportIndividual(item)}
          >
            <Ionicons
              name="download-outline"
              size={16}
              color={theme.colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              {locale === "hi" ? "आयात करें" : "Import Single"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {scannedCases.length === 0 ? (
        <ScrollView contentContainerStyle={styles.introScrollContainer}>
          {/* Top Instruction Header Card */}
          <View
            style={[
              styles.instructionCard,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${theme.colors.primary}12` },
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <Text
              style={[styles.instructionsTitle, { color: theme.colors.text }]}
            >
              {locale === "hi"
                ? "eCourts ऐप से केस आयात करें"
                : "Sync with eCourts Services App"}
            </Text>
            <Text
              style={[
                styles.instructionsDesc,
                { color: theme.colors.textSecondary },
              ]}
            >
              {locale === "hi"
                ? "eCourts ऐप में जाकर अपने मामलों को एक्सपोर्ट करें। हम डाउनलोड फ़ोल्डर में उत्पन्न फ़ाइल को स्वचालित रूप से खोजेंगे या आप इसे मैन्युअल रूप से चुन सकते हैं।"
                : "Guide: Open the eCourts Services app, go to My Cases, and export your portfolio as a backup text file. The app saves it in your Downloads folder."}
            </Text>

            <TouchableOpacity
              style={[
                styles.openAppButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleOpenECourtsApp}
            >
              <Ionicons
                name="open-outline"
                size={18}
                color="#FFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.openAppButtonText}>
                {locale === "hi" ? "eCourts ऐप खोलें" : "Open eCourts Services"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Automatic Detection Status Box */}
          {Platform.OS === "android" && (
            <View
              style={[
                styles.detectionBox,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.detectionTitle, { color: theme.colors.text }]}
              >
                {locale === "hi"
                  ? "स्वचालित खोज स्थिति"
                  : "Auto-Detection Status"}
              </Text>

              {isScanning ? (
                <View style={styles.detectionLoading}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.detectionLoadingText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Scanning Downloads...
                  </Text>
                </View>
              ) : detectedFile ? (
                <View style={styles.detectedContainer}>
                  <View style={styles.detectedFileInfo}>
                    <Ionicons
                      name="document-text"
                      size={24}
                      color="#10B981"
                      style={{ marginRight: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.detectedFileName,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {detectedFile.name}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: 11,
                        }}
                      >
                        Ready to load portfolio cases
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.loadDetectedButton,
                      { backgroundColor: "#10B981" },
                    ]}
                    onPress={handleLoadDetectedFile}
                  >
                    <Text style={styles.loadDetectedButtonText}>
                      {locale === "hi" ? "फाइल लोड करें" : "Load File"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.detectedContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.noFileDetectedText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    No eCourts export files detected automatically.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Manual File Picker Trigger */}
          <View style={styles.pickerSection}>
            <ActionButton
              title={
                locale === "hi"
                  ? "बैकअप फ़ाइल चुनें (.txt)"
                  : "Choose Backup File (.txt)"
              }
              onPress={handleManualPick}
              type="secondary"
            />
          </View>
        </ScrollView>
      ) : (
        // Cases Cards View
        <View style={styles.listContainer}>
          <View
            style={[
              styles.listHeaderActions,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.scanCountText, { color: theme.colors.text }]}>
              {locale === "hi"
                ? `खोजे गए: ${scannedCases.length} मामले`
                : `Detected Cases: ${scannedCases.length}`}
            </Text>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={selectAll}
                style={styles.headerActionButton}
              >
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Select All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={deselectAll}
                style={[styles.headerActionButton, { marginLeft: 12 }]}
              >
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Deselect All
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isImporting ? (
            <View style={styles.importingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text
                style={[styles.importingText, { color: theme.colors.text }]}
              >
                Saving cases to diary database...
              </Text>
            </View>
          ) : (
            <FlatList
              data={scannedCases}
              renderItem={renderCaseCard}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.casesListContent}
            />
          )}

          {/* Sticky footer actions */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.cardBackground,
              },
            ]}
          >
            <ActionButton
              title={
                locale === "hi"
                  ? `चयनित आयात करें (${selectedIndices.length})`
                  : `Import Selected (${selectedIndices.length})`
              }
              onPress={handleImportSelected}
              type="primary"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ECourtsAppImportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  introScrollContainer: {
    padding: 16,
    alignItems: "center",
  },
  instructionCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  instructionsDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18,
  },
  openAppButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  openAppButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  detectionBox: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  detectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detectionLoading: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  detectionLoadingText: {
    marginLeft: 8,
    fontSize: 12.5,
  },
  detectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detectedFileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detectedFileName: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadDetectedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  loadDetectedButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  noFileDetectedText: {
    fontSize: 12,
  },
  pickerSection: {
    width: "100%",
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
  },
  listHeaderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scanCountText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  headerActionButton: {
    paddingVertical: 4,
  },
  casesListContent: {
    padding: 16,
    paddingBottom: 80,
  },
  caseCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardSelectableArea: {
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  caseTitle: {
    fontSize: 15,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  metaLabel: {
    width: 80,
    fontSize: 12.5,
  },
  metaValue: {
    flex: 1,
    fontSize: 12.5,
  },
  hearingDate: {
    fontSize: 12.5,
    fontWeight: "bold",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    paddingTop: 8,
  },
  importIndividualButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  importingOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  importingText: {
    marginTop: 12,
    fontSize: 14,
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
