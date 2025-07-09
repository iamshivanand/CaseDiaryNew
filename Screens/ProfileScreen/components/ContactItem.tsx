import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Using MaterialCommunityIcons for a wider selection

interface ContactItemProps {
  iconName: string;
  text: string;
  onPress?: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ iconName, text, onPress }) => {
  const content = (
    <View style={styles.itemContainer}>
      <Icon name={iconName} size={20} color="#3B82F6" style={styles.icon} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchable: {
    // Ensures the touchable opacity covers the item area if needed for visual feedback
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, // Increased padding for better spacing
  },
  icon: {
    marginRight: 15, // Increased spacing between icon and text
  },
  text: {
    fontSize: 15,
    color: "#333",
    flexShrink: 1, // Allows text to wrap if it's too long
  },
});

export default ContactItem;
