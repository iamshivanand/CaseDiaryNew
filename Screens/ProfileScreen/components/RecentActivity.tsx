import React, { useContext } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import ProfileTimelineItem from "./TimelineItem";
import { ActivityItem } from "../../../Types/appTypes";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const { theme } = useContext(ThemeContext);

  if (!activities || activities.length === 0) {
    return (
      <View 
        style={[
          styles.container, 
          { 
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.border,
            borderWidth: 1,
          }
        ]}
      >
        <Text style={[styles.heading, { color: theme.colors.text }]}>Recent Activity</Text>
        <Text style={[styles.noActivityText, { color: theme.colors.textSecondary }]}>No recent activity to display.</Text>
      </View>
    );
  }

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.border,
          borderWidth: 1,
        }
      ]}
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Recent Activity</Text>
      <FlatList
        data={activities}
        renderItem={({ item, index }) => (
          <ProfileTimelineItem
            item={item}
            isLastItem={index === activities.length - 1}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  noActivityText: {
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default RecentActivity;
