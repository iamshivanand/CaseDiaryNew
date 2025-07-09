import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ActivityItem } from "../../../Types/appTypes";

interface TimelineItemProps {
  item: ActivityItem;
  isLastItem?: boolean;
}

const ProfileTimelineItem: React.FC<TimelineItemProps> = ({ item, isLastItem }) => {
  return (
    <View style={styles.container}>
      <View style={styles.lineAndDotContainer}>
        <View style={styles.dot} />
        {!isLastItem && <View style={styles.line} />}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.descriptionText}>{item.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingLeft: 10, // Give some space for the timeline elements
    paddingRight: 15, // General padding for content
    paddingVertical: 10,
  },
  lineAndDotContainer: {
    alignItems: "center",
    marginRight: 15,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6", // Blue accent color
    zIndex: 1, // Ensure dot is above the line
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#E0E0E0", // Light gray for the line
    marginTop: -2, // Connect line to the dot smoothly
    marginBottom: -2, // Connect line to the next dot smoothly
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 10, // Space before the next item starts visually
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 20,
  },
});

export default ProfileTimelineItem;
