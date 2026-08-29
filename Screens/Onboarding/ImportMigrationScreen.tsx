// Screens/Onboarding/ImportMigrationScreen.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";

import { addUser, getDb } from "../../DataBase";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import {
  analyzeImportRows,
  executeBulkUpsert,
  generateCasesCSV,
  generateSampleTemplateCSV,
  parseCsvContent,
  shareCsvFile,
  AnalyzedCaseItem,
  BulkUpsertResult,
} from "../../utils/bulkCaseManager";
import { parseECourtsTxtFile } from "../../utils/ecourtsParser";
import { emitter } from "../../utils/event-emitter";
import ActionButton from "../CommonComponents/ActionButton";

interface RouteParams {
  isFromOnboarding?: boolean;
}

const TARGET_FIELDS = [
  {
    key: "CaseTitle",
    label: "Case Title / Name *",
    synonyms: ["title", "name", "case", "suit", "casetitle"],
  },
  {
    key: "ClientName",
    label: "Client / Petitioner",
    synonyms: ["client", "customer", "firstparty", "petitioner", "plaintiff", "applicant"],
  },
  {
    key: "OppositeParty",
    label: "Opposite Party / Respondent",
    synonyms: ["opposite", "respondent", "defendant", "party2", "secondparty", "accused"],
  },
  { key: "CNRNumber", label: "CNR Number", synonyms: ["cnr", "cnrnumber"] },
  {
    key: "case_number",
    label: "Case Number",
    synonyms: ["number", "case_number", "case_no", "suit_no"],
  },
  {
    key: "court_name",
    label: "Court Name",
    synonyms: ["court", "court_name", "forum", "bench"],
  },
  {
    key: "case_type",
    label: "Case Type",
    synonyms: ["type", "case_type", "casetype", "case_type_name"],
  },
  {
    key: "nextHearing",
    label: "Next Hearing Date",
    synonyms: ["next", "hearing", "next_date", "hearing_date", "nexthearing", "ndoh"],
  },
  {
    key: "previousHearing",
    label: "Previous Hearing Date",
    synonyms: ["previous", "prev_date", "prev", "previoushearing"],
  },
  {
    key: "stage_name",
    label: "Stage / Purpose",
    synonyms: ["stage", "purpose", "hearing_stage", "stage_name"],
  },
  {
    key: "total_fees",
    label: "Total Fee Agreed",
    synonyms: ["fee", "fees", "total_fee", "total_fees", "fee_agreed", "fee_total"],
  },
  {
    key: "fee_paid",
    label: "Fee Paid",
    synonyms: ["fee_paid", "paid_fee", "paid", "amount_paid", "fees_paid"],
  },
  {
    key: "CaseNotes",
    label: "Notes / Remarks",
    synonyms: ["notes", "internal_notes", "remarks", "casenotes"],
  },
  {
    key: "App_Case_ID",
    label: "App Case ID (For Bulk Updating)",
    synonyms: ["id", "app_case_id", "case_id"],
  },
];

const ImportMigrationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;
  const isFromOnboarding = params.isFromOnboarding ?? false;

  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();

  // Steps: 1 = Upload, 2 = Mapping, 3 = Dry-run Diff Preview, 4 = Progress, 5 = Complete
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loadingFile, setLoadingFile] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [isTxtImport, setIsTxtImport] = useState(false);

  // Dry-Run Analysis Data
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedCaseItem[]>([]);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "NEW" | "UPDATE" | "UNCHANGED" | "ERROR">("ALL");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Execution State
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [upsertResult, setUpsertResult] = useState<BulkUpsertResult | null>(null);

  // 1-Tap Template Download
  const handleDownloadTemplate = async () => {
    try {
      const templateCsv = generateSampleTemplateCSV();
      await shareCsvFile(templateCsv, "Advocase_Import_Template.csv");
    } catch (err: any) {
      Alert.alert(t("alert_error"), err.message || "Failed to download template.");
    }
  };

  // 1-Tap Export Current Cases
  const handleExportCurrentCases = async () => {
    try {
      const db = await getDb();
      const userIdStr = await AsyncStorage.getItem("@user_id");
      const userId = userIdStr ? parseInt(userIdStr, 10) : null;
      const cases = await db.getAllAsync<any>(
        "SELECT * FROM Cases WHERE user_id IS NULL OR user_id = ? ORDER BY id ASC",
        [userId]
      );
      if (!cases || cases.length === 0) {
        Alert.alert(
          locale === "en" ? "No Cases Found" : "कोई केस नहीं मिला",
          locale === "en"
            ? "There are no cases in your database to export."
            : "निर्यात करने के लिए आपके डेटाबेस में कोई केस नहीं है।"
        );
        return;
      }
      const csvContent = generateCasesCSV(cases);
      await shareCsvFile(csvContent, "Advocase_Cases_Full_Export.csv");
    } catch (err: any) {
      Alert.alert(t("alert_error"), err.message || "Failed to export cases.");
    }
  };

  // File Picker Handler
  const handleSelectFile = async () => {
    setLoadingFile(true);
    setIsTxtImport(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/comma-separated-values",
          "text/csv",
          "application/json",
          "text/plain",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setLoadingFile(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name.toLowerCase();
      const content = await FileSystem.readAsStringAsync(fileUri);

      let parsedHeaders: string[] = [];
      let rows: any[] = [];

      if (fileName.endsWith(".txt")) {
        const parsed = parseECourtsTxtFile(content);
        if (parsed.length === 0) {
          throw new Error("Could not find any case records in this eCourts file.");
        }
        setParsedRows(parsed);
        setIsTxtImport(true);

        // Analyze eCourts text directly
        await runDryRunAnalysis(parsed, {});
        return;
      }

      if (fileName.endsWith(".json")) {
        const json = JSON.parse(content);
        const dataArray = Array.isArray(json) ? json : [json];
        if (dataArray.length > 0) {
          parsedHeaders = Object.keys(dataArray[0]);
          rows = dataArray;
        }
      } else {
        // Assume CSV
        const csvGrid = parseCsvContent(content);
        if (csvGrid.length > 0) {
          parsedHeaders = csvGrid[0];
          rows = csvGrid.slice(1).map((row) => {
            const obj: any = {};
            parsedHeaders.forEach((header, index) => {
              obj[header] = row[index] || "";
            });
            return obj;
          });
        }
      }

      if (parsedHeaders.length === 0 || rows.length === 0) {
        throw new Error("No data records found in the selected file.");
      }

      setHeaders(parsedHeaders);
      setParsedRows(rows);

      // Auto-map headers
      const initialMappings: { [key: string]: string } = {};
      TARGET_FIELDS.forEach((field) => {
        const matchedHeader = parsedHeaders.find((h) => {
          const cleanHeader = h.toLowerCase().replace(/[^a-z0-9]/g, "");
          return field.synonyms.some((syn) => cleanHeader.includes(syn));
        });
        initialMappings[field.key] = matchedHeader || "none";
      });

      setMappings(initialMappings);
      setStep(2);
    } catch (error: any) {
      console.error("Failed to parse file:", error);
      Alert.alert(t("alert_error"), error.message || "Could not read the uploaded file.");
    } finally {
      setLoadingFile(false);
    }
  };

  // Run dry-run analysis
  const runDryRunAnalysis = async (rawRows: any[], mappingConfig: Record<string, string>) => {
    setIsAnalyzing(true);
    try {
      const cachedUserId = await AsyncStorage.getItem("@user_id");
      const userId = cachedUserId ? parseInt(cachedUserId, 10) : null;
      const analyzed = await analyzeImportRows(rawRows, mappingConfig, userId);
      setAnalyzedItems(analyzed);
      setStep(3);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      Alert.alert(t("alert_error"), err.message || "Failed to analyze rows.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle selection for a single case item
  const toggleItemSelection = (index: number) => {
    setAnalyzedItems((prev) =>
      prev.map((item, i) =>
        i === index && item.action !== "ERROR" ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Select all or deselect all
  const toggleSelectAll = (select: boolean) => {
    setAnalyzedItems((prev) =>
      prev.map((item) => (item.action !== "ERROR" ? { ...item, selected: select } : item))
    );
  };

  // Start Bulk Upsert Execution
  const handleExecuteUpsert = async () => {
    const selectedCount = analyzedItems.filter((i) => i.selected && i.action !== "ERROR").length;
    if (selectedCount === 0) {
      Alert.alert(
        locale === "en" ? "No Cases Selected" : "कोई केस नहीं चुना गया",
        locale === "en"
          ? "Please select at least one valid case to import/update."
          : "कृपया आयात/अपडेट करने के लिए कम से कम एक केस चुनें।"
      );
      return;
    }

    setStep(4);
    setProgress({ current: 0, total: selectedCount });

    try {
      let userId: number | null = null;
      const cachedUserId = await AsyncStorage.getItem("@user_id");
      if (cachedUserId) {
        userId = parseInt(cachedUserId, 10);
      } else if (isFromOnboarding) {
        userId = await addUser("Advocate", "advocate@casediary.com");
        if (userId) {
          await AsyncStorage.setItem("@user_id", userId.toString());
        }
      }

      const result = await executeBulkUpsert(analyzedItems, userId, (curr, tot) => {
        setProgress({ current: curr, total: tot });
      });

      setUpsertResult(result);
      setStep(5);
    } catch (error: any) {
      console.error("Bulk upsert failed:", error);
      Alert.alert(t("alert_error"), error.message || "An error occurred during bulk update.");
      setStep(3);
    }
  };

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem("@onboarding_complete", "true");
    emitter.emit("onboardingComplete");
    if (!isFromOnboarding) {
      navigation.goBack();
    }
  };

  // Counts for tabs
  const newCount = analyzedItems.filter((i) => i.action === "NEW").length;
  const updateCount = analyzedItems.filter((i) => i.action === "UPDATE").length;
  const unchangedCount = analyzedItems.filter((i) => i.action === "UNCHANGED").length;
  const errorCount = analyzedItems.filter((i) => i.action === "ERROR").length;
  const selectedCount = analyzedItems.filter((i) => i.selected && i.action !== "ERROR").length;

  const filteredItems = analyzedItems.filter((item) => {
    if (previewFilter === "ALL") return true;
    return item.action === previewFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        {!isFromOnboarding && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {locale === "en" ? "Bulk Import & Case Updater" : "बल्क आयात और केस अपडेटर"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* STEP 1: UPLOAD & QUICK ACTIONS */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Ionicons
              name="cloud-upload-outline"
              size={72}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {locale === "en" ? "Import or Update Cases in Bulk" : "थोक में केस आयात या अपडेट करें"}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {locale === "en"
                ? "Upload a CSV spreadsheet, JSON, or eCourts (.txt) file to add new cases or update existing hearing dates, stages, fees, and notes in one click."
                : "नए केस जोड़ने या एक क्लिक में सुनवाई की तारीखें, चरण, फीस और नोट्स अपडेट करने के लिए सीएसवी स्प्रेडशीट, जेएसओएन, या ई-कोर्ट फ़ाइल अपलोड करें।"}
            </Text>

            {loadingFile ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <ActionButton
                title={locale === "en" ? "Select File to Import" : "आयात के लिए फ़ाइल चुनें"}
                onPress={handleSelectFile}
                type="primary"
                style={{ width: "100%", marginVertical: 12 }}
              />
            )}

            {/* Quick Action Tiles */}
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={[
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border },
                ]}
                onPress={handleDownloadTemplate}
              >
                <MaterialCommunityIcons name="file-excel-outline" size={28} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>
                    {locale === "en" ? "Download Excel Template" : "एक्सेल टेम्पलेट डाउनलोड करें"}
                  </Text>
                  <Text style={[styles.quickActionSub, { color: theme.colors.textSecondary }]}>
                    {locale === "en"
                      ? "Get a ready-to-fill spreadsheet with instructions"
                      : "निर्देशों के साथ तैयार स्प्रेडशीट प्राप्त करें"}
                  </Text>
                </View>
                <Ionicons name="download-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border },
                ]}
                onPress={handleExportCurrentCases}
              >
                <MaterialCommunityIcons name="export-variant" size={28} color="#6366F1" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>
                    {locale === "en" ? "Export Active Cases (.csv)" : "वर्तमान केस निर्यात करें (.csv)"}
                  </Text>
                  <Text style={[styles.quickActionSub, { color: theme.colors.textSecondary }]}>
                    {locale === "en"
                      ? "Export to Excel, update hearing dates, and re-import"
                      : "एक्सेल में निर्यात करें, तारीखें बदलें और पुनः आयात करें"}
                  </Text>
                </View>
                <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t("import_step_mapping")}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
              {t("import_mapping_desc")}
            </Text>

            {TARGET_FIELDS.map((field) => (
              <View
                key={field.key}
                style={[styles.mappingRow, { borderBottomColor: theme.colors.border }]}
              >
                <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                  {field.label}
                </Text>
                <View
                  style={[
                    styles.pickerContainer,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.cardBackground,
                    },
                  ]}
                >
                  <Picker
                    selectedValue={mappings[field.key]}
                    onValueChange={(val) => setMappings({ ...mappings, [field.key]: val })}
                    style={{ color: theme.colors.text }}
                    dropdownIconColor={theme.colors.textSecondary}
                  >
                    <Picker.Item
                      label="-- None / Optional --"
                      value="none"
                      color={theme.colors.text}
                      style={{ backgroundColor: theme.colors.cardBackground }}
                    />
                    {headers.map((h) => (
                      <Picker.Item
                        key={h}
                        label={h}
                        value={h}
                        color={theme.colors.text}
                        style={{ backgroundColor: theme.colors.cardBackground }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            ))}

            {isAnalyzing ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <ActionButton
                title={locale === "en" ? "Preview Changes & Conflicts" : "परिवर्तन और विरोध देखें"}
                onPress={() => runDryRunAnalysis(parsedRows, mappings)}
                type="primary"
                style={{ width: "100%", marginTop: 24 }}
              />
            )}
          </View>
        )}

        {/* STEP 3: DRY-RUN DIFF & PREVIEW */}
        {step === 3 && (
          <View style={{ width: "100%" }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {locale === "en" ? "Review & Confirm Updates" : "समीक्षा और पुष्टि करें"}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {locale === "en"
                ? `Found ${analyzedItems.length} rows. Review field differences below before applying.`
                : `${analyzedItems.length} पंक्तियाँ मिलीं। लागू करने से पहले नीचे अंतर की समीक्षा करें।`}
            </Text>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  previewFilter === "ALL" && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setPreviewFilter("ALL")}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: previewFilter === "ALL" ? "#FFF" : theme.colors.text },
                  ]}
                >
                  All ({analyzedItems.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  previewFilter === "NEW" && { backgroundColor: "#10B981" },
                ]}
                onPress={() => setPreviewFilter("NEW")}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: previewFilter === "NEW" ? "#FFF" : theme.colors.text },
                  ]}
                >
                  New (+{newCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  previewFilter === "UPDATE" && { backgroundColor: "#F59E0B" },
                ]}
                onPress={() => setPreviewFilter("UPDATE")}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: previewFilter === "UPDATE" ? "#FFF" : theme.colors.text },
                  ]}
                >
                  Updates ({updateCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  previewFilter === "UNCHANGED" && { backgroundColor: "#6B7280" },
                ]}
                onPress={() => setPreviewFilter("UNCHANGED")}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: previewFilter === "UNCHANGED" ? "#FFF" : theme.colors.text },
                  ]}
                >
                  Unchanged ({unchangedCount})
                </Text>
              </TouchableOpacity>

              {errorCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    previewFilter === "ERROR" && { backgroundColor: "#EF4444" },
                  ]}
                  onPress={() => setPreviewFilter("ERROR")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: previewFilter === "ERROR" ? "#FFF" : theme.colors.text },
                    ]}
                  >
                    Errors ({errorCount})
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Selection Controls */}
            <View style={styles.selectionBar}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                {selectedCount} case(s) selected
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity onPress={() => toggleSelectAll(true)}>
                  <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: 13 }}>
                    Select All
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: theme.colors.border }}>|</Text>
                <TouchableOpacity onPress={() => toggleSelectAll(false)}>
                  <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: 13 }}>
                    Deselect All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Row List */}
            {filteredItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={item.action === "ERROR" ? 1 : 0.8}
                onPress={() => toggleItemSelection(analyzedItems.indexOf(item))}
                style={[
                  styles.casePreviewCard,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    borderColor:
                      item.action === "ERROR"
                        ? "#EF4444"
                        : item.selected
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <View style={styles.casePreviewHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    {item.action !== "ERROR" && (
                      <Ionicons
                        name={item.selected ? "checkbox" : "square-outline"}
                        size={22}
                        color={item.selected ? theme.colors.primary : theme.colors.textSecondary}
                        style={{ marginRight: 10 }}
                      />
                    )}
                    <Text style={[styles.casePreviewTitle, { color: theme.colors.text }]} numberOfLines={1}>
                      Row {item.rowIndex}: {item.mappedData.CaseTitle || "Untitled Case"}
                    </Text>
                  </View>

                  {/* Badge */}
                  <View
                    style={[
                      styles.actionBadge,
                      {
                        backgroundColor:
                          item.action === "NEW"
                            ? "#D1FAE5"
                            : item.action === "UPDATE"
                            ? "#FEF3C7"
                            : item.action === "ERROR"
                            ? "#FEE2E2"
                            : "#F3F4F6",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBadgeText,
                        {
                          color:
                            item.action === "NEW"
                              ? "#065F46"
                              : item.action === "UPDATE"
                              ? "#92400E"
                              : item.action === "ERROR"
                              ? "#991B1B"
                              : "#374151",
                        },
                      ]}
                    >
                      {item.action}
                    </Text>
                  </View>
                </View>

                {/* Subtitle / Reason */}
                <Text style={[styles.casePreviewReason, { color: theme.colors.textSecondary }]}>
                  {item.statusReason}
                </Text>

                {/* Diffs display */}
                {item.diffs && item.diffs.length > 0 && (
                  <View style={styles.diffContainer}>
                    {item.diffs.map((d, dIdx) => (
                      <View key={dIdx} style={styles.diffRow}>
                        <Text style={[styles.diffLabel, { color: theme.colors.text }]}>
                          {d.label}:
                        </Text>
                        <Text style={styles.diffOld}>{String(d.oldValue)}</Text>
                        <Ionicons name="arrow-forward" size={14} color="#6B7280" style={{ marginHorizontal: 4 }} />
                        <Text style={styles.diffNew}>{String(d.newValue)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Bottom Actions */}
            <View style={{ marginTop: 24, gap: 12 }}>
              <ActionButton
                title={`${locale === "en" ? "Apply Changes" : "परिवर्तन लागू करें"} (${selectedCount})`}
                onPress={handleExecuteUpsert}
                type="primary"
                style={{ width: "100%" }}
              />
              <ActionButton
                title={locale === "en" ? "Back to Mapping" : "मैपिंग पर वापस जाएं"}
                onPress={() => setStep(2)}
                type="secondary"
                style={{ width: "100%" }}
              />
            </View>
          </View>
        )}

        {/* STEP 4: PROGRESS */}
        {step === 4 && (
          <View style={[styles.stepContainer, { paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>
              {t("import_progress_title")}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {locale === "en"
                ? "Applying updates and creating timeline records safely..."
                : "अपडेट लागू किए जा रहे हैं और समयरेखा रिकॉर्ड सहेजे जा रहे हैं..."}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {progress.current} of {progress.total} cases processed
            </Text>
          </View>
        )}

        {/* STEP 5: SUMMARY & COMPLETION */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color="#10B981" style={styles.icon} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {locale === "en" ? "Bulk Operation Complete!" : "थोक प्रक्रिया पूर्ण!"}
            </Text>

            {upsertResult && (
              <View
                style={[
                  styles.summaryBox,
                  { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border },
                ]}
              >
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValueGreen}>+{upsertResult.insertedCount}</Text>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>New Cases Added</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValueYellow}>{upsertResult.updatedCount}</Text>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Cases Updated</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValueGray}>{upsertResult.unchangedCount}</Text>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Unchanged</Text>
                </View>
              </View>
            )}

            <ActionButton
              title={isFromOnboarding ? t("import_btn_finish") : "Done"}
              onPress={handleFinishOnboarding}
              type="primary"
              style={{ width: "100%", marginTop: 24 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
  },
  stepContainer: {
    alignItems: "center",
    width: "100%",
  },
  icon: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  quickActionsContainer: {
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  quickActionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  mappingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  pickerContainer: {
    flex: 1.2,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  pillScroll: {
    flexDirection: "row",
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    marginRight: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  casePreviewCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  casePreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  casePreviewTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  casePreviewReason: {
    fontSize: 13,
    marginTop: 4,
  },
  diffContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(150,150,150,0.2)",
    gap: 4,
  },
  diffRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  diffLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 6,
  },
  diffOld: {
    fontSize: 12,
    color: "#EF4444",
    textDecorationLine: "line-through",
  },
  diffNew: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    borderRadius: 4,
    marginVertical: 16,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValueGreen: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#10B981",
  },
  summaryValueYellow: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F59E0B",
  },
  summaryValueGray: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6B7280",
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
  },
});

export default ImportMigrationScreen;
