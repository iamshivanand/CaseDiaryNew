import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import { List, Title, Divider } from "react-native-paper";

import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { RootStackParamList } from "../../Types/navigationtypes";
import { exportDatabaseBackup } from "../../utils/backupManager";
import { reScheduleAllNotifications } from "../../utils/notificationScheduler";
import { useAdTrigger } from "../CommonComponents/AdManager";

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SettingsScreen"
>;

const SettingsScreen = () => {
  const { theme, themeMode, setThemeMode } = useContext(ThemeContext);
  const { t, locale, setLocale } = useTranslation();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { showAdWithPreload } = useAdTrigger();

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifDays, setNotifDays] = useState(1);
  const [notifHour, setNotifHour] = useState(19);

  // Advocate profile states
  const [advName, setAdvName] = useState("");
  const [advEnrollment, setAdvEnrollment] = useState("");
  const [advAddress, setAdvAddress] = useState("");
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  useEffect(() => {
    const loadNotifSettings = async () => {
      try {
        const enabled = await AsyncStorage.getItem("@notification_enabled");
        const days = await AsyncStorage.getItem("@notification_days_before");
        const hour = await AsyncStorage.getItem("@notification_hour");

        if (enabled !== null) setNotifEnabled(enabled === "true");
        if (days !== null) setNotifDays(parseInt(days, 10));
        if (hour !== null) setNotifHour(parseInt(hour, 10));

        // Load advocate details
        const name = await AsyncStorage.getItem("@advocate_name");
        const enroll = await AsyncStorage.getItem("@advocate_enrollment");
        const addr = await AsyncStorage.getItem("@advocate_address");
        if (name) setAdvName(name);
        if (enroll) setAdvEnrollment(enroll);
        if (addr) setAdvAddress(addr);
      } catch (e) {
        console.error("Failed to load settings in UI:", e);
      }
    };
    loadNotifSettings();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await AsyncStorage.setItem("@advocate_name", advName);
      await AsyncStorage.setItem("@advocate_enrollment", advEnrollment);
      await AsyncStorage.setItem("@advocate_address", advAddress);
      setIsProfileModalVisible(false);
      Alert.alert(
        locale === "en" ? "Saved" : "सहेजा गया",
        locale === "en"
          ? "Advocate details saved successfully."
          : "अधिवक्ता विवरण सफलतापूर्वक सहेजा गया।"
      );
    } catch (e) {
      console.error("Failed to save advocate profile:", e);
      Alert.alert("Error", "Failed to save profile settings.");
    }
  };

  const getNotificationLabel = () => {
    if (!notifEnabled) {
      return locale === "en" ? "Alerts Disabled" : "अलर्ट बंद हैं";
    }
    const timeStr = notifHour === 7 ? "7:30 AM" : "7:00 PM";
    if (notifDays === 0) {
      return locale === "en"
        ? `Day of Hearing (${timeStr})`
        : `सुनवाई के दिन (${timeStr})`;
    }
    if (notifDays === 1) {
      return locale === "en"
        ? `1 Day Before (${timeStr})`
        : `1 दिन पहले (${timeStr})`;
    }
    return locale === "en"
      ? `${notifDays} Days Before (${timeStr})`
      : `${notifDays} दिन पहले (${timeStr})`;
  };

  const selectNotificationPreferences = () => {
    Alert.alert(
      locale === "en" ? "Notification Alerts" : "अधिसूचना अलर्ट",
      locale === "en"
        ? "Select when you would like to receive reminders:"
        : "चुनें कि आप कब रिमाइंडर प्राप्त करना चाहते हैं:",
      [
        {
          text: locale === "en" ? "Disabled" : "बंद करें",
          onPress: async () => {
            await AsyncStorage.setItem("@notification_enabled", "false");
            setNotifEnabled(false);
            await reScheduleAllNotifications();
            Alert.alert(
              locale === "en" ? "Saved" : "सहेजा गया",
              locale === "en"
                ? "Hearing reminders disabled."
                : "सुनवाई के रिमाइंडर बंद कर दिए गए हैं।"
            );
          },
        },
        {
          text:
            locale === "en"
              ? "Day of Hearing (7:30 AM)"
              : "सुनवाई के दिन (सुबह 7:30 बजे)",
          onPress: async () => {
            await AsyncStorage.setItem("@notification_enabled", "true");
            await AsyncStorage.setItem("@notification_days_before", "0");
            await AsyncStorage.setItem("@notification_hour", "7");
            await AsyncStorage.setItem("@notification_minute", "30");
            setNotifEnabled(true);
            setNotifDays(0);
            setNotifHour(7);
            await reScheduleAllNotifications();
            Alert.alert(
              locale === "en" ? "Saved" : "सहेजा गया",
              locale === "en"
                ? "Reminders set for 7:30 AM on hearing day."
                : "सुनवाई के दिन सुबह 7:30 बजे के लिए रिमाइंडर सेट।"
            );
          },
        },
        {
          text:
            locale === "en"
              ? "1 Day Before (7:00 PM)"
              : "1 दिन पहले (शाम 7:00 बजे)",
          onPress: async () => {
            await AsyncStorage.setItem("@notification_enabled", "true");
            await AsyncStorage.setItem("@notification_days_before", "1");
            await AsyncStorage.setItem("@notification_hour", "19");
            await AsyncStorage.setItem("@notification_minute", "0");
            setNotifEnabled(true);
            setNotifDays(1);
            setNotifHour(19);
            await reScheduleAllNotifications();
            Alert.alert(
              locale === "en" ? "Saved" : "सहेजा गया",
              locale === "en"
                ? "Reminders set for 7:00 PM the evening before."
                : "एक शाम पहले 7:00 बजे के लिए रिमाइंडर सेट।"
            );
          },
        },
        {
          text:
            locale === "en"
              ? "2 Days Before (7:00 PM)"
              : "2 दिन पहले (शाम 7:00 बजे)",
          onPress: async () => {
            await AsyncStorage.setItem("@notification_enabled", "true");
            await AsyncStorage.setItem("@notification_days_before", "2");
            await AsyncStorage.setItem("@notification_hour", "19");
            await AsyncStorage.setItem("@notification_minute", "0");
            setNotifEnabled(true);
            setNotifDays(2);
            setNotifHour(19);
            await reScheduleAllNotifications();
            Alert.alert(
              locale === "en" ? "Saved" : "सहेजा गया",
              locale === "en"
                ? "Reminders set for 2 days before at 7:00 PM."
                : "2 दिन पहले शाम 7:00 बजे के लिए रिमाइंडर सेट।"
            );
          },
        },
      ]
    );
  };

  const selectTheme = () => {
    Alert.alert(
      t("settings_theme"),
      locale === "en"
        ? "Choose your preferred theme option:"
        : "अपनी पसंदीदा थीम विकल्प चुनें:",
      [
        {
          text:
            locale === "en"
              ? "Follow System Settings"
              : "सिस्टम सेटिंग्स के अनुसार",
          onPress: () => setThemeMode("system"),
        },
        {
          text: locale === "en" ? "Light Mode" : "लाइट मोड",
          onPress: () => setThemeMode("light"),
        },
        {
          text: locale === "en" ? "Dark Mode" : "डार्क मोड",
          onPress: () => setThemeMode("dark"),
        },
        { text: t("alert_cancel"), style: "cancel" },
      ]
    );
  };

  const selectLanguage = () => {
    Alert.alert(
      t("settings_lang"),
      locale === "en"
        ? "Choose your preferred language option:"
        : "अपनी पसंदीदा भाषा का चयन करें:",
      [
        { text: "English", onPress: () => setLocale("en") },
        { text: "Hindi (हिंदी)", onPress: () => setLocale("hi") },
        { text: t("alert_cancel"), style: "cancel" },
      ]
    );
  };

  const handleBackup = async () => {
    try {
      await showAdWithPreload("interstitial", async (success) => {
        if (success) {
          try {
            await exportDatabaseBackup();
            Alert.alert(
              "Backup Complete",
              "Your database was successfully shared/saved."
            );
          } catch (error: any) {
            Alert.alert(
              "Backup Error",
              error.message || "Could not generate database backup."
            );
          }
        }
      });
    } catch (adError) {
      console.warn("Ad preloading or display encountered an error:", adError);
    }
  };

  const handleRestore = () => {
    // @ts-ignore
    navigation.navigate("DatabaseImportScreen");
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
    {
      title: t("settings_lookup_types"),
      category: "CaseTypes",
      icon: "briefcase-outline",
    },
    {
      title: t("settings_lookup_courts"),
      category: "Courts",
      icon: "scale-balance",
    },
    {
      title: t("settings_lookup_districts"),
      category: "Districts",
      icon: "map-marker-outline",
    },
    {
      title: t("settings_lookup_police"),
      category: "PoliceStations",
      icon: "shield-home-outline",
    },
  ];

  const currentThemeLabel =
    themeMode === "system"
      ? locale === "en"
        ? "Follow System"
        : "सिस्टम सेटिंग्स"
      : themeMode === "light"
        ? locale === "en"
          ? "Light Mode"
          : "लाइट मोड"
        : locale === "en"
          ? "Dark Mode"
          : "डार्क मोड";

  const themeIcon =
    themeMode === "dark"
      ? "weather-night"
      : themeMode === "light"
        ? "weather-sunny"
        : "theme-light-dark";

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      

      <List.Section style={styles.listSection}>
        <List.Subheader style={{ color: theme.colors.textSecondary }}>
          {t("settings_personalization")}
        </List.Subheader>
        <List.Item
          title={t("settings_theme")}
          description={currentThemeLabel}
          left={(props) => (
            <List.Icon
              {...props}
              icon={themeIcon}
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={selectTheme}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Item
          title={t("settings_lang")}
          description={locale === "en" ? "English" : "Hindi (हिंदी)"}
          left={(props) => (
            <List.Icon
              {...props}
              icon="translate"
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={selectLanguage}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Item
          title={locale === "en" ? "Advocate Profile" : "अधिवक्ता प्रोफ़ाइल"}
          description={
            locale === "en"
              ? "Set default name, bar enrollment and office address"
              : "डिफ़ॉल्ट नाम, बार नामांकन और कार्यालय का पता सेट करें"
          }
          left={(props) => (
            <List.Icon
              {...props}
              icon="account-cog-outline"
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={() => setIsProfileModalVisible(true)}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Item
          title={
            locale === "en"
              ? "Notification Preferences"
              : "अधिसूचना प्राथमिकताएं"
          }
          description={getNotificationLabel()}
          left={(props) => (
            <List.Icon
              {...props}
              icon="bell-outline"
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={selectNotificationPreferences}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Subheader style={{ color: theme.colors.textSecondary }}>
          {t("settings_backup_section")}
        </List.Subheader>
        <List.Item
          title={t("settings_backup_btn")}
          description={t("settings_backup_desc")}
          left={(props) => (
            <List.Icon
              {...props}
              icon="cloud-upload-outline"
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={handleBackup}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Item
          title={t("settings_restore_btn")}
          description={t("settings_restore_desc")}
          left={(props) => (
            <List.Icon
              {...props}
              icon="cloud-download-outline"
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={handleRestore}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Item
          title={t("settings_import_csv_btn")}
          description={t("settings_import_csv_desc")}
          left={(props) => (
            <List.Icon
              {...props}
              icon="file-import-outline"
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={handleImportCSV}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Item
          title={t("settings_import_ecourts_btn") || "Import from eCourts App"}
          description={
            t("settings_import_ecourts_desc") ||
            "Import all cases from eCourts Services backup text file"
          }
          left={(props) => (
            <List.Icon
              {...props}
              icon="cellphone-arrow-down"
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={() => navigation.navigate("ECourtsAppImport")}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Item
          title={t("settings_scan_duplicates_btn")}
          description={t("settings_scan_duplicates_desc")}
          left={(props) => (
            <List.Icon
              {...props}
              icon="content-copy"
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <List.Icon
              {...props}
              icon="chevron-right"
              color={theme.colors.textSecondary}
            />
          )}
          onPress={handleScanDuplicates}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <List.Subheader style={{ color: theme.colors.textSecondary }}>
          {t("settings_lookup_section")}
        </List.Subheader>
        {lookupMenuItems.map((item, index) => (
          <React.Fragment key={item.category}>
            <List.Item
              title={item.title}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={item.icon}
                  color={theme.colors.primary}
                />
              )}
              right={(props) => (
                <List.Icon
                  {...props}
                  icon="chevron-right"
                  color={theme.colors.textSecondary}
                />
              )}
              onPress={() =>
                navigation.navigate("ManageLookupCategoryScreen", {
                  categoryName: item.category,
                  title: item.title,
                })
              }
              titleStyle={{ color: theme.colors.text }}
              style={styles.listItem}
            />
            {index < lookupMenuItems.length - 1 && (
              <Divider
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </List.Section>

      {/* Advocate Profile Edit Modal */}
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {locale === "en"
                  ? "Edit Advocate Profile"
                  : "अधिवक्ता प्रोफ़ाइल संपादित करें"}
              </Text>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)}>
                <List.Icon icon="close" color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text
                style={[
                  styles.modalLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {locale === "en" ? "Advocate Name" : "अधिवक्ता का नाम"}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                  },
                ]}
                value={advName}
                onChangeText={setAdvName}
                placeholder={
                  locale === "en" ? "Enter name..." : "नाम दर्ज करें..."
                }
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text
                style={[
                  styles.modalLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {locale === "en"
                  ? "Bar Enrollment Number"
                  : "बार नामांकन संख्या"}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                  },
                ]}
                value={advEnrollment}
                onChangeText={setAdvEnrollment}
                placeholder={
                  locale === "en" ? "e.g. MAH/1234/2026" : "उदा. MAH/1234/2026"
                }
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text
                style={[
                  styles.modalLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {locale === "en"
                  ? "Office/Contact Address"
                  : "कार्यालय/संपर्क का पता"}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                    height: 80,
                  },
                ]}
                value={advAddress}
                onChangeText={setAdvAddress}
                placeholder={
                  locale === "en" ? "Enter address..." : "पता दर्ज करें..."
                }
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { borderColor: theme.colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setIsProfileModalVisible(false)}
                >
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {locale === "en" ? "Cancel" : "रद्द करें"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleSaveProfile}
                >
                  <Text style={{ color: "#ffffff", fontWeight: "bold" }}>
                    {locale === "en" ? "Save" : "सहेजें"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    fontWeight: "bold",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalForm: {
    width: "100%",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 16,
    height: 40,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
});

export default SettingsScreen;
