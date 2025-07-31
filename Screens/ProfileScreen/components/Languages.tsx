import React, { useContext } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { getLanguagesStyles } from "./LanguagesStyle";

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel }) => {
  const { theme } = useContext(ThemeContext);
  const styles = getLanguagesStyles(theme);

  return (
    <View style={styles.editControlsContainer}>
      <TouchableOpacity onPress={onSave} style={[styles.button, styles.saveButton]}>
        <Icon name="check" size={20} color="#fff" />
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelButton]}>
        <Icon name="close" size={20} color="#fff" />
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

interface LanguagesProps {
  languages: string[];
  isEditing: boolean;
  tempLanguages: string;
  onTempLanguagesChange: (text: string) => void;
  onEditPress: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const Languages: React.FC<LanguagesProps> = ({
  languages,
  isEditing,
  tempLanguages,
  onTempLanguagesChange,
  onEditPress,
  onSave,
  onCancel,
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getLanguagesStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>Languages</Text>
        {!isEditing && (
          <TouchableOpacity onPress={onEditPress} style={styles.editIcon}>
            <Icon name="pencil-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {isEditing ? (
        <>
          <TextInput
            style={styles.textInput}
            value={tempLanguages}
            onChangeText={onTempLanguagesChange}
            placeholder="e.g., English, Spanish, French"
            placeholderTextColor={theme.colors.placeholderText}
            multiline
          />
          <EditControls onSave={onSave} onCancel={onCancel} />
        </>
      ) : (
        <Text style={styles.languagesText}>
          {languages && languages.length > 0 ? languages.join(", ") : "Not specified."}
        </Text>
      )}
    </View>
  );
};

export default Languages;
