import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Dimensions, FlatList, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import * as db from "../../DataBase"; // Import db functions
import { CaseWithDetails } from "../../DataBase"; // Import the type for results
import { ThemeContext } from "../../Providers/ThemeProvider";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import ActionButton from "../CommonComponents/ActionButton"; // For search button
import { CaseDataScreen } from "../../Types/appTypes";

const windowWidth = Dimensions.get("window").width;

const SearchScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  // Generate styles with theme
  const styles = getSearchScreenStyles(theme);

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
    const caseCardDetails: CaseDataScreen = {
      id: item.id,
      title: item.CaseTitle || 'No Title',
      client: item.ClientName || 'Unknown Client',
      status: item.CaseStatus || 'Pending',
      nextHearing: item.NextDate ? new Date(item.NextDate).toLocaleDateString() : 'N/A',
      lastUpdate: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A',
      previousHearing: item.PreviousDate ? new Date(item.PreviousDate).toLocaleDateString() : 'N/A',
    };
    return <NewCaseCard caseDetails={caseCardDetails} />;
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

const getSearchScreenStyles = (theme: Theme) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: theme.colors.background, // Added theme background
  },
  searchSection: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#e0e0e0',
    backgroundColor: theme.colors.background, // Ensure section bg matches screen if needed
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground || '#f0f0f0', // Themeable input bg
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 48,
    marginBottom: 10,
  },
  input: { // Text color already applied dynamically in component
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  icon: { // Icon color already applied dynamically in component
    marginRight: 10,
  },
  searchButton: { // ActionButton will use its own themed styles, this is for layout
    minHeight: 48,
    marginVertical: 0,
  },
  searchButtonText: { // ActionButton will use its own themed styles
    fontSize: 16,
  },
  loader: { // ActivityIndicator color applied dynamically in component
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyText: { // Text color already applied dynamically in component
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

// Add to Theme interface in ThemeProvider.tsx if these are new:
// inputBackground?: string;
// shadow?: string;
// primaryLight?: string; // For icon backgrounds like in DocumentCard
// cardBackground?: string; // For cards
// status...Bg/Text colors for StatusBadge
