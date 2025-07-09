import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface AboutMeProps {
  description: string;
}

const AboutMe: React.FC<AboutMeProps> = ({ description }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>About Me</Text>
      <Text style={styles.descriptionText}>{description}</Text>
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
  descriptionText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22, // Improved readability
  },
});

export default AboutMe;
