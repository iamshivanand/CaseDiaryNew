import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface TabSelectorProps {
  tabs: string[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({
  tabs,
  selectedTab,
  onSelectTab,
}) => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              { 
                backgroundColor: theme.colors.cardBackground, 
                borderColor: theme.colors.border,
                borderWidth: 1
              },
              selectedTab === tab && { 
                backgroundColor: theme.colors.primary, 
                borderColor: theme.colors.primary 
              },
            ]}
            onPress={() => onSelectTab(tab)}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: theme.colors.textSecondary },
                selectedTab === tab && { color: "#FFFFFF" },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default TabSelector;
