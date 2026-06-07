import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { List, Title, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Types/navigationtypes';
import { ThemeContext, ThemeMode } from '../../Providers/ThemeProvider';
import { useTranslation } from '../../Providers/LanguageProvider';
import { exportDatabaseBackup, importDatabaseBackup } from '../../utils/backupManager';
import { useAdTrigger } from '../CommonComponents/AdManager';

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SettingsScreen'
>;

const SettingsScreen = () => {
  const { theme, themeMode, setThemeMode } = useContext(ThemeContext);
  const { t, locale, setLocale } = useTranslation();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { showAdWithPreload } = useAdTrigger();

  const selectTheme = () => {
    Alert.alert(
      t("settings_theme"),
      locale === "en" ? "Choose your preferred theme option:" : "अपनी पसंदीदा थीम विकल्प चुनें:",
      [
        { text: locale === "en" ? "Follow System Settings" : "सिस्टम सेटिंग्स के अनुसार", onPress: () => setThemeMode("system") },
        { text: locale === "en" ? "Light Mode" : "लाइट मोड", onPress: () => setThemeMode("light") },
        { text: locale === "en" ? "Dark Mode" : "डार्क मोड", onPress: () => setThemeMode("dark") },
        { text: t("alert_cancel"), style: "cancel" }
      ]
    );
  };

  const selectLanguage = () => {
    Alert.alert(
      t("settings_lang"),
      locale === "en" ? "Choose your preferred language option:" : "अपनी पसंदीदा भाषा का चयन करें:",
      [
        { text: "English", onPress: () => setLocale("en") },
        { text: "Hindi (हिंदी)", onPress: () => setLocale("hi") },
        { text: t("alert_cancel"), style: "cancel" }
      ]
    );
  };

  const handleBackup = async () => {
    try {
      await showAdWithPreload("interstitial", async (success) => {
        if (success) {
          try {
            await exportDatabaseBackup();
            Alert.alert("Backup Complete", "Your database was successfully shared/saved.");
          } catch (error: any) {
            Alert.alert("Backup Error", error.message || "Could not generate database backup.");
          }
        }
      });
    } catch (adError) {
      console.warn("Ad preloading or display encountered an error:", adError);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      t("settings_restore_btn"),
      locale === "en" 
        ? "Warning: Restoring will overwrite your current database. Do you want to proceed?" 
        : "चेतावनी: पुनर्स्थापित करने से आपका वर्तमान डेटाबेस अधिलेखित हो जाएगा। क्या आप आगे बढ़ना चाहते हैं?",
      [
        { text: t("alert_cancel"), style: "cancel" },
        { text: t("alert_ok"), onPress: () => importDatabaseBackup() }
      ]
    );
  };

  const handleImportCSV = () => {
    // @ts-ignore
    navigation.navigate("ImportMigration", { isFromOnboarding: false });
  };

  const handleScanDuplicates = () => {
    // @ts-ignore
    navigation.navigate("DuplicateReview");
  };

  const lookupMenuItems = [
    { title: t('settings_lookup_types'), category: 'CaseTypes', icon: 'briefcase-outline' },
    { title: t('settings_lookup_courts'), category: 'Courts', icon: 'scale-balance' },
    { title: t('settings_lookup_districts'), category: 'Districts', icon: 'map-marker-outline' },
    { title: t('settings_lookup_police'), category: 'PoliceStations', icon: 'shield-home-outline' },
  ];

  const currentThemeLabel = themeMode === 'system' 
    ? (locale === 'en' ? 'Follow System' : 'सिस्टम सेटिंग्स') 
    : themeMode === 'light' 
      ? (locale === 'en' ? 'Light Mode' : 'लाइट मोड') 
      : (locale === 'en' ? 'Dark Mode' : 'डार्क मोड');

  const themeIcon = themeMode === 'dark' ? 'weather-night' : themeMode === 'light' ? 'weather-sunny' : 'theme-light-dark';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.text }]}>{t("settings_title")}</Title>
      
      <List.Section style={styles.listSection}>
        <List.Subheader style={{ color: theme.colors.textSecondary }}>{t("settings_personalization")}</List.Subheader>
        <List.Item
          title={t("settings_theme")}
          description={currentThemeLabel}
          left={(props) => <List.Icon {...props} icon={themeIcon} color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
          onPress={selectTheme}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <List.Item
          title={t("settings_lang")}
          description={locale === 'en' ? 'English' : 'Hindi (हिंदी)'}
          left={(props) => <List.Icon {...props} icon="translate" color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
          onPress={selectLanguage}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <List.Subheader style={{ color: theme.colors.textSecondary }}>{t("settings_backup_section")}</List.Subheader>
        <List.Item
          title={t("settings_backup_btn")}
          description={t("settings_backup_desc")}
          left={(props) => <List.Icon {...props} icon="cloud-upload-outline" color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
          onPress={handleBackup}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <List.Item
          title={t("settings_restore_btn")}
          description={t("settings_restore_desc")}
          left={(props) => <List.Icon {...props} icon="cloud-download-outline" color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
          onPress={handleRestore}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <List.Item
          title={t("settings_import_csv_btn")}
          description={t("settings_import_csv_desc")}
          left={(props) => <List.Icon {...props} icon="file-import-outline" color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
          onPress={handleImportCSV}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <List.Item
          title={t("settings_scan_duplicates_btn")}
          description={t("settings_scan_duplicates_desc")}
          left={(props) => <List.Icon {...props} icon="content-copy" color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
          onPress={handleScanDuplicates}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <List.Subheader style={{ color: theme.colors.textSecondary }}>{t("settings_lookup_section")}</List.Subheader>
        {lookupMenuItems.map((item, index) => (
          <React.Fragment key={item.category}>
            <List.Item
              title={item.title}
              left={(props) => <List.Icon {...props} icon={item.icon} color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
              onPress={() =>
                navigation.navigate('ManageLookupCategoryScreen', {
                  categoryName: item.category,
                  title: item.title
                })
              }
              titleStyle={{ color: theme.colors.text }}
              style={styles.listItem}
            />
            {index < lookupMenuItems.length - 1 && (
              <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  listSection: {
    marginTop: 8,
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  divider: {
    height: 0.5,
  },
});

export default SettingsScreen;
