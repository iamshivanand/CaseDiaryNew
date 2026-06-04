import React, { useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface LanguagesProps {
  languages: string[];
  isEditing: boolean;
  tempLanguages: string;
  onTempLanguagesChange: (text: string) => void;
}

const Languages: React.FC<LanguagesProps> = ({
  languages,
  isEditing,
  tempLanguages,
  onTempLanguagesChange,
}) => {
  const { theme } = useContext(ThemeContext);

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.border,
          borderWidth: 1,
        }
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Languages</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[
            styles.textInput, 
            { 
              backgroundColor: theme.colors.inputBackground, 
              color: theme.colors.text, 
              borderColor: theme.colors.border 
            }
          ]}
          value={tempLanguages}
          onChangeText={onTempLanguagesChange}
          placeholder="e.g., English, Spanish, French"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
      ) : (
        <Text style={[styles.languagesText, { color: theme.colors.textSecondary }]}>
          {languages && languages.length > 0 ? languages.join(", ") : "Not specified."}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
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
  },
  editIcon: {
    padding: 5,
  },
  languagesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  textInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: 'top',
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
