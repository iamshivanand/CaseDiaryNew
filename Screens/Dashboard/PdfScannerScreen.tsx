// Screens/Dashboard/PdfScannerScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import * as db from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { useTranslation } from "../../Providers/LanguageProvider";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { Theme } from "../../Providers/ThemeProvider";
import DocumentScanner from "react-native-document-scanner-plugin";
import { useAdTrigger } from "../CommonComponents/AdManager";
import AdBanner from "../CommonComponents/AdBanner";

type PdfScannerRouteProp = RouteProp<HomeStackParamList, "PdfScanner">;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const PdfScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PdfScannerRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = getStyles(theme);
  const targetCaseId = route.params?.caseId;
  const { showAdWithPreload } = useAdTrigger();

  // Mode: "saved" (hub list) or "capture" (triggers native scanning)
  const [mode, setMode] = useState<"saved" | "capture">(targetCaseId ? "capture" : "saved");

  // Saved Hub states
  const [savedPdfs, setSavedPdfs] = useState<db.ScannedPdfRow[]>([]);
  const [filteredPdfs, setFilteredPdfs] = useState<db.ScannedPdfRow[]>([]);
  const [pdfSearchQuery, setPdfSearchQuery] = useState("");
  const [isPdfsLoading, setIsPdfsLoading] = useState(false);

  // Scan session states
  const [scannedImageUris, setScannedImageUris] = useState<string[]>([]);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [targetCaseTitle, setTargetCaseTitle] = useState("");

  // Case Selector states (for global scanning)
  const [cases, setCases] = useState<any[]>([]);
  const [filteredCases, setFilteredCases] = useState<any[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  // Fetch target case details if caseId provided
  useEffect(() => {
    if (targetCaseId) {
      db.getCaseById(targetCaseId)
        .then((c) => {
          if (c) setTargetCaseTitle(c.CaseTitle || "");
        })
        .catch((e) => console.error("Error fetching target case", e));
    }
  }, [targetCaseId]);

  // Load saved PDFs
  useEffect(() => {
    if (mode === "saved") loadSavedPdfs();
  }, [mode]);

  const loadSavedPdfs = async () => {
    setIsPdfsLoading(true);
    try {
      const r = await db.getAllScannedPdfs();
      setSavedPdfs(r);
      setFilteredPdfs(r);
    } catch (e) {
      console.error("loadSavedPdfs error", e);
    } finally {
      setIsPdfsLoading(false);
    }
  };

  // Saved list filter
  useEffect(() => {
    const q = pdfSearchQuery.toLowerCase().trim();
    setFilteredPdfs(
      !q
        ? savedPdfs
        : savedPdfs.filter(
            (p) =>
              p.original_display_name.toLowerCase().includes(q) ||
              p.CaseTitle?.toLowerCase().includes(q)
          )
    );
  }, [pdfSearchQuery, savedPdfs]);

  // Case list search/filter (naming modal)
  useEffect(() => {
    const q = caseSearchQuery.toLowerCase().trim();
    setFilteredCases(
      !q
        ? cases
        : cases.filter(
            (c) =>
              c.CaseTitle?.toLowerCase().includes(q) ||
              c.ClientName?.toLowerCase().includes(q) ||
              c.case_number?.toLowerCase().includes(q)
          )
    );
  }, [caseSearchQuery, cases]);

  // Trigger scan when mode is capture
  useEffect(() => {
    if (mode === "capture") {
      setScannedImageUris([]);
      startScanning();
    }
  }, [mode]);

  // Reset captured items on screen focus
  useFocusEffect(
    useCallback(() => {
      setScannedImageUris([]);
    }, [])
  );

  const loadActiveCases = async () => {
    try {
      const r = await db.getCases();
      setCases(r);
      setFilteredCases(r);
    } catch (e) {
      console.error("loadActiveCases error", e);
    }
  };

  // Launch Google Play Services ML-Kit Document Scanner (First Stage)
  const startScanning = async () => {
    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        croppedImageQuality: 100,
        maxNumDocuments: 20,
      });

      if (scannedImages && scannedImages.length > 0) {
        setScannedImageUris(scannedImages);
        
        // Auto-generate a descriptive file name
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "-");
        const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
        const defaultName = targetCaseTitle
          ? `${targetCaseTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_Scan_${dateStr}`
          : `Scan_${dateStr}_${timeStr}`;

        setDocumentName(defaultName);
        setIsSaveModalVisible(true);
        setSelectedCaseId(null);
        setCaseSearchQuery("");

        if (!targetCaseId) {
          loadActiveCases();
        }
      } else {
        // Cancelled scan
        if (targetCaseId) {
          navigation.goBack();
        } else {
          setMode("saved");
        }
      }
    } catch (err) {
      console.error("Scan document error", err);
      Alert.alert("Scanner Error", "Failed to scan document.");
      if (targetCaseId) {
        navigation.goBack();
      } else {
        setMode("saved");
      }
    }
  };

  // Handle case selection in selector modal
  const handleCaseSelect = (c: any) => {
    setSelectedCaseId(c.id);
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "-");
    const formattedTitle = c.CaseTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    setDocumentName(`${formattedTitle}_Scan_${dateStr}`);
  };

  const performPdfCompilation = async (linkId: number) => {
    setIsCompiling(true);
    try {
      // Load and convert image URIs to base64 strings
      const imgTags = await Promise.all(
        scannedImageUris.map(async (uri) => {
          const b64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return `<div class="page"><img src="data:image/jpeg;base64,${b64}"/></div>`;
        })
      );

      // A4 constrained HTML template
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      overflow: hidden;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
    }
  </style>
</head>
<body>
  ${imgTags.join("")}
</body>
</html>`;

      const { uri: pdfUri } = await Print.printToFileAsync({ html });

      // Build clean document name
      let filename = documentName.trim();
      if (!filename) {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "-");
        filename = `Scan_${dateStr}`;
      }
      if (!filename.toLowerCase().endsWith(".pdf")) {
        filename += ".pdf";
      }

      // Upload and copy PDF locally
      const docId = await db.uploadCaseDocument({
        originalFileName: filename,
        fileType: "application/pdf",
        fileUri: pdfUri,
        caseId: linkId,
        userId: 1,
        fileSize: null,
      });

      setIsCompiling(false);
      setIsSaveModalVisible(false);
      setScannedImageUris([]);

      if (docId) {
        Alert.alert("Document Saved", "Scanned PDF saved successfully!", [
          {
            text: "OK",
            onPress: () => {
              if (targetCaseId) {
                navigation.goBack();
              } else {
                setMode("saved");
                loadSavedPdfs();
              }
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Could not link PDF file to case record.");
      }
    } catch (err) {
      console.error("compileDirectPdf error", err);
      setIsCompiling(false);
      Alert.alert("Error", "Could not compile PDF document.");
    }
  };

  // Directly compile HTML & export PDF with A4 Page boundaries after showing an ad
  const compileDirectPdf = async () => {
    if (scannedImageUris.length === 0) return;
    
    const linkId = targetCaseId || selectedCaseId;
    if (!linkId) {
      Alert.alert("Case Required", "Please select a case to link this scanned document to.");
      return;
    }

    try {
      await showAdWithPreload("interstitial", async (success) => {
        await performPdfCompilation(linkId);
      });
    } catch (adError) {
      console.warn("Ad preloading or display encountered an error, compiling PDF anyway:", adError);
      await performPdfCompilation(linkId);
    }
  };

  const handleCancelSave = () => {
    Alert.alert(
      "Discard Scan",
      "Are you sure you want to discard this scanned document?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            setScannedImageUris([]);
            setIsSaveModalVisible(false);
            if (targetCaseId) {
              navigation.goBack();
            } else {
              setMode("saved");
            }
          },
        },
      ]
    );
  };

  // Saved Hub Actions
  const viewSavedPdf = (item: db.ScannedPdfRow) => {
    const fp = db.getFullDocumentPath(item.stored_filename);
    if (fp) {
      // @ts-ignore
      navigation.navigate("PdfViewer", { pdfUri: fp, title: item.original_display_name });
    }
  };

  const shareSavedPdf = async (item: db.ScannedPdfRow) => {
    const fp = db.getFullDocumentPath(item.stored_filename);
    if (fp) {
      try {
        await Sharing.shareAsync(fp, { mimeType: "application/pdf" });
      } catch (e) {
        console.error("Sharing error", e);
      }
    }
  };

  const deleteSavedPdf = (item: db.ScannedPdfRow) => {
    Alert.alert("Delete PDF", `Delete "${item.original_display_name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await db.deleteCaseDocument(item.id);
            loadSavedPdfs();
          } catch {
            Alert.alert("Error", "Failed to delete.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }]}>
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { color: theme.colors.text }]}>PDF Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabHeader}>
        <TouchableOpacity style={[styles.tabBtn, styles.tabActive]}>
          <Ionicons name="folder-open" size={18} color="#fff" />
          <Text style={styles.tabBtnTextActive}>Saved PDFs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => {
            setScannedImageUris([]);
            startScanning();
          }}
        >
          <Ionicons name="scan" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.tabBtnText, { color: theme.colors.textSecondary }]}>Scan Document</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search saved scanned PDFs..."
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.searchInputField}
            value={pdfSearchQuery}
            onChangeText={setPdfSearchQuery}
          />
          {pdfSearchQuery !== "" && (
            <TouchableOpacity onPress={() => setPdfSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isPdfsLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredPdfs.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="file-tray-outline" size={60} color={theme.colors.textSecondary} style={{ opacity: 0.6 }} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No Scanned PDFs found</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Link documents to your cases using Scan Document.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPdfs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={[styles.pdfCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={styles.pdfCardInfoRow}>
                <View style={styles.pdfIconCircle}>
                  <Ionicons name="document-text" size={26} color="#ef4444" />
                </View>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.pdfCardTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.original_display_name}
                  </Text>
                  <Text style={[styles.pdfCardSub, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {item.CaseTitle ? `Case: ${item.CaseTitle}` : "Unlinked / Draft"}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
                    {item.created_at ? item.created_at.split(" ")[0].split("-").reverse().join("-") : ""}
                  </Text>
                </View>
              </View>
              <View style={[styles.pdfActionsRow, { borderTopColor: theme.colors.border }]}>
                <TouchableOpacity style={styles.pdfActionBtn} onPress={() => viewSavedPdf(item)}>
                  <Ionicons name="eye-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.pdfActionBtnText, { color: theme.colors.primary }]}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pdfActionBtn} onPress={() => shareSavedPdf(item)}>
                  <Ionicons name="share-social-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.pdfActionBtnText, { color: theme.colors.primary }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pdfActionBtn} onPress={() => deleteSavedPdf(item)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={[styles.pdfActionBtnText, { color: "#ef4444" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Save PDF Naming Modal */}
      <Modal visible={isSaveModalVisible} animationType="slide" transparent onRequestClose={handleCancelSave}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Save Document</Text>
              <TouchableOpacity onPress={handleCancelSave}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                Document Name
              </Text>
              <TextInput
                style={[styles.nameInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Enter document name..."
                placeholderTextColor={theme.dark ? "#475569" : "#cbd5e1"}
                value={documentName}
                onChangeText={setDocumentName}
              />
            </View>

            {targetCaseId ? (
              <View style={[styles.caseRowActive, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
                    Linked Case
                  </Text>
                  <Text style={[styles.caseTitle, { color: theme.colors.text, marginTop: 2 }]}>
                    {targetCaseTitle || "Loading case info..."}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              </View>
            ) : (
              <View style={{ flex: 1, marginBottom: 12 }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                  Link to Case
                </Text>
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Search case title or number..."
                  placeholderTextColor={theme.dark ? "#475569" : "#cbd5e1"}
                  value={caseSearchQuery}
                  onChangeText={setCaseSearchQuery}
                />
                <FlatList
                  data={filteredCases}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  renderItem={({ item }) => {
                    const isSelected = selectedCaseId === item.id;
                    return (
                      <TouchableOpacity
                        onPress={() => handleCaseSelect(item)}
                        style={[
                          styles.caseRow,
                          isSelected && { backgroundColor: theme.colors.cardBackground, borderRadius: 8, paddingHorizontal: 8 }
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.caseTitle, { color: theme.colors.text }]}>
                            {item.CaseTitle}
                          </Text>
                          <Text style={[styles.caseSub, { color: theme.colors.textSecondary }]}>
                            {item.ClientName} • {item.case_number || "No Case No"}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                        ) : (
                          <Ionicons name="circle-outline" size={20} color={theme.colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={<Text style={styles.emptyModal}>No matching cases found.</Text>}
                />
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <TouchableOpacity onPress={handleCancelSave} style={[styles.actionBtn, styles.cancelBtn]}>
                <Text style={styles.cancelBtnText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={compileDirectPdf}
                disabled={isCompiling}
                style={[styles.actionBtn, styles.saveBtn, { backgroundColor: theme.colors.primary }]}
              >
                {isCompiling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save PDF</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <AdBanner />
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    screenHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: "rgba(128,128,128,0.25)"
    },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
    screenHeaderTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },

    tabHeader: {
      flexDirection: "row",
      height: 48,
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: 8,
      paddingVertical: 6,
      gap: 12
    },
    tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 20, height: 36, gap: 6 },
    tabActive: { backgroundColor: theme.colors.primary },
    tabBtnText: { fontSize: 13, fontWeight: "bold" },
    tabBtnTextActive: { fontSize: 13, fontWeight: "bold", color: "#fff" },

    searchBarContainer: { padding: 12, backgroundColor: theme.colors.cardBackground, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 42
    },
    searchInputField: { flex: 1, color: theme.colors.text, fontSize: 14, padding: 0 },

    emptyText: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 12 },
    emptySubtext: { fontSize: 13, textAlign: "center", marginTop: 4, paddingHorizontal: 30 },

    pdfCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
      marginBottom: 14,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3
    },
    pdfCardInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    pdfIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(239,68,68,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12
    },
    pdfCardTitle: { fontSize: 14, fontWeight: "700" },
    pdfCardSub: { fontSize: 12, marginTop: 2 },
    pdfActionsRow: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 0.5, paddingTop: 10 },
    pdfActionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    pdfActionBtnText: { fontSize: 13, fontWeight: "600" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, height: SCREEN_HEIGHT * 0.72, padding: 20 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: "bold" },
    
    nameInput: { height: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
    searchInput: { height: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, marginBottom: 10 },
    caseRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(128,128,128,0.15)" },
    caseRowActive: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderWidth: 1,
      borderRadius: 10,
      marginBottom: 16
    },
    caseTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
    caseSub: { fontSize: 12 },
    emptyModal: { textAlign: "center", marginTop: 40, color: "grey" },

    actionBtn: { flex: 1, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    cancelBtn: { backgroundColor: "rgba(128,128,128,0.15)" },
    cancelBtnText: { fontWeight: "700", fontSize: 14, color: theme.colors.text },
    saveBtn: { elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    saveBtnText: { fontWeight: "700", fontSize: 14, color: "#fff" },
  });

export default PdfScannerScreen;
