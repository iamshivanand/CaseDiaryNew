import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import React, { useCallback, useContext, useState, useEffect } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native"; // Removed Dimensions, ScrollView

import { ECourtsTextImportModal } from "./components/ECourtsTextImportModal";
import NewCaseCard from "./components/NewCaseCard"; // Import the new case card
import {
  getCases,
  addCaseTimelineEvent,
  updateCase,
  getCaseById,
} from "../../DataBase";
import { Case } from "../../DataBase/schema";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { CaseDataScreen } from "../../Types/appTypes"; // Import the new data type
import {
  formatDate,
  getCurrentUserId,
  getLocalDateString,
} from "../../utils/commonFunctions";
import { promptClientNotification } from "../../utils/whatsappNotifier";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import AdBanner from "../CommonComponents/AdBanner";

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
    priority: apiCase.Priority || "Low",
  };
};
type FilterStatus = "Active" | "Closed";

type CasesListRouteProp = RouteProp<{ params: { Filter?: string } }, "params">;

const LIMIT = 20;

const CasesList = () => {
  const route = useRoute<CasesListRouteProp>();
  const filterParam = route.params?.Filter;
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  const [cases, setCases] = useState<CaseDataScreen[]>([]);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("Active");
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isImportModalVisible, setImportModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search text input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Fetch paginated cases from the database
  const fetchCasesList = useCallback(
    async (
      offset: number,
      queryText: string,
      currentFilter: string,
      currentActiveFilter: FilterStatus
    ) => {
      setIsLoading(true);
      try {
        let dateFilter: "today" | "tomorrow" | "yesterday" | "undated" | null =
          null;
        let status: "Active" | "Closed" | "All" = currentActiveFilter;

        if (currentFilter === "todaysCases") {
          dateFilter = "today";
          status = "All";
        } else if (currentFilter === "tomorrowCases") {
          dateFilter = "tomorrow";
          status = "All";
        } else if (currentFilter === "yesterdayCases") {
          dateFilter = "yesterday";
          status = "All";
        }

        const results = await getCases(
          null, // Global case retrieval or pass specific user if needed
          LIMIT,
          offset,
          {
            status,
            dateFilter,
            searchQuery: queryText,
          }
        );

        const mapped = results
          ? results.map(transformApiCaseToCaseDataScreen)
          : [];

        if (offset === 0) {
          setCases(mapped);
        } else {
          setCases((prev) => [...prev, ...mapped]);
        }
        setHasMore(mapped.length === LIMIT);
      } catch (error) {
        console.error("Error fetching cases list:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Fetch initial page on tab focus, filter change, or query change
  useFocusEffect(
    useCallback(() => {
      fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilter);
    }, [debouncedSearchText, filterParam, activeFilter, fetchCasesList])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilter);
  }, [debouncedSearchText, filterParam, activeFilter, fetchCasesList]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchCasesList(
        cases.length,
        debouncedSearchText,
        filterParam || "",
        activeFilter
      );
    }
  }, [
    isLoading,
    hasMore,
    cases.length,
    debouncedSearchText,
    filterParam,
    activeFilter,
    fetchCasesList,
  ]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleUpdateHearing = useCallback((caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  }, []);

  const handleSaveHearing = useCallback(
    async (notes: string, nextHearingDate: Date, userId: number) => {
      if (!selectedCase || !selectedCase.id) return;
      const caseId = parseInt(selectedCase.id.toString(), 10);
      if (isNaN(caseId)) return;

      try {
        const caseExists = await getCaseById(caseId);
        if (!caseExists) {
          console.error("Case not found");
          return;
        }
        // 1. Add timeline event
        if (notes) {
          await addCaseTimelineEvent({
            case_id: caseId,
            hearing_date: new Date().toISOString(),
            notes,
          });
        }

        // 2. Update case's next hearing date
        await updateCase(
          caseId,
          {
            NextDate: getLocalDateString(nextHearingDate),
          },
          userId
        );

        // 3. Refresh list from page 0
        fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilter);

        // 4. Prompt WhatsApp notification to client
        setTimeout(() => {
          promptClientNotification(
            caseId,
            getLocalDateString(nextHearingDate),
            notes
          );
        }, 500);
      } catch (error) {
        console.error("Error updating hearing:", error);
      }
    },
    [
      selectedCase,
      debouncedSearchText,
      filterParam,
      activeFilter,
      fetchCasesList,
    ]
  );

  const navigateToAddCase = useCallback(() => {
    // @ts-ignore
    navigation.navigate("AddCase");
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: CaseDataScreen }) => (
      <NewCaseCard
        caseDetails={item}
        onUpdateHearingPress={() => handleUpdateHearing(item)}
      />
    ),
    [handleUpdateHearing]
  );

  const keyExtractor = useCallback(
    (item: CaseDataScreen) => item.id.toString(),
    []
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t("cases_header_title")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setImportModalVisible(true)}
            style={[styles.addButton, { marginRight: 8 }]}
          >
            <Ionicons
              name="cloud-download-outline"
              size={28}
              color={theme.colors.primary || "#007AFF"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={navigateToAddCase}
            style={styles.addButton}
          >
            <Ionicons
              name="add-circle-outline"
              size={32}
              color={theme.colors.primary || "#007AFF"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.colors.cardBackground || theme.colors.card,
            },
          ]}
        >
          <AntDesign
            name="search1"
            size={20}
            color={theme.colors.textSecondary || "#8E8E93"}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={t("cases_search_placeholder")}
            placeholderTextColor={theme.colors.textSecondary || "#8E8E93"}
            onChangeText={handleSearchChange}
            value={searchText}
          />
        </View>
      </View>

      {!filterParam && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeFilter === "Active"
                ? styles.activeButton
                : styles.inactiveButton,
              activeFilter === "Active"
                ? { backgroundColor: theme.colors.primary || "#007AFF" }
                : { backgroundColor: theme.colors.border || "#E0E0E0" },
            ]}
            onPress={() => setActiveFilter("Active")}
          >
            <Text
              style={
                activeFilter === "Active"
                  ? styles.activeButtonText
                  : [styles.inactiveButtonText, { color: theme.colors.text }]
              }
            >
              {t("cases_filter_active")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeFilter === "Closed"
                ? styles.activeButton
                : styles.inactiveButton,
              activeFilter === "Closed"
                ? { backgroundColor: theme.colors.primary || "#007AFF" }
                : { backgroundColor: theme.colors.border || "#E0E0E0" },
            ]}
            onPress={() => setActiveFilter("Closed")}
          >
            <Text
              style={
                activeFilter === "Closed"
                  ? styles.activeButtonText
                  : [styles.inactiveButtonText, { color: theme.colors.text }]
              }
            >
              {t("cases_filter_closed")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={cases}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={3}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        getItemLayout={(data, index) => ({
          length: 154, // Accurate height of memoized NewCaseCard (padding + margins + buttons)
          offset: 154 * index,
          index,
        })}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyListContainer}>
              <Text
                style={[
                  styles.emptyListText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("cases_no_cases")}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && cases.length > 0 ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContentContainer}
      />
      {selectedCase && (
        <UpdateHearingPopup
          visible={isPopupVisible}
          onClose={() => setPopupVisible(false)}
          onSave={async (notes, nextHearingDate) =>
            handleSaveHearing(notes, nextHearingDate, await getCurrentUserId())
          }
        />
      )}
      <ECourtsTextImportModal
        visible={isImportModalVisible}
        onClose={() => setImportModalVisible(false)}
        onImportSuccess={() => {
          fetchCasesList(
            0,
            debouncedSearchText,
            filterParam || "",
            activeFilter
          );
        }}
      />
      <AdBanner />
    </SafeAreaView>
  );
};

export default CasesList;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    // borderBottomWidth: 1, // Optional: if you want a separator
    // borderBottomColor: '#E0E0E0', // Optional
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    padding: 6, // Make it easier to tap
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
    // backgroundColor: '#F0F0F0', // Light grey background for search bar
    borderWidth: 1, // Optional: if you prefer a border
    borderColor: "#D1D1D6", // Optional
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44, // Standard iOS height
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Or 'center' with margin on buttons
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1, // Make buttons take equal width
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 5, // Add some space between buttons
  },
  activeButton: {
    // backgroundColor: "#007AFF", // Blue for active
  },
  inactiveButton: {
    // backgroundColor: "#E0E0E0", // Grey for inactive
  },
  activeButtonText: {
    color: "#FFFFFF", // White text for active
    fontSize: 15,
    fontWeight: "600",
  },
  inactiveButtonText: {
    // color: "#000000", // Black text for inactive
    fontSize: 15,
    fontWeight: "600",
  },
  listContentContainer: {
    paddingBottom: 100, // Add some padding at the bottom of the list
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50, // Adjust as needed
  },
  emptyListText: {
    fontSize: 16,
    // color: "#8E8E93", // Grey color for empty message
  },
});
