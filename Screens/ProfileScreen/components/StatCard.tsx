import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.valueText}>
        {value}
        {unit && <Text style={styles.unitText}> {unit}</Text>}
      </Text>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  valueText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6", // Blue accent
    marginBottom: 5,
  },
  unitText: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#3B82F6", // Blue accent
  },
  labelText: {
    fontSize: 13,
    color: "#6B7280", // Gray color for label
    textAlign: "center",
  },
});

export default StatCard;
