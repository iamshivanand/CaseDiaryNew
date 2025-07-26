import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import React, { useCallback, useContext, useState, useEffect } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"; // Removed Dimensions, ScrollView
import { getCases, addCaseTimelineEvent, updateCase, getCaseById } from "../../DataBase";
import { Case } from "../../DataBase/schema";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { CaseDataScreen } from "../../Types/appTypes"; // Import the new data type
import { formatDate, getCurrentUserId } from "../../utils/commonFunctions";
import NewCaseCard from "./components/NewCaseCard"; // Import the new case card
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";

const transformApiCaseToCaseDataScreen = (apiCase: Case): CaseDataScreen => {
  return {
    id: apiCase.id.toString(),
    title: apiCase.CaseTitle || "No Title",
    client: apiCase.ClientName || "N/A",
    status: apiCase.CaseStatus || "N/A",
    nextHearing: apiCase.NextDate ? formatDate(apiCase.NextDate) : "N/A",
    lastUpdate: apiCase.updated_at ? formatDate(apiCase.updated_at) : "N/A",
    previousHearing: apiCase.PreviousDate
      ? formatDate(apiCase.PreviousDate)
      : "N/A",
  };
};
type FilterStatus = "Active" | "Closed";

type CasesListRouteProp = RouteProp<{ params: { Filter?: string } }, 'params'>;

const CasesList = () => {
  const route = useRoute<CasesListRouteProp>();
  const filterParam = route.params?.Filter;
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext); // Keep theme for styling
  const componentStyles = styles(theme);

  const [allCases, setAllCases] = useState<CaseDataScreen[]>([]); // Initialize with sample data
  const [filteredCases, setFilteredCases] = useState<CaseDataScreen[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("Active");
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  // Initial data load and filtering
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    filterAndSearchCases();
  }, [activeFilter, searchText, allCases]); // Re-filter when filter, search text, or allCases change

  const fetchData = async () => {
    try {
      // Replace with actual DB call if using getCases
      const results = await getCases(/* userId */);
      setAllCases(
        results ? results.map(transformApiCaseToCaseDataScreen) : []
      ); // Transform if necessary
      // setAllCases(sampleCases); // Using sample data
    } catch (error) {
      console.error("Error fetching cases:", error);
      setAllCases([]);
    }
  };

  const filterAndSearchCases = () => {
    let tempCases = allCases;

    if (filterParam) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterParam === 'todaysCases') {
        tempCases = tempCases.filter(c => {
          if (c.nextHearing === 'N/A') return false;
          const hearingDate = new Date(c.nextHearing);
          hearingDate.setHours(0, 0, 0, 0);
          return hearingDate.getTime() === today.getTime();
        });
      } else if (filterParam === 'tomorrowCases') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tempCases = tempCases.filter(c => {
          if (c.nextHearing === 'N/A') return false;
          const hearingDate = new Date(c.nextHearing);
          hearingDate.setHours(0, 0, 0, 0);
          return hearingDate.getTime() === tomorrow.getTime();
        });
      } else if (filterParam === 'yesterdayCases') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        tempCases = tempCases.filter(c => {
          if (c.nextHearing === 'N/A') return false;
          const hearingDate = new Date(c.nextHearing);
          hearingDate.setHours(0, 0, 0, 0);
          return hearingDate.getTime() === yesterday.getTime();
        });
      }
    } else {
      // Filter by status
      if (activeFilter === "Active") {
        tempCases = tempCases.filter((c) => c.status !== "Closed");
      } else if (activeFilter === "Closed") {
        tempCases = tempCases.filter((c) => c.status === "Closed");
      }
    }

    // Filter by search text (searches title and client)
    if (searchText.trim() !== "") {
      const lowerSearchText = searchText.toLowerCase();
      tempCases = tempCases.filter(
        (c) =>
          c.title.toLowerCase().includes(lowerSearchText) ||
          c.client.toLowerCase().includes(lowerSearchText)
      );
    }
    tempCases.sort((a, b) => {
      const aDate = new Date(a.nextHearing);
      const bDate = new Date(b.nextHearing);
      if (a.nextHearing === 'N/A') return 1;
      if (b.nextHearing === 'N/A') return -1;
      return aDate.getTime() - bDate.getTime();
    });
    setFilteredCases(tempCases);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleUpdateHearing = (caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  };

  const handleSaveHearing = async (notes: string, nextHearingDate: Date, userId: number) => {
    if (!selectedCase || !selectedCase.id) return;
    const caseId = parseInt(selectedCase.id.toString(), 10);
    if(isNaN(caseId)) return;

    try {
      const caseExists = await getCaseById(caseId);
      if(!caseExists) {
        console.error("Case not found");
        return;
      }
      // 1. Add timeline event
      if (notes) {
        await addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: new Date().toISOString(),
          notes: notes,
        });
      }

      // 2. Update case's next hearing date
      await updateCase(caseId, {
        NextDate: nextHearingDate.toISOString(),
      }, userId);

      // 3. Refresh the list
      fetchData();
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  };

  const navigateToAddCase = () => {
    // @ts-ignore
    navigation.navigate("AddCase"); // Assuming 'AddCase' is the name of the route for adding a new case
  };

  return (
    <SafeAreaView style={componentStyles.safeArea}>
      <View style={componentStyles.header}>
        <Text style={componentStyles.headerTitle}>Cases</Text>
        <TouchableOpacity
          onPress={navigateToAddCase}
          style={componentStyles.addButton}
        >
          <Ionicons
            name="add-circle-outline"
            size={32}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={componentStyles.searchContainer}>
        <View style={componentStyles.inputWrapper}>
          <AntDesign
            name="search1"
            size={20}
            color={theme.colors.secondary}
            style={componentStyles.searchIcon}
          />
          <TextInput
            style={componentStyles.input}
            placeholder="Search cases..."
            placeholderTextColor={theme.colors.secondary}
            onChangeText={handleSearchChange}
            value={searchText}
          />
        </View>
      </View>

      <View style={componentStyles.toggleContainer}>
        <TouchableOpacity
          style={[
            componentStyles.toggleButton,
            activeFilter === "Active"
              ? componentStyles.activeButton
              : componentStyles.inactiveButton,
          ]}
          onPress={() => setActiveFilter("Active")}
        >
          <Text
            style={
              activeFilter === "Active"
                ? componentStyles.activeButtonText
                : componentStyles.inactiveButtonText
            }
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            componentStyles.toggleButton,
            activeFilter === "Closed"
              ? componentStyles.activeButton
              : componentStyles.inactiveButton,
          ]}
          onPress={() => setActiveFilter("Closed")}
        >
          <Text
            style={
              activeFilter === "Closed"
                ? componentStyles.activeButtonText
                : componentStyles.inactiveButtonText
            }
          >
            Closed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCases}
        renderItem={({ item }) => (
          <NewCaseCard
            caseDetails={item}
            onUpdateHearingPress={() => handleUpdateHearing(item)}
          />
        )}
        keyExtractor={(item) =>
          item.id?.toString() || Math.random().toString()
        }
        ListEmptyComponent={
          <View style={componentStyles.emptyListContainer}>
            <Text style={componentStyles.emptyListText}>No cases found.</Text>
          </View>
        }
        contentContainerStyle={componentStyles.listContentContainer}
      />
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

export default CasesList;

const styles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: theme.fontSizes.heading,
      fontFamily: theme.fontStyles.bold,
      color: theme.colors.text,
    },
    addButton: {
      padding: 6,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.secondary,
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      height: 44,
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.regular,
      color: theme.colors.text,
    },
    toggleContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 8,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: "center",
      marginHorizontal: 5,
    },
    activeButton: {
      backgroundColor: theme.colors.primary,
    },
    inactiveButton: {
      backgroundColor: theme.colors.secondary,
    },
    activeButtonText: {
      color: theme.colors.background,
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.bold,
    },
    inactiveButtonText: {
      color: theme.colors.background,
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.bold,
    },
    listContentContainer: {
      paddingBottom: 16,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 50,
    },
    emptyListText: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.regular,
      color: theme.colors.secondary,
    },
  });
