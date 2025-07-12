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
  getCases,
  // searchFormsAccordingToFieldsAsync, // To be replaced or refactored
  searchCases, // Replaces searchFormsAsync
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
    try {
      // Assuming MOCK_CURRENT_USER_ID or actual user ID logic will be added here if needed by searchCases
      // const userId = null; // Placeholder for actual user ID
      const results = await searchCases(text /*, userId */);
      setTotalCases(results || []); // searchCases returns CaseWithDetails[] directly
    } catch (error) {
      console.error("Error searching cases:", error);
      setTotalCases([]); // Clear cases on error or show a message
    }
  };

  // Temporarily commenting out handleSearchForFilters and its usage
  // as searchFormsAccordingToFieldsAsync needs a proper replacement strategy.
  const handleSearchForFilters = async (
    FieldName: string,
    searchValue: string,
    comparisonOperator: string = "="
  ) => {
    console.warn(
      "handleSearchForFilters is not implemented with current searchCases. Field:",
      FieldName, "Value:", searchValue
    );
    // try {
    //   // This function (searchFormsAccordingToFieldsAsync) needs to be refactored or replaced.
    //   // const result = await searchFormsAccordingToFieldsAsync(
    //   //   global.db,
    //   //   FieldName,
    //   //   searchValue,
    //   //   comparisonOperator
    //   // );
    //   // console.log("result from this is ", result._array);
    //   // setTotalCases(result._array);
    // } catch (error) {
    //   console.error("Error fetching forms with filters:", error);
    // }
  };

  useEffect(() => {
    let currentDate;
    let yesterday;
    let tomorrow;
    let yesterdayDate;
    let tomorrowDate;

    // Temporarily disable filter logic that uses handleSearchForFilters
    const filter = params?.Filter;
    if (filter === "todaysCases" || filter === "tomorrowCases" || filter === "yesterdayCases" || filter === "undatedCases") {
        console.warn(`Filter '${filter}' is temporarily disabled as handleSearchForFilters is not fully implemented.`);
        // Default to fetching all data if specific filter logic is disabled
        fetchData();
    } else {
        fetchData();
    }

    // switch (params?.Filter) {
    //   case "todaysCases":
    //     currentDate = formatDate(new Date());
    //     console.log("current date is ", currentDate);
    //     // handleSearchForFilters("NextDate", currentDate); // Disabled
    //     break;
    //   case "tomorrowCases":
    //     currentDate = new Date();
    //     tomorrow = new Date(currentDate);
    //     tomorrow.setDate(currentDate.getDate() + 1);
    //     tomorrowDate = formatDate(tomorrow);
    //     // handleSearchForFilters("NextDate", tomorrowDate); // Disabled
    //     break;
    //   case "yesterdayCases":
    //     currentDate = new Date();
    //     yesterday = new Date(currentDate);
    //     yesterday.setDate(currentDate.getDate() - 1);
    //     yesterdayDate = formatDate(yesterday);
    //     // console.log("yesterdays date", yesterdayDate);
    //     // handleSearchForFilters("NextDate", yesterdayDate); // Disabled
    //     break;
    //   case "undatedCases":
    //     currentDate = new Date();
    //     yesterday = new Date(currentDate);
    //     yesterday.setDate(currentDate.getDate() - 1);
    //     yesterdayDate = formatDate(yesterday);
    //     // handleSearchForFilters("NextDate", yesterdayDate, "<"); // Disabled
    //     break;
    //   default:
    //     fetchData();
    // }
  }, [params?.Filter]); // Added params?.Filter to dependency array

  const handleDelete = () => {
    fetchData(); // Re-fetch all data after a delete
  };

  const fetchData = async () => {
    try {
      // Assuming MOCK_CURRENT_USER_ID or actual user ID logic will be added here if needed by getCases
      // const userId = null; // Placeholder for actual user ID
      const results = await getCases(/* userId */);
      console.log("Fetched cases: ", results);
      setTotalCases(results ? results.reverse() : []); // getCases returns CaseWithDetails[] directly
    } catch (error) {
      console.error("Error fetching cases:", error);
      setTotalCases([]); // Clear cases on error or show a message
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
