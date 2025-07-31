import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useState, useEffect, useRef } from "react";
import { formatDate } from "../../utils/commonFunctions";
import { View, Text, TextInput, FlatList, ActivityIndicator, SafeAreaView } from "react-native";
import * as db from "../../DataBase";
import { CaseWithDetails } from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import { CaseDataScreen } from "../../Types/appTypes";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import { getCurrentUserId } from "../../utils/commonFunctions";
import { getSearchScreenStyles } from "./SearchScreenStyle";

const SearchScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = getSearchScreenStyles(theme);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CaseWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

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
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleUpdateHearing = (caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  };

  const handleSaveHearing = async (notes: string, nextHearingDate: Date, userId: number) => {
    if (!selectedCase || !selectedCase.id) return;
    const caseId = parseInt(selectedCase.id.toString(), 10);
    if(isNaN(caseId)) return;

    try {
      const caseExists = await db.getCaseById(caseId);
      if(!caseExists) {
        console.error("Case not found");
        return;
      }
      if (notes) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: new Date().toISOString(),
          notes: notes,
        });
      }
      await db.updateCase(caseId, { NextDate: nextHearingDate.toISOString() }, userId);
      executeSearch(searchQuery);
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  };

  const renderItem = ({ item }: { item: CaseWithDetails }) => {
    const caseCardDetails: CaseDataScreen = {
      id: item.id,
      title: item.CaseTitle || 'No Title',
      client: item.ClientName || 'Unknown Client',
      status: item.CaseStatus || 'Pending',
      nextHearing: item.NextDate ? formatDate(item.NextDate) : 'N/A',
      lastUpdate: item.updated_at ? formatDate(item.updated_at) : 'N/A',
      previousHearing: item.PreviousDate ? formatDate(item.PreviousDate) : 'N/A',
    };
    return <NewCaseCard caseDetails={caseCardDetails} onUpdateHearingPress={() => handleUpdateHearing(caseCardDetails)} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <View style={styles.searchSection}>
          <View style={styles.inputContainer}>
            <AntDesign
              name="search1"
              size={22}
              color={theme.colors.textSecondary}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Search cases..."
              placeholderTextColor={theme.colors.placeholderText}
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
                return <Text style={styles.emptyText}>Enter a query to start searching.</Text>;
              }
              if (results.length === 0 && !isLoading) {
                return <Text style={styles.emptyText}>No cases found matching your query.</Text>;
              }
              return null;
            }}
          />
        )}
      </View>
      {selectedCase && (
        <UpdateHearingPopup
          visible={isPopupVisible}
          onClose={() => setPopupVisible(false)}
          onSave={(notes, nextHearingDate) =>
            handleSaveHearing(notes, nextHearingDate, getCurrentUserId())
          }
        />
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;
