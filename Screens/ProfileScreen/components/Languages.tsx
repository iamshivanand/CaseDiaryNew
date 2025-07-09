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

interface LanguagesProps {
  languages: string[];
  isEditing: boolean;
  tempLanguages: string; // Storing as comma-separated string for TextInput
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
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>Languages</Text>
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
            value={tempLanguages}
            onChangeText={onTempLanguagesChange}
            placeholder="e.g., English, Spanish, French"
            multiline // Allows for more space if needed, though typically single line
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
    color: "#1F2937",
  },
  editIcon: {
    padding: 5,
  },
  languagesText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
  textInput: {
    fontSize: 15,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: 'top', // For Android if multiline is truly used
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
    backgroundColor: "#22C55E",
  },
  cancelButton: {
    backgroundColor: "#EF4444",
  },
  buttonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default Languages;
