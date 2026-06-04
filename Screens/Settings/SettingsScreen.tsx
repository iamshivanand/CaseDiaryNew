import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { List, Title, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Types/navigationtypes';
import { ThemeContext, ThemeMode } from '../../Providers/ThemeProvider';
import { exportDatabaseBackup } from '../../utils/backupManager';

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SettingsScreen'
>;

const SettingsScreen = () => {
  const { theme, themeMode, setThemeMode } = useContext(ThemeContext);
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const selectTheme = () => {
    Alert.alert(
      "App Theme",
      "Choose your preferred theme option:",
      [
        { text: "Follow System Settings", onPress: () => setThemeMode("system") },
        { text: "Light Mode", onPress: () => setThemeMode("light") },
        { text: "Dark Mode", onPress: () => setThemeMode("dark") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleBackup = async () => {
    try {
      await exportDatabaseBackup();
      Alert.alert("Backup Complete", "Your database was successfully shared/saved.");
    } catch (error: any) {
      Alert.alert("Backup Error", error.message || "Could not generate database backup.");
    }
  };

  const lookupMenuItems = [
    { title: 'Manage Case Types', category: 'CaseTypes', icon: 'briefcase-outline' },
    { title: 'Manage Courts', category: 'Courts', icon: 'scale-balance' },
    { title: 'Manage Districts', category: 'Districts', icon: 'map-marker-outline' },
    { title: 'Manage Police Stations', category: 'PoliceStations', icon: 'shield-home-outline' },
  ];

  const currentThemeLabel = themeMode === 'system' ? 'Follow System' : themeMode === 'light' ? 'Light Mode' : 'Dark Mode';
  const themeIcon = themeMode === 'dark' ? 'weather-night' : themeMode === 'light' ? 'weather-sunny' : 'theme-light-dark';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.text }]}>App Settings</Title>
      
      <List.Section style={styles.listSection}>
        <List.Subheader style={{ color: theme.colors.textSecondary }}>Personalization</List.Subheader>
        <List.Item
          title="App Theme"
          description={currentThemeLabel}
          left={(props) => <List.Icon {...props} icon={themeIcon} color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
          onPress={selectTheme}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <List.Subheader style={{ color: theme.colors.textSecondary }}>Data Management & Backups</List.Subheader>
        <List.Item
          title="Backup Database"
          description="Export SQLite database to Google Drive or files"
          left={(props) => <List.Icon {...props} icon="cloud-upload-outline" color={theme.colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.textSecondary} />}
          onPress={handleBackup}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
          style={styles.listItem}
        />
        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <List.Subheader style={{ color: theme.colors.textSecondary }}>Categories & Lookup Tables</List.Subheader>
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
