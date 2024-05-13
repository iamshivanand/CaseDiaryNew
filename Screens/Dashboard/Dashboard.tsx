import { NavigationProp } from "@react-navigation/native";
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";

interface DashboardScreenProps {
  navigation: NavigationProp<any>;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Good Morning, User</Text>
      </View>
      <View style={styles.quickAccessContainer}>
        <TouchableOpacity
          style={styles.quickAccessButton}
          onPress={() => navigateToScreen("Calendar")}
        >
          <Text style={styles.buttonText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAccessButton}
          onPress={() => navigateToScreen("Cases")}
        >
          <Text style={styles.buttonText}>Cases</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAccessButton}
          onPress={() => navigateToScreen("Documents")}
        >
          <Text style={styles.buttonText}>Documents</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  quickAccessButton: {
    backgroundColor: "#E0E0E0",
    padding: 20,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default DashboardScreen;
