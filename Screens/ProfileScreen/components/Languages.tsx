import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface LanguagesProps {
  languages: string[];
}

const Languages: React.FC<LanguagesProps> = ({ languages }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Languages</Text>
      <Text style={styles.languagesText}>{languages.join(", ")}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  languagesText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
});

export default Languages;
