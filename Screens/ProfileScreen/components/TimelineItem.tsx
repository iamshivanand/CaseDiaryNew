import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ActivityItem } from "../../../Types/appTypes";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface TimelineItemProps {
  item: ActivityItem;
  isLastItem?: boolean;
}

const ProfileTimelineItem: React.FC<TimelineItemProps> = ({ item, isLastItem }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <View style={styles.lineAndDotContainer}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        {!isLastItem && <View style={[styles.line, { backgroundColor: theme.colors.border }]} />}
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.dateText, { color: theme.colors.text }]}>{item.date}</Text>
        <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>{item.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingLeft: 10,
    paddingRight: 15,
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
    zIndex: 1,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: -2,
    marginBottom: -2,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 20,
  },
});

export default ProfileTimelineItem;
