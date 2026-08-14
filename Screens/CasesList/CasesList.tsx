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
  Platform,
  DeviceEventEmitter,
} from "react-native";

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
import { CASE_UPDATED_EVENT } from "../../utils/caseEvents";
import { mapCaseDbToScreen } from "../../utils/caseMapper";
import {
  formatDate,
  getCurrentUserId,
  getLocalDateString,
} from "../../utils/commonFunctions";
import dbCacheManager from "../../utils/dbCacheManager";
import { promptClientNotification } from "../../utils/whatsappNotifier";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import AdBanner from "../CommonComponents/AdBanner";
import { SkeletonList } from "../CommonComponents/SkeletonLoader";

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

        const mapped = results ? results.map(mapCaseDbToScreen) : [];

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
      if (dbCacheManager.shouldRefreshCases(!isLoading)) {
        fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilter);
      }
    }, [
      debouncedSearchText,
      filterParam,
      activeFilter,
      fetchCasesList,
      isLoading,
    ])
  );

  useEffect(() => {
    let isMounted = true;
    const sub = DeviceEventEmitter.addListener(CASE_UPDATED_EVENT, () => {
      if (isMounted) {
        fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilter);
      }
    });
    return () => {
      isMounted = false;
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, [debouncedSearchText, filterParam, activeFilter, fetchCasesList]);

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
    async (
      notes: string,
      nextHearingDate: Date,
      userId: number,
      dateFeeCollectedToday?: number,
      totalFeeCollectedToday?: number,
      paymentMode?: string,
      paymentNotes?: string
    ) => {
      if (!selectedCase || !selectedCase.id) return;
      const caseId = parseInt(selectedCase.id.toString(), 10);
      if (isNaN(caseId)) return;

      try {
        const caseExists = await getCaseById(caseId);
        if (!caseExists) {
          console.error("Case not found");
          return;
        }

        const nowIso = new Date().toISOString();
        const modeTag = paymentMode ? paymentMode : "Cash";
        const noteTag =
          paymentNotes && paymentNotes.trim()
            ? ` - ${paymentNotes.trim()}`
            : "";

        if (notes && notes.trim()) {
          await addCaseTimelineEvent({
            case_id: caseId,
            hearing_date: nowIso,
            notes: notes.trim(),
            event_type: "hearing_proceeding",
          });
        }

        if (dateFeeCollectedToday && dateFeeCollectedToday > 0) {
          await addCaseTimelineEvent({
            case_id: caseId,
            hearing_date: nowIso,
            notes: `Fee Payment Received (Date Fee): ₹${dateFeeCollectedToday.toLocaleString("en-IN")} [Mode: ${modeTag}]${noteTag}`,
            event_type: "date_fee_payment",
            amount: dateFeeCollectedToday,
            payment_mode: modeTag,
          });
        }

        if (totalFeeCollectedToday && totalFeeCollectedToday > 0) {
          await addCaseTimelineEvent({
            case_id: caseId,
            hearing_date: nowIso,
            notes: `Fee Payment Received (Total Retainer): ₹${totalFeeCollectedToday.toLocaleString("en-IN")} [Mode: ${modeTag}]${noteTag}`,
            event_type: "total_fee_payment",
            amount: totalFeeCollectedToday,
            payment_mode: modeTag,
          });
        }

        const updatedDateFeeCollected =
          (caseExists.date_fee_collected || 0) + (dateFeeCollectedToday || 0);
        const updatedTotalFeePaid =
          (caseExists.fee_paid || 0) + (totalFeeCollectedToday || 0);
        const targetDateFee = caseExists.date_fee || 0;
        const isDateFeePaidNow =
          targetDateFee > 0 && updatedDateFeeCollected >= targetDateFee
            ? 1
            : caseExists.date_fee_paid || 0;

        await updateCase(
          caseId,
          {
            NextDate: getLocalDateString(nextHearingDate),
            ...(dateFeeCollectedToday && dateFeeCollectedToday > 0
              ? {
                  date_fee_collected: updatedDateFeeCollected,
                  date_fee_paid: isDateFeePaidNow,
                }
              : {}),
            ...(totalFeeCollectedToday && totalFeeCollectedToday > 0
              ? { fee_paid: updatedTotalFeePaid }
              : {}),
          },
          userId
        );

        fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilter);

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
    (item: CaseDataScreen) =>
      `${item.id}-${(item as any).updated_at || ""}-${(item as any).fee_paid || 0}-${(item as any).date_fee_collected || 0}-${(item as any).date_fee_paid || 0}-${(item as any).date_fee || 0}-${item.nextHearing || ""}`,
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

      {isLoading && cases.length === 0 ? (
        <SkeletonList count={5} />
      ) : (
        <FlatList
          data={cases}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={(data, index) => ({
            length: 160,
            offset: 160 * index,
            index,
          })}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            !isLoading ? (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 50,
                  paddingHorizontal: 24,
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                    alignItems: "center",
                    justify: "center",
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
                  }}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={36}
                    color={theme.colors.primary}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: theme.colors.text,
                    marginBottom: 6,
                    textAlign: "center",
                  }}
                >
                  No Cases Found
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.textSecondary,
                    textAlign: "center",
                    marginBottom: 20,
                    lineHeight: 18,
                  }}
                >
                  No matching case records found. Tap below to register a new
                  case.
                </Text>
                <TouchableOpacity
                  onPress={navigateToAddCase}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: theme.colors.primary,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="add-circle"
                    size={18}
                    color="#FFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{ fontSize: 13, fontWeight: "700", color: "#FFF" }}
                  >
                    Add New Case
                  </Text>
                </TouchableOpacity>
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
      )}
      {selectedCase && (
        <UpdateHearingPopup
          visible={isPopupVisible}
          onClose={() => setPopupVisible(false)}
          onSave={async (notes, nextHearingDate, feeReceivedToday) =>
            handleSaveHearing(
              notes,
              nextHearingDate,
              await getCurrentUserId(),
              feeReceivedToday
            )
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
    paddingBottom: 24,
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
