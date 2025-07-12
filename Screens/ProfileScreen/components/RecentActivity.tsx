import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import ProfileTimelineItem from "./TimelineItem"; // Ensure this path is correct
import { ActivityItem } from "../../../Types/appTypes";

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Recent Activity</Text>
        <Text style={styles.noActivityText}>No recent activity to display.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recent Activity</Text>
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
        scrollEnabled={false} // If this list is inside a ScrollView, disable its own scrolling
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15, // More space before the list starts
  },
  noActivityText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default RecentActivity;
