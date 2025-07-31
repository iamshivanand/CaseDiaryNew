import React, { useContext } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { getAboutMeStyles } from "./AboutMeStyle";

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel }) => {
  const { theme } = useContext(ThemeContext);
  const styles = getAboutMeStyles(theme);

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

interface AboutMeProps {
  description: string;
  isEditing: boolean;
  tempDescription: string;
  onTempDescriptionChange: (text: string) => void;
  onEditPress: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const AboutMe: React.FC<AboutMeProps> = ({
  description,
  isEditing,
  tempDescription,
  onTempDescriptionChange,
  onEditPress,
  onSave,
  onCancel,
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getAboutMeStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>About Me</Text>
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
            value={tempDescription}
            onChangeText={onTempDescriptionChange}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.colors.placeholderText}
            multiline
            numberOfLines={5}
          />
          <EditControls onSave={onSave} onCancel={onCancel} />
        </>
      ) : (
        <Text style={styles.descriptionText}>{description || "Not specified."}</Text>
      )}
    </View>
  );
};

export default AboutMe;
