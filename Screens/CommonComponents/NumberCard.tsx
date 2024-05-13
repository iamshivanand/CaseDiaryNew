import React from "react";
import { View, StyleSheet, useWindowDimensions, Text } from "react-native";
// import Animated, {
//   useSharedValue,
//   withTiming,
//   interpolateColor,
// } from "react-native-reanimated";

interface NumberCardProps {
  finalValue: number;
  textValue: string;
  colorValue: string;
}

const NumberCard: React.FC<NumberCardProps> = ({
  finalValue,
  textValue,
  colorValue,
}) => {
  const { width, height } = useWindowDimensions();
  const cardSize = Math.min(width * 0.37, height * 0.8); // Adjust the percentage as needed
  const textSize = cardSize * 0.15;
  return (
    <View style={[styles.card, { width: cardSize, height: cardSize }]}>
      <View
        style={[
          styles.iconContainer,
          { height: cardSize * 0.5, borderRadius: cardSize / 1 },
        ]}
      >
        <Text
          style={[
            styles.number,
            { fontSize: cardSize * 0.3, color: colorValue },
          ]}
        >
          {finalValue}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.text, { fontSize: textSize }]}>{textValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // maxHeight: 160,
    // maxWidth: 150,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#f7f4f4",
    margin: 10,
    padding: 10,
    borderRadius: 10,
    alignItems: "flex-start",
    justifyContent: "space-evenly",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  iconContainer: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    marginTop: 0,
    height: "50%",
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  number: {
    fontSize: 60,
    fontWeight: "bold",
  },
});

export default NumberCard;
