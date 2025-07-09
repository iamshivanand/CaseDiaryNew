import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface ContactItemProps {
  iconName: string;
  text: string; // Display text when not editing
  onPress?: () => void; // For linking (email, phone) when not editing
  isEditing: boolean;
  editText?: string; // Value for TextInput when editing
  onEditTextChange?: (newText: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}

const ContactItem: React.FC<ContactItemProps> = ({
  iconName,
  text,
  onPress,
  isEditing,
  editText,
  onEditTextChange,
  placeholder,
  keyboardType = "default",
}) => {
  const content = (
    <View style={styles.itemContainer}>
      <Icon name={iconName} size={22} color="#3B82F6" style={styles.icon} />
      {isEditing ? (
        <TextInput
          style={styles.textInput}
          value={editText}
          onChangeText={onEditTextChange}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      ) : (
        <Text style={styles.text}>{text || "Not specified"}</Text>
      )}
    </View>
  );

  if (onPress && !isEditing) { // Make item touchable only when not editing
    return (
      <TouchableOpacity onPress={onPress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content; // If editing, or no onPress handler
};

const styles = StyleSheet.create({
  touchable: {
    // No specific style needed if itemContainer provides enough padding
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10, // Adjusted padding
  },
  icon: {
    marginRight: 18, // Increased spacing
    width: 24, // Give icon a fixed width for alignment
  },
  text: {
    fontSize: 15,
    color: "#374151", // Dark gray
    flexShrink: 1,
    lineHeight: 22,
  },
  textInput: {
    flex: 1, // Take remaining space
    fontSize: 15,
    color: "#1F2937",
    borderBottomWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});

export default ContactItem;
