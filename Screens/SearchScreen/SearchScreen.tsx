import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import { View, Text, TextInput, StyleSheet, Dimensions } from "react-native";

import { searchFormsAsync } from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import CaseCard from "../CommonComponents/CaseCard";

interface Props {
  // Add your prop types here
}
const windowWidth = Dimensions.get("window").width;

const SearchScreen: React.FC<Props> = () => {
  const { theme } = useContext(ThemeContext);
  const [TotalCases, setTotalCases] = useState([]);
  const [searchText, setSearchText] = useState("");
  const handleSearch = (text) => {
    setSearchText(text);
    handleSearchCase(text);
  };
  const handleSearchCase = async (text) => {
    if (text === "") {
      setTotalCases([]);
    } else {
      try {
        const result = await searchFormsAsync(global.db, text);
        setTotalCases(result._array);
      } catch (error) {
        console.error("Error fetching forms:", error);
      }
    }
  };
  const handleDelete = () => {
    handleSearchCase(searchText);
  };
  return (
    <View
      style={{
        height: "100%",
        padding: 10,
        flexDirection: "column",
        justifyContent: "flex-start",
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
        <Text>Please Searh</Text>
      )}
    </View>
  );
};

export default SearchScreen;

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
