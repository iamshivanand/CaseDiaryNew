import { AntDesign } from "@expo/vector-icons";
import { useRoute, RouteProp } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getFormsAsync,
  searchFormsAccordingToFieldsAsync,
  searchFormsAsync,
} from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { formatDate } from "../../utils/commonFunctions";
import CaseCard from "../CommonComponents/CaseCard";

const windowWidth = Dimensions.get("window").width;
interface RouteParams {
  Filter?: string;
}
type CasesListRouteProp = RouteProp<{ params: RouteParams }, "params">;

const CasesList = ({ navigation, routes }) => {
  const route = useRoute<CasesListRouteProp>();
  const { params } = route;
  const { theme } = useContext(ThemeContext);
  const [TotalCases, setTotalCases] = useState([]);
  const [searchText, setSearchText] = useState("");
  console.log("type text ", params?.Filter);

  const handleSearch = async (text) => {
    setSearchText(text);
    // Implement your search logic here
    try {
      const result = await searchFormsAsync(global.db, text);
      setTotalCases(result._array);
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  };
  const handleSearchForFilters = async (
    FieldName: string,
    searchValue: string,
    comparisonOperator: string = "="
  ) => {
    try {
      const result = await searchFormsAccordingToFieldsAsync(
        global.db,
        FieldName,
        searchValue,
        comparisonOperator
      );
      console.log("result from this is ", result._array);
      setTotalCases(result._array);
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    // type ? handleSearch(type)
    let currentDate;
    let yesterday;
    let tomorrow;
    let yesterdayDate;
    let tomorrowDate;
    switch (params?.Filter) {
      case "todaysCases":
        currentDate = formatDate(new Date());
        console.log("current date is ", currentDate);
        handleSearchForFilters("NextDate", currentDate);
        // handleSearch(currentDate);
        break;
      case "tomorrowCases":
        currentDate = new Date();
        tomorrow = new Date(currentDate);
        tomorrow.setDate(currentDate.getDate() + 1);
        tomorrowDate = formatDate(tomorrow);
        handleSearchForFilters("NextDate", tomorrowDate);
        break;
      case "yesterdayCases":
        currentDate = new Date();
        yesterday = new Date(currentDate);
        yesterday.setDate(currentDate.getDate() - 1);
        yesterdayDate = formatDate(yesterday);
        console.log("yesterdays date", yesterdayDate);
        handleSearchForFilters("NextDate", yesterdayDate);
        break;
      case "undatedCases":
        currentDate = new Date();
        yesterday = new Date(currentDate);
        yesterday.setDate(currentDate.getDate() - 1);
        yesterdayDate = formatDate(yesterday);
        handleSearchForFilters("NextDate", yesterdayDate, "<");
        break;
      default:
        fetchData();
    }
  }, []);
  const handleDelete = () => {
    fetchData();
  };
  const fetchData = async () => {
    try {
      const result = await getFormsAsync(global.db);
      console.log(" result now is ", result);
      setTotalCases(result._array.reverse());
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  };
  return (
    <ScrollView>
      <View
        style={{
          height: "100%",
          padding: 10,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <AntDesign
              name="search1"
              size={24}
              color="black"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Search"
              onChangeText={handleSearch}
              value={searchText}
              //autoFocus // Optional: Auto-focus on the input field
            />
          </View>
        </View>
        {TotalCases ? (
          TotalCases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              caseDetails={caseItem}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <Text>Loading...</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default CasesList;

const styles = StyleSheet.create({
  container: {},
  searchContainer: { padding: 10, alignItems: "center" },
  inputContainer: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    width: windowWidth - 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1, // Take up remaining space
    height: 40,
    fontSize: 16, // Adjust font size based on your design
  },
  icon: {
    marginRight: 10,
  },
});
