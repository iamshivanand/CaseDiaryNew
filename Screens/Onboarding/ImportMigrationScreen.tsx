import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../Providers/ThemeProvider';
import { useTranslation } from '../../Providers/LanguageProvider';
import ActionButton from '../CommonComponents/ActionButton';
import { parseCSV, bulkInsertCases } from '../../utils/backupManager';
import { emitter } from '../../utils/event-emitter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addUser } from '../../DataBase';

interface RouteParams {
  isFromOnboarding?: boolean;
}

const TARGET_FIELDS = [
  { key: 'CaseTitle', label: 'Case Title / Name *', synonyms: ['title', 'name', 'case', 'suit'] },
  { key: 'ClientName', label: 'Client Name', synonyms: ['client', 'customer'] },
  { key: 'ClientContactNumber', label: 'Client Contact No.', synonyms: ['contact', 'phone', 'mobile'] },
  { key: 'CNRNumber', label: 'CNR Number', synonyms: ['cnr', 'cnrnumber'] },
  { key: 'case_number', label: 'Case Number', synonyms: ['number', 'case_number', 'case_no', 'suit_no'] },
  { key: 'case_year', label: 'Case Year', synonyms: ['year', 'case_year', 'suit_year'] },
  { key: 'court_name', label: 'Court Name', synonyms: ['court', 'court_name', 'forum'] },
  { key: 'case_type_name', label: 'Case Type', synonyms: ['type', 'case_type', 'case_type_name'] },
  { key: 'NextDate', label: 'Next Hearing Date', synonyms: ['next', 'hearing', 'next_date', 'hearing_date'] },
  { key: 'PreviousDate', label: 'Previous Hearing Date', synonyms: ['previous', 'prev_date', 'prev'] },
  { key: 'Undersection', label: 'Under Section', synonyms: ['section', 'undersection', 'under_section'] },
  { key: 'policeStationName', label: 'Police Station', synonyms: ['police', 'station', 'ps', 'police_station'] },
  { key: 'CaseDescription', label: 'Description', synonyms: ['desc', 'description', 'summary'] },
  { key: 'CaseNotes', label: 'Notes / Remarks', synonyms: ['notes', 'internal_notes', 'remarks'] },
];

const ImportMigrationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;
  const isFromOnboarding = params.isFromOnboarding ?? false;
  
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loadingFile, setLoadingFile] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [successCount, setSuccessCount] = useState(0);

  // File picker handler
  const handleSelectFile = async () => {
    setLoadingFile(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv', 'application/json'],
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

      if (fileName.endsWith('.json')) {
        const json = JSON.parse(content);
        const dataArray = Array.isArray(json) ? json : [json];
        if (dataArray.length > 0) {
          parsedHeaders = Object.keys(dataArray[0]);
          rows = dataArray;
        }
      } else {
        // Assume CSV
        const csvData = parseCSV(content);
        if (csvData.length > 0) {
          parsedHeaders = csvData[0];
          rows = csvData.slice(1).map(row => {
            const obj: any = {};
            parsedHeaders.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
        }
      }

      if (parsedHeaders.length === 0 || rows.length === 0) {
        throw new Error("No data found in the selected file.");
      }

      setHeaders(parsedHeaders);
      setParsedRows(rows);

      // Auto map logic
      const initialMappings: { [key: string]: string } = {};
      TARGET_FIELDS.forEach(field => {
        // Try to match synonym in headers
        const matchedHeader = parsedHeaders.find(h => {
          const cleanHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          return field.synonyms.some(syn => cleanHeader.includes(syn));
        });
        if (matchedHeader) {
          initialMappings[field.key] = matchedHeader;
        } else {
          initialMappings[field.key] = 'none';
        }
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

  // Perform import
  const handleStartImport = async () => {
    // Validate required mappings
    if (mappings['CaseTitle'] === 'none') {
      Alert.alert(t("alert_warning"), "Case Title must be mapped to proceed.");
      return;
    }

    setStep(3);
    setProgress({ current: 0, total: parsedRows.length });

    try {
      let userId: number | null = null;
      const cachedUserId = await AsyncStorage.getItem("@user_id");
      if (cachedUserId) {
        userId = parseInt(cachedUserId, 10);
      } else if (isFromOnboarding) {
        // Auto register user if in onboarding to attach cases
        userId = await addUser("Advocate", "advocate@casediary.com");
        if (userId) {
          await AsyncStorage.setItem("@user_id", userId.toString());
        }
      }

      // Map rows according to the chosen mappings
      const casesToImport = parsedRows.map(row => {
        const mappedCase: any = {};
        TARGET_FIELDS.forEach(field => {
          const sourceHeader = mappings[field.key];
          if (sourceHeader && sourceHeader !== 'none') {
            mappedCase[field.key] = row[sourceHeader];
          }
        });
        return mappedCase;
      });

      // Insert cases
      const count = await bulkInsertCases(casesToImport, userId, (curr, tot) => {
        setProgress({ current: curr, total: tot });
      });

      setSuccessCount(count);
      setStep(4);
    } catch (error: any) {
      console.error("Bulk insert failed:", error);
      Alert.alert(t("alert_error"), error.message || "An error occurred during import.");
      setStep(2);
    }
  };

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem("@onboarding_complete", "true");
    emitter.emit("onboardingComplete");
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t("import_title")}</Text>

        {/* STEP 1: UPLOAD FILE */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Ionicons name="document-text-outline" size={80} color={theme.colors.primary} style={styles.icon} />
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              Import case diary records from a CSV/spreadsheet or JSON file easily. APPs database entries will be added to your current database.
            </Text>

            {loadingFile ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <ActionButton
                title={t("import_btn_select")}
                onPress={handleSelectFile}
                type="primary"
                style={{ width: '100%' }}
              />
            )}
          </View>
        )}

        {/* STEP 2: MAPPING WIZARD */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t("import_step_mapping")}</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
              {t("import_mapping_desc")}
            </Text>

            {/* Field list */}
            {TARGET_FIELDS.map(field => (
              <View key={field.key} style={[styles.mappingRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>{field.label}</Text>
                <View style={[styles.pickerContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}>
                  <Picker
                    selectedValue={mappings[field.key]}
                    onValueChange={(val) => setMappings({ ...mappings, [field.key]: val })}
                    style={{ color: theme.colors.text }}
                    dropdownIconColor={theme.colors.textSecondary}
                  >
                    <Picker.Item label="-- None / Optional --" value="none" />
                    {headers.map(h => (
                      <Picker.Item key={h} label={h} value={h} />
                    ))}
                  </Picker>
                </View>
              </View>
            ))}

            {/* Row 1 preview */}
            {parsedRows.length > 0 && (
              <View style={[styles.previewCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <Text style={[styles.previewTitle, { color: theme.colors.text }]}>{t("import_mapping_preview")}</Text>
                {Object.keys(mappings).map(key => {
                  const mappedCol = mappings[key];
                  if (mappedCol && mappedCol !== 'none') {
                    return (
                      <Text key={key} style={[styles.previewText, { color: theme.colors.textSecondary }]}>
                        <Text style={{ fontWeight: 'bold', color: theme.colors.text }}>{key}:</Text> {parsedRows[0][mappedCol] || 'N/A'}
                      </Text>
                    );
                  }
                  return null;
                })}
              </View>
            )}

            <ActionButton
              title={t("import_btn_start")}
              onPress={handleStartImport}
              type="primary"
              style={{ width: '100%', marginTop: 24 }}
            />
          </View>
        )}

        {/* STEP 3: PROGRESS */}
        {step === 3 && (
          <View style={[styles.stepContainer, { paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>{t("import_progress_title")}</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{t("import_progress_desc")}</Text>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: theme.colors.primary, 
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {progress.current} of {progress.total} cases processed
            </Text>
          </View>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color="#10B981" style={styles.icon} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t("import_success_title")}</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {t("import_success_detail").replace('{count}', successCount.toString())}
            </Text>

            <ActionButton
              title={t("import_btn_duplicates")}
              onPress={() => navigation.navigate("DuplicateReview")}
              type="secondary"
              style={{ width: '100%', marginBottom: 12 }}
            />

            {isFromOnboarding ? (
              <ActionButton
                title={t("import_btn_dashboard")}
                onPress={handleFinishOnboarding}
                type="primary"
                style={{ width: '100%' }}
              />
            ) : (
              <ActionButton
                title="Go Back"
                onPress={() => navigation.goBack()}
                type="primary"
                style={{ width: '100%' }}
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  stepContainer: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mappingRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    paddingRight: 10,
  },
  pickerContainer: {
    width: '55%',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
  },
  previewCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 24,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewText: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
  },
});

export default ImportMigrationScreen;
