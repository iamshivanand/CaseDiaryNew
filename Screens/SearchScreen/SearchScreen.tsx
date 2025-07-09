import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Dimensions, FlatList, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import * as db from "../../DataBase"; // Import db functions
import { CaseWithDetails } from "../../DataBase"; // Import the type for results
import { ThemeContext } from "../../Providers/ThemeProvider";
import CaseCard from "../CommonComponents/CaseCard";
import ActionButton from "../CommonComponents/ActionButton"; // For search button
import { CaseDetails as CaseCardPropsType } from "../CommonComponents/CaseCard"; // Type expected by CaseCard

const windowWidth = Dimensions.get("window").width;

const SearchScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CaseWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // To track if a search has been performed

  const executeSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false); // Reset if query is empty
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    try {
      // Assuming db.searchCases takes query and optional userId.
      // For now, not passing userId.
      const fetchedCases = await db.searchCases(searchQuery.trim());
      setResults(fetchedCases);
    } catch (error) {
      console.error("Error searching cases:", error);
      setResults([]);
      // Optionally, show an error alert to the user
    } finally {
      setIsLoading(false);
    }
  };

  // Function to be called if a case is deleted from CaseCard (via CaseDetailScreen)
  // to refresh search results or clear them.
  const handleCaseDeleted = (deletedCaseId: number | string) => {
    setResults(prevResults => prevResults.filter(item => item.id !== deletedCaseId));
  };


  const renderItem = ({ item }: { item: CaseWithDetails }) => {
    // Map CaseWithDetails to the CaseDetails type expected by CaseCard
    const caseCardDetails: CaseCardPropsType = {
      id: item.id,
      uniqueId: item.uniqueId,
      caseNumber: item.CaseTitle || item.case_number || "N/A", // Prioritize CaseTitle
      caseType: item.case_type_name || "N/A",
      court: item.court_name || "N/A",
      // CaseCard expects dateFiled as string; FiledDate or dateFiled from DB is ISO string
      dateFiled: item.FiledDate || item.dateFiled || "N/A",
      // Add other fields if CaseCard displays them and they are available in CaseWithDetails
    };
    return <CaseCard caseDetails={caseCardDetails} onDelete={() => handleCaseDeleted(item.id)} />;
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchSection}>
        <View style={styles.inputContainer}>
          <AntDesign
            name="search1"
            size={22} // Slightly smaller icon
            color={theme.colors.textSecondary || "#555"}
            style={styles.icon}
          />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Search cases..."
            placeholderTextColor={theme.colors.textSecondary || "#888"}
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={executeSearch} // Allow search on keyboard submit
            returnKeyType="search"
          />
        </View>
        <ActionButton
          title="Search"
          onPress={executeSearch}
          type="primary"
          style={styles.searchButton}
          textStyle={styles.searchButtonText}
          disabled={isLoading}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={() => {
            if (!hasSearched) {
              return <Text style={[styles.emptyText, {color: theme.colors.text}]}>Enter a query and press Search.</Text>;
            }
            if (results.length === 0 && !isLoading) { // This condition is slightly redundant due to FlatList's empty check
              return <Text style={[styles.emptyText, {color: theme.colors.text}]}>No cases found matching your query.</Text>;
            }
            return null;
          }}
        />
      )}
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 10, // Remove default padding, use per-section padding
  },
  searchSection: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Light separator line
    backgroundColor: 'transparent', // Or theme.colors.background
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#f0f0f0', // Lighter background for input field itself
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 48, // Increased height
    marginBottom: 10, // Space before search button
  },
  input: {
    flex: 1,
    height: '100%', // Take full height of container
    fontSize: 16,
  },
  icon: {
    marginRight: 10,
  },
  searchButton: {
    minHeight: 48, // Match input height
    marginVertical: 0, // Remove default vertical margin if any from ActionButton
  },
  searchButtonText: {
    fontSize: 16,
  },
  loader: {
    flex: 1, // Center loader if it's the only thing
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20, // Space at the bottom of the list
    flexGrow: 1, // Important for ListEmptyComponent to work correctly
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666', // Default color, will be overridden by theme
  },
});
