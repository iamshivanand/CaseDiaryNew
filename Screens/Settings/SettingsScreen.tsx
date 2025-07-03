import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Title, Divider, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Assuming your RootStackParamList includes ManageLookupCategory
// You might need to define this more concretely in your navigation types
// For now, using a generic approach or define it in Types/navigationtypes.ts
import { RootStackParamList } from '../../Types/navigationtypes'; // Adjust path as needed

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SettingsScreen' // Current screen name
>;

const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const menuItems = [
    { title: 'Manage Case Types', category: 'CaseTypes', icon: 'briefcase-outline' },
    { title: 'Manage Courts', category: 'Courts', icon: 'scale-balance' },
    { title: 'Manage Districts', category: 'Districts', icon: 'map-marker-outline' },
    { title: 'Manage Police Stations', category: 'PoliceStations', icon: 'shield-home-outline' },
    // Add more settings items here if needed
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.onSurface }]}>App Settings</Title>
      <List.Section style={styles.listSection}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.category}>
            <List.Item
              title={item.title}
              left={(props) => <List.Icon {...props} icon={item.icon} color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                navigation.navigate('ManageLookupCategoryScreen', {
                  categoryName: item.category,
                  title: item.title
                })
              }
              titleStyle={{ color: theme.colors.onSurface }}
              style={styles.listItem}
            />
            {index < menuItems.length - 1 && <Divider style={styles.divider} />}
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
    // backgroundColor: 'rgba(0,0,0,0.1)', // Or use theme.colors.outline
  },
});

export default SettingsScreen;
