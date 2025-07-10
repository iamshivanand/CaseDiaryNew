import { StackNavigationProp } from "@react-navigation/stack";
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";

import { ThemeContext } from "../../Providers/ThemeProvider";
import NumberCard from "../CommonComponents/NumberCard";
import { RootStackParamList } from "../../Types/navigationtypes"; // Ensure this is the correct path

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "Home">; // Use RootStackParamList
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  return (
    <View
      style={{
        height: "100%",
        padding: 10,
        flexDirection: "column",
        backgroundColor: theme.colors.background,
      }}
    >
      <ScrollView>
        <View style={styles.carouselContainer}>
          <Text>Banner carousel </Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() =>
              navigation.navigate("AddCaseDetails", { update: false })
            }
          >
            <View style={styles.primarybuttons}>
              <Text style={styles.buttonText}>Add Case</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => navigation.navigate("AllCases")}
          >
            <View style={styles.primarybuttons}>
              <Text style={styles.buttonText}>View All Cases</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          {/* Add Generate PDF Button */}
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => navigation.navigate("PDFGeneratorScreen")}
          >
            <View style={[styles.primarybuttons, styles.generatePdfButton]}>
              <Text style={styles.buttonText}>Generate PDF</Text>
            </View>
          </TouchableOpacity>
           {/* You can add another button here if needed, or leave it to keep Generate PDF full-width in its row if buttonWrapper is flex:1 */}
          <View style={styles.buttonWrapper} />
        </View>
        {/* built a corosol for add and some other banner information */}
        <Text style={{color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginVertical: 10}}>Cases Overview</Text>
        <View
          style={{
            padding: 10,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              navigation.navigate("AllCases", { Filter: "todaysCases" });
            }}
          >
            <NumberCard
              finalValue={30}
              textValue="Today's Cases"
              colorValue="green"
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              navigation.navigate("AllCases", { Filter: "tomorrowCases" });
            }}
          >
            <NumberCard
              finalValue={40}
              textValue="Tomorrow's Cases"
              colorValue="green"
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              navigation.navigate("AllCases", { Filter: "yesterdayCases" });
            }}
          >
            <NumberCard
              finalValue={40}
              textValue="Yesterday's Cases"
              colorValue="#ffb414"
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              navigation.navigate("AllCases", { Filter: "undatedCases" });
            }}
          >
            <NumberCard
              finalValue={40}
              textValue="UnDated Cases" //where next hearing Date is previous then Todays Date
              colorValue="green"
            />
          </TouchableOpacity>
          {/* <NumberCard
            finalValue={40}
            textValue="Running Cases"
            colorValue="green"
          />
          <NumberCard
            finalValue={40}
            textValue="Running Cases"
            colorValue="green"
          /> */}
        </View>
      </ScrollView>
    </View>
  );
};
const windowWidth = Dimensions.get("window").width;
const styles = StyleSheet.create({
  carouselContainer: {
    height: 200,
    width: "100%",
    backgroundColor: "pink", // Replace with theme color if needed
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonRow: { // Changed from buttonContainer to buttonRow for clarity
    flexDirection: "row",
    justifyContent: "space-between", // Distribute space between buttons
    alignItems: "center",
    marginVertical: 5, // Reduced margin for tighter layout
    // backgroundColor: "#f7f4f4", // Consider removing or using theme.colors.surface
    // borderRadius: 10, // Optional, if you want rounded rows
  },
  buttonWrapper: {
    flex: 1, // Each button wrapper takes equal space
    marginHorizontal: 5, // Add some space between buttons
  },
  primarybuttons: {
    height: 50, // Increased height for better touchability
    // width: (windowWidth - 60) / 2, // Width will be managed by flex on buttonWrapper
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#37d6c1", // Replace with theme.colors.primary or accent
    borderRadius: 8, // Slightly more rounded
    paddingHorizontal: 10, // Add some padding
    elevation: 3, // Reduced elevation for a flatter look if desired
    shadowColor: "#555", // Darker shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  generatePdfButton: {
    backgroundColor: "#007bff", // Blue accent as requested (or use theme.colors.accent)
  },
  buttonText: {
    fontSize: 16, // Adjusted for potentially longer text and better fit
    fontWeight: "bold",
    color: "white",
  },
});

export default HomeScreen;
