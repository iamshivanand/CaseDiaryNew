import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  // Add your prop types here
}

const BannerCard: React.FC<Props> = () => {
  return (
    <View style={styles.BannerContainer}>
      <Text>BannerCard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  BannerContainer: {},
});

export default BannerCard;
