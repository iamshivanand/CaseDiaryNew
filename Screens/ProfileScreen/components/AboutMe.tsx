import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel }) => (
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
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>About Me</Text>
        {!isEditing && (
          <TouchableOpacity onPress={onEditPress} style={styles.editIcon}>
            <Icon name="pencil-outline" size={22} color="#3B82F6" />
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
            multiline
            numberOfLines={5} // Suggests a good initial height
          />
          <EditControls onSave={onSave} onCancel={onCancel} />
        </>
      ) : (
        <Text style={styles.descriptionText}>{description || "Not specified."}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937", // Darker gray
  },
  editIcon: {
    padding: 5, // Easier to tap
  },
  descriptionText: {
    fontSize: 15,
    color: "#4B5563", // Medium gray
    lineHeight: 22,
  },
  textInput: {
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
    borderWidth: 1,
    borderColor: "#D1D5DB", // Gray border
    borderRadius: 6,
    padding: 10,
    minHeight: 100, // Good minimum height for multiline
    textAlignVertical: 'top', // For Android
    marginBottom: 15,
  },
  editControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: "#22C55E", // Green
  },
  cancelButton: {
    backgroundColor: "#EF4444", // Red
  },
  buttonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default AboutMe;
