import React, { useContext } from "react";
import { Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit }) => {
  const { theme } = useContext(ThemeContext);
  const cardGradient = theme.dark 
    ? ["#1E293B", "#0F172A"] // Slate-800 to Slate-900 for dark mode
    : ["#FFFFFF", "#F1F5F9"]; // Slate-50 gradient for light mode

  return (
    <LinearGradient
      colors={cardGradient}
      style={[
        styles.card,
        {
          borderColor: theme.colors.border,
          borderWidth: theme.dark ? 1 : 0,
        }
      ]}
    >
      <Text style={[styles.valueText, { color: theme.colors.primary }]}>
        {value}
        {unit && <Text style={[styles.unitText, { color: theme.colors.primary }]}> {unit}</Text>}
      </Text>
      <Text style={[styles.labelText, { color: theme.colors.textSecondary }]}>{label}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
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
    marginBottom: 5,
  },
  unitText: {
    fontSize: 12,
    fontWeight: "normal",
  },
  labelText: {
    fontSize: 13,
    textAlign: "center",
  },
});

export default StatCard;
