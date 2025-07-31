import React, { useContext } from "react";
import { View, Text } from "react-native";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { getStatCardStyles } from "./StatCardStyle";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit }) => {
  const { theme } = useContext(ThemeContext);
  const styles = getStatCardStyles(theme);

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

export default StatCard;
