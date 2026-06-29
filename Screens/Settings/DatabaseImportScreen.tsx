import React, { useState, useEffect, useContext } from 'react';
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
  DevSettings,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { ThemeContext, Theme } from '../../Providers/ThemeProvider';
import { useTranslation } from '../../Providers/LanguageProvider';
import {
  previewDatabaseBackup,
  replaceDatabaseBackup,
  mergeDatabaseBackup,
  cleanupTempDatabaseBackup,
  BackupPreviewData,
} from '../../utils/backupManager';
import ActionButton from '../CommonComponents/ActionButton';

const { width } = Dimensions.get('window');

const DatabaseImportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { locale } = useTranslation();
  const styles = getStyles(theme);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BackupPreviewData | null>(null);

  // SQLCipher Encryption Support
  const [dbPassword, setDbPassword] = useState<string | undefined>(undefined);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [pendingFileUri, setPendingFileUri] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);

  // Clean up any temp db files on unmount
  useEffect(() => {
    return () => {
      cleanupTempDatabaseBackup().catch((err) =>
        console.warn('Failed to cleanup temp database on unmount:', err)
      );
    };
  }, []);

  const verifyAndLoadBackup = async (fileUri: string, fileName: string, password?: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage(
        locale === 'en'
          ? 'Verifying and reading backup file...'
          : 'बैकअप फ़ाइल की पुष्टि और पठन किया जा रहा है...'
      );

      const preview = await previewDatabaseBackup(fileUri, password);
      
      setSelectedFileUri(fileUri);
      setSelectedFileName(fileName);
      setPreviewData(preview);
      setDbPassword(password);
      setIsPasswordModalVisible(false);
      setTempPassword('');
      setPendingFileUri(null);
      setPendingFileName(null);
    } catch (error: any) {
      console.error('File verification failed:', error);
      if (error.message === 'DATABASE_ENCRYPTED') {
        // Database is encrypted, prompt for password
        setPendingFileUri(fileUri);
        setPendingFileName(fileName);
        setIsPasswordModalVisible(true);
      } else if (error.message === 'INVALID_PASSWORD') {
        Alert.alert(
          locale === 'en' ? 'Incorrect Password' : 'गलत पासवर्ड',
          locale === 'en'
            ? 'The password entered is incorrect. Please try again.'
            : 'दर्ज किया गया पासवर्ड गलत है। कृपया पुनः प्रयास करें।'
        );
        // Keep modal open, reset input
        setTempPassword('');
        setIsPasswordModalVisible(true);
      } else {
        Alert.alert(
          locale === 'en' ? 'Verification Failed' : 'सत्यापन विफल',
          error.message ||
            (locale === 'en'
              ? 'Failed to verify backup database. Please ensure it is a valid Case Diary backup file.'
              : 'बैकअप डेटाबेस को सत्यापित करने में विफल। कृपया सुनिश्चित करें कि यह एक वैध केस डायरी बैकअप फ़ाइल है।')
        );
        setSelectedFileUri(null);
        setSelectedFileName(null);
        setPreviewData(null);
        setDbPassword(undefined);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage(
        locale === 'en'
          ? 'Opening file picker...'
          : 'फ़ाइल पिकर खोला जा रहा है...'
      );

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/x-sqlite3', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite')) {
        Alert.alert(
          locale === 'en' ? 'Invalid File' : 'अमान्य फ़ाइल',
          locale === 'en'
            ? 'Please select a valid backup file ending with .db or .sqlite.'
            : 'कृपया .db या .sqlite से समाप्त होने वाली एक वैध बैकअप फ़ाइल चुनें।'
        );
        setIsLoading(false);
        return;
      }

      // Check without password first
      await verifyAndLoadBackup(file.uri, file.name);
    } catch (error: any) {
      console.error('File pick failed:', error);
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (!pendingFileUri || !pendingFileName) return;
    setIsPasswordModalVisible(false);
    verifyAndLoadBackup(pendingFileUri, pendingFileName, tempPassword);
  };

  const handleMerge = async () => {
    if (!selectedFileUri) return;

    Alert.alert(
      locale === 'en' ? 'Confirm Merge' : 'मर्ज की पुष्टि करें',
      locale === 'en'
        ? `This will add ${previewData?.caseCount || 0} cases and ${
            previewData?.timelineCount || 0
          } hearings into your current database. Duplicate cases will be automatically skipped. Do you want to proceed?`
        : `यह आपके वर्तमान डेटाबेस में ${previewData?.caseCount || 0} मामलों और ${
            previewData?.timelineCount || 0
          } सुनवाइयों को जोड़ेगा। डुप्लिकेट मामलों को स्वचालित रूप से छोड़ दिया जाएगा। क्या आप आगे बढ़ना चाहते हैं?`,
      [
        { text: locale === 'en' ? 'Cancel' : 'रद्द करें', style: 'cancel' },
        {
          text: locale === 'en' ? 'Merge Data' : 'डेटा मर्ज करें',
          onPress: async () => {
            try {
              setIsLoading(true);
              setLoadingMessage(
                locale === 'en'
                  ? 'Merging database records...'
                  : 'डेटाबेस रिकॉर्ड्स मर्ज किए जा रहे हैं...'
              );
              
              const result = await mergeDatabaseBackup(dbPassword);
              
              setIsLoading(false);
              Alert.alert(
                locale === 'en' ? 'Merge Successful' : 'मर्ज सफल',
                locale === 'en'
                  ? `Successfully imported and merged ${result.insertedCount} new cases into your database.`
                  : `आपके डेटाबेस में ${result.insertedCount} नए मामलों को सफलतापूर्वक आयात और मर्ज किया गया।`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.goBack();
                    },
                  },
                ]
              );
            } catch (error: any) {
              setIsLoading(false);
              Alert.alert(
                locale === 'en' ? 'Merge Error' : 'मर्ज त्रुटि',
                error.message || (locale === 'en' ? 'Failed to merge backup.' : 'बैकअप मर्ज करने में विफल।')
              );
            }
          },
        },
      ]
    );
  };

  const handleReplace = async () => {
    if (!selectedFileUri) return;

    Alert.alert(
      locale === 'en' ? 'WARNING: REPLACE DATABASE' : 'चेतावनी: डेटाबेस बदलें',
      locale === 'en'
        ? 'This will completely delete your current database and replace it with the backup. All existing cases, timeline hearings, and documents will be lost permanently. Are you absolutely sure?'
        : 'यह आपके वर्तमान डेटाबेस को पूरी तरह से हटा देगा और इसे बैकअप से बदल देगा। सभी मौजूदा मामले, सुनवाई की तारीखें और दस्तावेज़ स्थायी रूप से खो जाएंगे। क्या आप पूरी तरह से आश्वस्त हैं?',
      [
        { text: locale === 'en' ? 'Cancel' : 'रद्द करें', style: 'cancel' },
        {
          text: locale === 'en' ? 'Replace and Restart' : 'बदलें और पुनरारंभ करें',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              setLoadingMessage(
                locale === 'en'
                  ? 'Replacing active database...'
                  : 'सक्रिय डेटाबेस बदला जा रहा है...'
              );

              await replaceDatabaseBackup(dbPassword);

              setIsLoading(false);
              Alert.alert(
                locale === 'en' ? 'Restore Complete' : 'पुनर्प्राप्ति पूर्ण',
                locale === 'en'
                  ? 'Database has been restored successfully. The app will reload now to apply changes.'
                  : 'डेटाबेस को सफलतापूर्वक पुनर्प्राप्त कर लिया गया है। बदलाव लागू करने के लिए ऐप अब रीलोड होगा।',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (Platform.OS !== 'web') {
                        DevSettings.reload();
                      } else {
                        navigation.goBack();
                      }
                    },
                  },
                ]
              );
            } catch (error: any) {
              setIsLoading(false);
              Alert.alert(
                locale === 'en' ? 'Restore Error' : 'पुनर्प्राप्ति त्रुटि',
                error.message || (locale === 'en' ? 'Failed to restore backup.' : 'बैकअप पुनर्प्राप्त करने में विफल।')
              );
            }
          },
        },
      ]
    );
  };

  const renderPreviewItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.previewRow}>
        <Ionicons name="briefcase" size={16} color={theme.colors.primary} style={styles.previewRowIcon} />
        <View style={styles.previewRowContent}>
          <Text style={styles.previewRowTitle} numberOfLines={1}>
            {item.CaseTitle || 'Untitled Case'}
          </Text>
          <Text style={styles.previewRowSubtitle} numberOfLines={1}>
            {item.ClientName || 'N/A'} | {item.court_name || 'N/A'}
          </Text>
        </View>
        {item.NextDate && (
          <View style={styles.previewRowDateBadge}>
            <Text style={styles.previewRowDateText}>{item.NextDate}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!selectedFileUri ? (
          <View style={styles.pickStage}>
            <View style={styles.iconBackground}>
              <Ionicons name="cloud-upload" size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.stageTitle}>
              {locale === 'en' ? 'Import Database Backup' : 'डेटाबेस बैकअप आयात करें'}
            </Text>
            <Text style={styles.stageDesc}>
              {locale === 'en'
                ? 'Select a previously exported database backup file (.db) to preview its contents and choose how to restore your case logs.'
                : 'अपनी सामग्री का पूर्वावलोकन करने और अपने केस लॉग को पुनर्स्थापित करने का तरीका चुनने के लिए पहले से निर्यात की गई डेटाबेस बैकअप फ़ाइल (.db) का चयन करें।'}
            </Text>

            <TouchableOpacity style={styles.uploadCard} onPress={handlePickFile} activeOpacity={0.85}>
              <Ionicons name="document-attach" size={32} color={theme.colors.textSecondary} />
              <Text style={styles.uploadCardText}>
                {locale === 'en' ? 'Choose Backup File' : 'बैकअप फ़ाइल चुनें'}
              </Text>
              <Text style={styles.uploadCardSubtext}>
                {locale === 'en' ? 'Supports .db or .sqlite files' : '.db या .sqlite फ़ाइलों का समर्थन करता है'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewStage}>
            {/* Selected File Card */}
            <View style={styles.fileCard}>
              <Ionicons name="checkbox-outline" size={24} color={theme.colors.success} />
              <View style={styles.fileCardInfo}>
                <Text style={styles.fileCardName} numberOfLines={1}>
                  {selectedFileName}
                </Text>
                <Text style={styles.fileCardStatus}>
                  {dbPassword 
                    ? (locale === 'en' ? 'Decrypted Successfully' : 'सफलतापूर्वक डिक्रिप्ट किया गया')
                    : (locale === 'en' ? 'Ready to Restore' : 'पुनर्प्राप्ति के लिए तैयार')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setSelectedFileUri(null); setPreviewData(null); setDbPassword(undefined); }} style={styles.changeBtn}>
                <Text style={styles.changeBtnText}>{locale === 'en' ? 'Change' : 'बदलें'}</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <LinearGradient
                colors={theme.dark ? ['#1E293B', '#0F172A'] : ['#E0F2FE', '#BAE6FD']}
                style={styles.statsCard}
              >
                <Ionicons name="briefcase" size={24} color={theme.colors.primary} />
                <Text style={styles.statsValue}>{previewData?.caseCount ?? 0}</Text>
                <Text style={styles.statsLabel}>{locale === 'en' ? 'Total Cases' : 'कुल मामले'}</Text>
              </LinearGradient>

              <LinearGradient
                colors={theme.dark ? ['#1E293B', '#0F172A'] : ['#ECFDF5', '#D1FAE5']}
                style={styles.statsCard}
              >
                <Ionicons name="calendar" size={24} color={theme.colors.success} />
                <Text style={styles.statsValue}>{previewData?.timelineCount ?? 0}</Text>
                <Text style={styles.statsLabel}>{locale === 'en' ? 'Hearings / Events' : 'सुनवाई / घटनाएँ'}</Text>
              </LinearGradient>
            </View>

            {/* Preview Case List */}
            {previewData && previewData.previewCases.length > 0 && (
              <View style={styles.casesPreviewCard}>
                <Text style={styles.cardHeaderTitle}>
                  {locale === 'en' ? 'Backup Cases Preview' : 'बैकअप मामलों का पूर्वावलोकन'}
                </Text>
                <View style={styles.divider} />
                <FlatList
                  data={previewData.previewCases}
                  renderItem={renderPreviewItem}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
                {previewData.caseCount > 5 && (
                  <Text style={styles.moreText}>
                    {locale === 'en'
                      ? `... and ${previewData.caseCount - 5} more cases`
                      : `... और ${previewData.caseCount - 5} अधिक मामले`}
                  </Text>
                )}
              </View>
            )}

            {/* Selection Explanations */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={22} color={theme.colors.primary} style={styles.infoIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>
                  {locale === 'en' ? 'Choose Import Strategy' : 'आयात रणनीति चुनें'}
                </Text>
                <Text style={styles.infoText}>
                  {locale === 'en'
                    ? '• Merge Data (Recommended): Integrates backup data safely with your current cases. Avoids duplication.'
                    : '• डेटा मर्ज करें (अनुशंसित): बैकअप डेटा को आपके वर्तमान मामलों के साथ सुरक्षित रूप से एकीकृत करता है। डुप्लिकेशन से बचाता है।'}
                </Text>
                <Text style={[styles.infoText, { marginTop: 4 }]}>
                  {locale === 'en'
                    ? '• Replace Database: Overwrites your current active database. Wipes any unsaved changes.'
                    : '• डेटाबेस बदलें: आपके वर्तमान सक्रिय डेटाबेस को हटाकर बैकअप से बदल देता है। सभी नई सेटिंग्स हट जाएंगी।'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.btnGroup}>
              <ActionButton
                title={locale === 'en' ? 'Merge / Append Data' : 'डेटा मर्ज / जोड़ें'}
                onPress={handleMerge}
                type="primary"
              />
              <View style={{ height: 12 }} />
              <ActionButton
                title={locale === 'en' ? 'Replace Entire Database' : 'संपूर्ण डेटाबेस बदलें'}
                onPress={handleReplace}
                type="danger"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Encryption Password Modal */}
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setIsPasswordModalVisible(false); setTempPassword(''); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {locale === 'en' ? 'Encrypted Backup' : 'एन्क्रिप्टेड बैकअप'}
              </Text>
              <TouchableOpacity onPress={() => { setIsPasswordModalVisible(false); setTempPassword(''); }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              {locale === 'en'
                ? 'This backup database is encrypted. Please enter the password key to decrypt and restore it.'
                : 'यह बैकअप डेटाबेस एन्क्रिप्टेड है। कृपया इसे डिक्रिप्ट और पुनर्स्थापित करने के लिए पासवर्ड दर्ज करें।'}
            </Text>

            <TextInput
              secureTextEntry
              style={styles.modalInput}
              placeholder={locale === 'en' ? 'Enter Password Key' : 'पासवर्ड दर्ज करें'}
              placeholderTextColor={theme.colors.textSecondary}
              value={tempPassword}
              onChangeText={setTempPassword}
            />

            <View style={styles.modalBtnRow}>
              <ActionButton
                title={locale === 'en' ? 'Submit' : 'जमा करें'}
                onPress={handlePasswordSubmit}
                type="primary"
                style={{ width: '100%', marginVertical: 0 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    pickStage: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
    },
    iconBackground: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.dark ? '#1E293B' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    },
    stageTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    stageDesc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 16,
      marginBottom: 36,
    },
    uploadCard: {
      width: '100%',
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadCardText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 12,
      marginBottom: 4,
    },
    uploadCardSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    previewStage: {
      marginTop: 8,
    },
    fileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    fileCardInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 16,
    },
    fileCardName: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    fileCardStatus: {
      fontSize: 12,
      color: theme.colors.success,
      marginTop: 2,
    },
    changeBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.dark ? '#334155' : '#F1F5F9',
    },
    changeBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statsCard: {
      width: (width - 52) / 2,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statsValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 8,
      marginBottom: 2,
    },
    statsLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    casesPreviewCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    cardHeaderTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginBottom: 12,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    previewRowIcon: {
      marginRight: 10,
    },
    previewRowContent: {
      flex: 1,
      marginRight: 10,
    },
    previewRowTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    previewRowSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
    previewRowDateBadge: {
      backgroundColor: theme.dark ? '#334155' : '#F1F5F9',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    previewRowDateText: {
      fontSize: 11,
      color: theme.colors.text,
      fontWeight: '500',
    },
    moreText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.dark ? '#1E293B' : '#F0F9FF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.06)' : '#E0F2FE',
      marginBottom: 24,
    },
    infoIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 6,
    },
    infoText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    btnGroup: {
      width: '100%',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 24,
      padding: 24,
      width: width * 0.85,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 20,
    },
    modalInput: {
      width: '100%',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 24,
    },
    modalBtnRow: {
      width: '100%',
    },
    modalBtn: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    loadingBox: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      width: '80%',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      marginTop: 16,
      textAlign: 'center',
    },
  });

export default DatabaseImportScreen;
