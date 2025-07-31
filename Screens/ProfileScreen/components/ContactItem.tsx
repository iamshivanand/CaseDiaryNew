import React, { useContext } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { getContactItemStyles } from "./ContactItemStyle";

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
  const styles = getContactItemStyles(theme);

  const content = (
    <View style={styles.itemContainer}>
      <Icon name={iconName} size={22} style={styles.icon} />
      {isEditing ? (
        <TextInput
          style={styles.textInput}
          value={editText}
          onChangeText={onEditTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholderText}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      ) : (
        <Text style={styles.text}>{text || "Not specified"}</Text>
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

export default ContactItem;
