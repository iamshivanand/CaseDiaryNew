import React, { useRef, useState, useContext, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../../Providers/ThemeProvider';
import { useTranslation } from '../../../Providers/LanguageProvider';
import { ecourtsParserJS, convertIndianDateToLocal, parseRawECourtsData } from '../../../utils/ecourtsParser';
import ActionButton from '../../CommonComponents/ActionButton';

interface ECourtsImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: (extractedData: any) => void;
}

const ECOURTS_SERVICES_URL = 'https://services.ecourts.gov.in/ecourtindia_v6/index.php';

const USER_AGENT = Platform.OS === 'android'
  ? 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
  : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';

const webViewDebugJS = `
  (function() {
    // Override console.log
    const origLog = console.log;
    console.log = function() {
      const msg = Array.from(arguments).map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(' ');
      window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'log', message: msg }));
      origLog.apply(console, arguments);
    };

    // Override console.error
    const origErr = console.error;
    console.error = function() {
      const msg = Array.from(arguments).map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(' ');
      window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'log', message: '[ERROR] ' + msg }));
      origErr.apply(console, arguments);
    };

    // Global error handler
    window.onerror = function(message, source, lineno, colno, error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        status: 'log',
        message: 'onerror: ' + message + ' at ' + source + ':' + lineno
      }));
    };

    // Report page URL and document info immediately
    window.ReactNativeWebView.postMessage(JSON.stringify({
      status: 'log',
      message: 'Page Initialized. URL: ' + window.location.href + ', UserAgent: ' + navigator.userAgent
    }));
  })();
  true;
`;

const focusFormJS = `
  (function() {
    function scrollToCnr() {
      const cnrInput = document.getElementById('cnr_no') || document.querySelector('input[name="cnr_no"]');
      if (cnrInput) {
        cnrInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try {
          cnrInput.focus();
        } catch (e) {}
      }
    }
    
    // Execute multiple times to handle dynamic loading
    scrollToCnr();
    setTimeout(scrollToCnr, 200);
    setTimeout(scrollToCnr, 500);
    setTimeout(scrollToCnr, 1000);
    setTimeout(scrollToCnr, 2000);

    document.addEventListener('click', function() {
      setTimeout(scrollToCnr, 100);
      setTimeout(scrollToCnr, 300);
    });
  })();
  true;
`;

export const ECourtsImportModal: React.FC<ECourtsImportModalProps> = ({
  visible,
  onClose,
  onImportSuccess
}) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [viewMode, setViewMode] = useState<'webview' | 'preview'>('webview');
  const [extractedCaseData, setExtractedCaseData] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      setViewMode('webview');
      setExtractedCaseData(null);
    }
  }, [visible]);

  const handleTriggerScraper = () => {
    if (webViewRef.current) {
      setScraping(true);
      // Inject scraping script to look for case details tables
      webViewRef.current.injectJavaScript(ecourtsParserJS);
      
      // Auto-turn off indicator after 2 seconds if no message returned
      setTimeout(() => {
        setScraping(false);
      }, 2000);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.status === 'log') {
        console.log('[WebView JS Log]:', payload.message);
        return;
      }
      
      setScraping(false);
      if (payload.status === 'success' && payload.data) {
        const rawData = parseRawECourtsData(payload.data);
        
        // Clean and convert date representation safely
        if (rawData.NextDate) {
          const cleanDate = convertIndianDateToLocal(rawData.NextDate);
          if (cleanDate) {
            rawData.NextDate = cleanDate;
          }
        }
        if (rawData.dateFiled) {
          const cleanDate = convertIndianDateToLocal(rawData.dateFiled);
          if (cleanDate) {
            rawData.dateFiled = cleanDate;
          }
        }
        
        setExtractedCaseData(rawData);
        setViewMode('preview');
      } else if (payload.status === 'error') {
        console.warn('Scraper reported error:', payload.message);
      }
    } catch (e) {
      setScraping(false);
      console.error('Failed to parse WebView message:', e);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    if (!navState.loading && webViewRef.current) {
      webViewRef.current.injectJavaScript(focusFormJS);
      webViewRef.current.injectJavaScript(ecourtsParserJS);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        {viewMode === 'webview' ? (
          <>
            {/* Header Bar */}
            <View style={[styles.header, { backgroundColor: theme.colors.cardBackground, borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close-outline" size={26} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                {t("ecourts_importer_title") || "eCourts Case Importer"}
              </Text>
              <TouchableOpacity onPress={handleTriggerScraper} style={styles.scrapeButton} disabled={loading}>
                {scraping ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={[styles.scrapeButtonText, { color: loading ? theme.colors.textSecondary : theme.colors.primary }]}>
                    {t("ecourts_extract") || "Extract"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Instruction Banner */}
            <View style={[styles.infoBanner, { backgroundColor: `${theme.colors.primary}08`, borderColor: theme.colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {t("ecourts_instructions") || "Search for your case, solve the CAPTCHA, and tap search. Once the case table displays, tap 'Extract'."}
              </Text>
            </View>

            {/* WebView Screen Area */}
            <View style={styles.webViewContainer}>
              <WebView
                ref={webViewRef}
                source={{ uri: ECOURTS_SERVICES_URL }}
                onLoadStart={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.log('[WebView LoadStart] URL:', nativeEvent.url);
                  setLoading(true);
                }}
                onLoadEnd={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.log('[WebView LoadEnd] URL:', nativeEvent.url, 'Title:', nativeEvent.title);
                  setLoading(false);
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('[WebView Error] Description:', nativeEvent.description, 'Code:', nativeEvent.code);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('[WebView HTTP Error] Status:', nativeEvent.statusCode, 'URL:', nativeEvent.url);
                }}
                onMessage={handleWebViewMessage}
                onNavigationStateChange={handleNavigationStateChange}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                userAgent={USER_AGENT}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                injectedJavaScriptBeforeContentLoaded={webViewDebugJS}
                injectedJavaScript={focusFormJS}
                startInLoadingState={true}
                renderLoading={() => (
                  <ActivityIndicator
                    style={StyleSheet.absoluteFill}
                    size="large"
                    color={theme.colors.primary}
                  />
                )}
              />
            </View>
          </>
        ) : (
          <>
            {/* Header Bar */}
            <View style={[styles.header, { backgroundColor: theme.colors.cardBackground, borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity onPress={() => setViewMode('webview')} style={styles.backButton}>
                <Ionicons name="arrow-back-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.colors.text, marginRight: 24 }]}>
                {t("ecourts_preview_title") || "Case Details Preview"}
              </Text>
              <View />
            </View>

            {/* Preview Banner */}
            <View style={[styles.infoBanner, { backgroundColor: `${theme.colors.primary}08`, borderColor: theme.colors.border }]}>
              <Ionicons name="eye-outline" size={18} color={theme.colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {t("ecourts_preview_instruction") || "We found the case details below. You can import them directly into the form or cancel."}
              </Text>
            </View>

            {/* Details Scroll */}
            <ScrollView style={styles.previewContainer}>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                {/* Section 1: Primary Mapped Fields */}
                <Text style={[styles.sectionTitle, { color: theme.colors.primary, borderBottomColor: theme.colors.border }]}>
                  {t("preview_primary_title") || "Primary Mapped Fields"}
                </Text>

                {(() => {
                  const previewFields = [
                    { key: 'CaseTitle', label: t("field_case_title") || 'Case Title' },
                    { key: 'CNRNumber', label: t("field_cnr_number") || 'CNR Number' },
                    { key: 'case_number', label: t("field_case_number") || 'Case Number' },
                    { key: 'case_type_name', label: t("field_case_type") || 'Case Type' },
                    { key: 'court_name', label: t("field_court") || 'Court' },
                    { key: 'FirstParty', label: t("field_first_party") || 'First Party' },
                    { key: 'OppositeParty', label: t("field_opposite_party") || 'Opposite Party' },
                    { key: 'dateFiled', label: t("field_filed_date") || 'Filing Date' },
                    { key: 'JudgeName', label: t("field_judge_name") || 'Presiding Judge' },
                    { key: 'Undersection', label: t("field_under_section") || 'Act / Section' },
                    { key: 'NextDate', label: t("field_hearing_date") || 'Next Hearing Date' },
                    { key: 'CaseStatus', label: t("field_status") || 'Case Status' },
                    { key: 'OpposingCounsel', label: t("field_opposing_counsel") || 'Opposing Counsel' },
                    { key: 'police_station', label: t("field_police_station") || 'Police Station' },
                    { key: 'crime_number', label: t("field_crime_number") || 'Crime/FIR No.' },
                    { key: 'crime_year', label: t("field_crime_year") || 'Crime Year' },
                  ];
                  const coreFields = ['CNRNumber', 'CaseTitle', 'case_number', 'NextDate'];

                  return previewFields.map((field) => {
                    const val = extractedCaseData?.[field.key];
                    const isCore = coreFields.includes(field.key);
                    if (!val && !isCore) return null;
                    return (
                      <View key={field.key} style={[styles.previewRow, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>{field.label}</Text>
                        <Text style={[styles.previewValue, { color: theme.colors.text }]}>{val || "N/A"}</Text>
                      </View>
                    );
                  });
                })()}

                {/* Section 2: All Extracted Raw Fields */}
                <Text style={[styles.sectionTitle, { color: theme.colors.primary, borderBottomColor: theme.colors.border, marginTop: 24 }]}>
                  {t("preview_raw_title") || "All Scraped Fields from Portal"}
                </Text>

                {extractedCaseData?.rawTables && extractedCaseData.rawTables.length > 0 ? (
                  extractedCaseData.rawTables.map((item: any, idx: number) => (
                    <View key={`raw-${idx}`} style={[styles.previewRow, { borderBottomColor: theme.colors.border, borderBottomWidth: idx === extractedCaseData.rawTables.length - 1 ? 0 : 1 }]}>
                      <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
                      <Text style={[styles.previewValue, { color: theme.colors.text }]}>{item.value || "N/A"}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: theme.colors.textSecondary, marginVertical: 14, fontStyle: 'italic', textAlign: 'center' }}>
                    No other details found.
                  </Text>
                )}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.previewActions, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}>
              <ActionButton
                title={t("btn_import_and_fill") || "Import & Fill Form"}
                onPress={() => {
                  onImportSuccess(extractedCaseData);
                  onClose();
                }}
                type="primary"
              />
              <ActionButton
                title={t("btn_close_view") || "Close (Just View)"}
                onPress={onClose}
                type="secondary"
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: 8,
  },
  scrapeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scrapeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 12,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  webViewContainer: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    padding: 12,
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 12,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  previewActions: {
    padding: 16,
    borderTopWidth: 1,
  },
});
