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

type Props = {
  navigation: StackNavigationProp<any, "Home">;
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddCaseDetails")}
          >
            <View style={styles.primarybuttons}>
              <Text style={styles.buttonText}>Add Case</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("AllCases")}>
            <View style={styles.primarybuttons}>
              <Text style={styles.buttonText}>View All</Text>
            </View>
          </TouchableOpacity>
        </View>
        {/* built a corosol for add and some other banner information */}
        <Text>Cases List</Text>
        <View
          style={{
            padding: 10,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <NumberCard
            finalValue={30}
            textValue="Today's Cases"
            colorValue="green"
          />
          <NumberCard
            finalValue={40}
            textValue="Tomorrow's Cases"
            colorValue="green"
          />
          <NumberCard
            finalValue={40}
            textValue="Yesterday's Cases"
            colorValue="green"
          />
          <NumberCard
            finalValue={40}
            textValue="UnDated Cases" //where next hearing Date is previous then Todays Date
            colorValue="green"
          />
          <NumberCard
            finalValue={40}
            textValue="Running Cases"
            colorValue="green"
          />
          <NumberCard
            finalValue={40}
            textValue="Running Cases"
            colorValue="green"
          />
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
    backgroundColor: "pink",
  },
  buttonContainer: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f7f4f4",
  },
  primarybuttons: {
    height: 40,
    width: (windowWidth - 60) / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#37d6c1",
    borderRadius: 5,
    color: "white",
    elevation: 5,
    shadowColor: "#7a7474",
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
});

export default HomeScreen;
