import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, Dimensions, FlatList, ActivityIndicator, SafeAreaView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as db from "../../DataBase"; // Import db functions
import { CaseWithDetails } from "../../DataBase"; // Import the type for results
import { ThemeContext } from "../../Providers/ThemeProvider";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import { CaseDataScreen } from "../../Types/appTypes";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const windowWidth = Dimensions.get("window").width;

const SearchScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = getSearchScreenStyles(theme);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CaseWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const executeSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    try {
      const fetchedCases = await db.searchCases(query.trim());
      setResults(fetchedCases);
    } catch (error) {
      console.error("Error searching cases:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      executeSearch(searchQuery);
    }, 500); // 500ms delay

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleCaseDeleted = (deletedCaseId: number | string) => {
    setResults(prevResults => prevResults.filter(item => item.id !== deletedCaseId));
  };

  const renderItem = ({ item }: { item: CaseWithDetails }) => {
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
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.searchSection}>
          <View style={styles.inputContainer}>
            <AntDesign
              name="search1"
              size={22}
              color={theme.colors.textSecondary || "#555"}
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Search cases..."
              placeholderTextColor={theme.colors.textSecondary || "#888"}
              onChangeText={setSearchQuery}
              value={searchQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        {isLoading ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loader}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{color: theme.colors.text}}>Searching...</Text>
          </Animated.View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContentContainer}
            ListEmptyComponent={() => {
              if (!hasSearched) {
                return <Text style={[styles.emptyText, {color: theme.colors.text}]}>Enter a query to start searching.</Text>;
              }
              if (results.length === 0 && !isLoading) {
                return <Text style={[styles.emptyText, {color: theme.colors.text}]}>No cases found matching your query.</Text>;
              }
              return null;
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;

const getSearchScreenStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background, // Added theme background
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchSection: {
    paddingBottom: 10,
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
