import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface ContactItemProps {
  iconName: string;
  text: string;
  onPress?: () => void;
  isEditing: boolean;
  editText?: string;
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
  const { theme } = useContext(ThemeContext);

  const content = (
    <View style={styles.itemContainer}>
      <Icon name={iconName} size={22} color={theme.colors.primary} style={styles.icon} />
      {isEditing ? (
        <TextInput
          style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={editText}
          onChangeText={onEditTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      ) : (
        <Text style={[styles.text, { color: theme.colors.text }]}>{text || "Not specified"}</Text>
      )}
    </View>
  );

  if (onPress && !isEditing) {
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
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  icon: {
    marginRight: 18,
    width: 24,
  },
  text: {
    fontSize: 15,
    flexShrink: 1,
    lineHeight: 22,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    borderBottomWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});

export default ContactItem;
