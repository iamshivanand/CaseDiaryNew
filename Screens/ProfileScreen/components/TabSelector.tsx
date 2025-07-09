import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

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
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.selectedTabButton,
            ]}
            onPress={() => onSelectTab(tab)}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === tab && styles.selectedTabButtonText,
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
    paddingVertical: 10,
    paddingHorizontal: 10, // Add some horizontal padding to the container
    backgroundColor: "#F3F4F6", // Light gray background for the tab bar area
  },
  scrollViewContent: {
    alignItems: 'center', // Align items vertically
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 18, // Increased padding for better touchability
    borderRadius: 20, // Pill shape
    marginHorizontal: 6, // Space between tabs
    backgroundColor: "#FFFFFF", // Default background for tabs
    borderWidth: 1,
    borderColor: "transparent", // Default no border
  },
  selectedTabButton: {
    backgroundColor: "#3B82F6", // Blue accent for selected tab
    borderColor: "#3B82F6",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151", // Dark gray for text
  },
  selectedTabButtonText: {
    color: "#FFFFFF", // White text for selected tab
  },
});

export default TabSelector;
