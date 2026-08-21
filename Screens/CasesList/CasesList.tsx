import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import React, { useCallback, useContext, useState, useEffect, useLayoutEffect } from "react";
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
  ScrollView,
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
import { VoiceCaseNoteModal } from "../CommonComponents/VoiceCaseNoteModal";
import AdBanner from "../CommonComponents/AdBanner";
import { SkeletonList } from "../CommonComponents/SkeletonLoader";

export type SmartFilterKey =
  | "All"
  | "Active"
  | "overdue"
  | "feePending"
  | "highPriority"
  | "In Progress"
  | "On Hold"
  | "Appealed"
  | "Closed"
  | "dormant"
  | "thisWeek";

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
  const [activeFilterKey, setActiveFilterKey] = useState<SmartFilterKey>("All");
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  const [isImportModalVisible, setImportModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);
  const [noteCase, setNoteCase] = useState<CaseDataScreen | null>(null);

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

  // Sync incoming route filter param (e.g. from deep link)
  useEffect(() => {
    if (
      filterParam === "overdue" ||
      filterParam === "feePending" ||
      filterParam === "highPriority" ||
      filterParam === "dormant" ||
      filterParam === "thisWeek"
    ) {
      setActiveFilterKey(filterParam as SmartFilterKey);
    }
  }, [filterParam]);

  // Fetch paginated cases from the database
  const fetchCasesList = useCallback(
    async (
      offset: number,
      queryText: string,
      currentParamFilter: string,
      currentSmartFilter: SmartFilterKey
    ) => {
      setIsLoading(true);
      try {
        let dateFilter:
          | "today"
          | "tomorrow"
          | "yesterday"
          | "undated"
          | "thisWeek"
          | null = null;
        let status: string = "All";
        let smartFilter:
          | "overdue"
          | "feePending"
          | "highPriority"
          | "dormant"
          | "thisWeek"
          | null = null;

        if (currentParamFilter === "todaysCases") {
          dateFilter = "today";
        } else if (currentParamFilter === "tomorrowCases") {
          dateFilter = "tomorrow";
        } else if (currentParamFilter === "yesterdayCases") {
          dateFilter = "yesterday";
        } else if (currentParamFilter === "undatedCases") {
          dateFilter = "undated";
        } else {
          // Smart status and workflow filters
          if (currentSmartFilter === "All") {
            status = "All";
          } else if (currentSmartFilter === "Active") {
            status = "Active";
          } else if (currentSmartFilter === "Closed") {
            status = "Closed";
          } else if (
            currentSmartFilter === "In Progress" ||
            currentSmartFilter === "On Hold" ||
            currentSmartFilter === "Appealed"
          ) {
            status = currentSmartFilter;
          } else if (
            currentSmartFilter === "overdue" ||
            currentSmartFilter === "feePending" ||
            currentSmartFilter === "highPriority" ||
            currentSmartFilter === "dormant" ||
            currentSmartFilter === "thisWeek"
          ) {
            smartFilter = currentSmartFilter;
          }
        }

        const results = await getCases(
          null,
          LIMIT,
          offset,
          {
            status,
            smartFilter,
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

  // Instant reactive fetch when search text, route filter, or filter chip changes
  useEffect(() => {
    fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilterKey);
  }, [debouncedSearchText, filterParam, activeFilterKey, fetchCasesList]);

  // Re-fetch when screen gains focus if cache is stale
  useFocusEffect(
    useCallback(() => {
      if (dbCacheManager.shouldRefreshCases(!isLoading)) {
        fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilterKey);
      }
    }, [
      debouncedSearchText,
      filterParam,
      activeFilterKey,
      fetchCasesList,
      isLoading,
    ])
  );

  useEffect(() => {
    let isMounted = true;
    const sub = DeviceEventEmitter.addListener(CASE_UPDATED_EVENT, () => {
      if (isMounted) {
        fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilterKey);
      }
    });
    return () => {
      isMounted = false;
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, [debouncedSearchText, filterParam, activeFilterKey, fetchCasesList]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilterKey);
  }, [debouncedSearchText, filterParam, activeFilterKey, fetchCasesList]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchCasesList(
        cases.length,
        debouncedSearchText,
        filterParam || "",
        activeFilterKey
      );
    }
  }, [
    isLoading,
    hasMore,
    cases.length,
    debouncedSearchText,
    filterParam,
    activeFilterKey,
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

        fetchCasesList(0, debouncedSearchText, filterParam || "", activeFilterKey);

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
      activeFilterKey,
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
        onLongPress={() => {
          setNoteCase(item);
          setNoteModalVisible(true);
        }}
      />
    ),
    [handleUpdateHearing]
  );

  const keyExtractor = useCallback(
    (item: CaseDataScreen) =>
      `${item.id}-${(item as any).updated_at || ""}-${(item as any).fee_paid || 0}-${(item as any).date_fee_collected || 0}-${(item as any).date_fee_paid || 0}-${(item as any).date_fee || 0}-${item.nextHearing || ""}`,
    []
  );

  useLayoutEffect(() => {
    if (typeof navigation?.setOptions === "function") {
      try {
        navigation.setOptions({
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setImportModalVisible(true)}
                style={{ padding: 6, marginRight: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Ionicons
                  name="cloud-download-outline"
                  size={24}
                  color={theme.colors.primary || "#007AFF"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={navigateToAddCase}
                style={{ padding: 6 }}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={26}
                  color={theme.colors.primary || "#007AFF"}
                />
              </TouchableOpacity>
            </View>
          ),
        });
      } catch {
        // Ignored if rendered outside a React Navigation stack (e.g. isolated unit test)
      }
    }
  }, [navigation, theme, navigateToAddCase]);

  const FILTER_CHIPS: {
    key: SmartFilterKey;
    label: string;
    icon?: any;
    color?: string;
  }[] = [
    { key: "All", label: "All Cases" },
    { key: "Active", label: "Active" },
    { key: "overdue", label: "Overdue", icon: "alert-circle", color: "#EF4444" },
    { key: "feePending", label: "Fee Pending", icon: "cash-outline", color: "#10B981" },
    { key: "highPriority", label: "High Priority", icon: "flag", color: "#EF4444" },
    { key: "In Progress", label: "In Progress" },
    { key: "On Hold", label: "On Hold" },
    { key: "Appealed", label: "Appealed" },
    { key: "Closed", label: "Closed" },
    { key: "dormant", label: "Dormant (60d)", icon: "time-outline", color: "#F59E0B" },
    { key: "thisWeek", label: "This Week", icon: "calendar-outline", color: "#6366F1" },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
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
        <View style={{ marginBottom: 8 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollView}
          >
            {FILTER_CHIPS.map((chip) => {
              const isSelected = activeFilterKey === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  style={[
                    styles.filterChip,
                    isSelected
                      ? {
                          backgroundColor: theme.colors.primary || "#6366F1",
                          borderColor: theme.colors.primary || "#6366F1",
                        }
                      : {
                          backgroundColor: theme.colors.cardBackground,
                          borderColor: theme.colors.border,
                        },
                  ]}
                  onPress={() => setActiveFilterKey(chip.key)}
                  activeOpacity={0.8}
                >
                  {chip.icon && (
                    <Ionicons
                      name={chip.icon}
                      size={14}
                      color={isSelected ? "#FFFFFF" : chip.color || theme.colors.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected ? "#FFFFFF" : theme.colors.text,
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
            activeFilterKey
          );
        }}
      />
      {noteCase && (
        <VoiceCaseNoteModal
          visible={isNoteModalVisible}
          caseId={parseInt(noteCase.id.toString(), 10)}
          caseTitle={noteCase.title || "Legal Matter"}
          existingNextHearingDate={noteCase.nextHearing}
          onClose={() => {
            setNoteModalVisible(false);
            setNoteCase(null);
          }}
          onSave={async (data) => {
            const caseId = parseInt(noteCase.id.toString(), 10);
            if (isNaN(caseId)) return;
            const nowIso = new Date().toISOString();
            if (data.notes && data.notes.trim()) {
              await addCaseTimelineEvent({
                case_id: caseId,
                hearing_date: nowIso,
                notes: data.notes.trim(),
                event_type: "hearing_note",
              });
            }
            if (data.updateNextDate && data.nextHearingDate) {
              await updateCase(
                caseId,
                { NextDate: data.nextHearingDate },
                await getCurrentUserId()
              );
            }
            setNoteModalVisible(false);
            setNoteCase(null);
            fetchCasesList(
              0,
              debouncedSearchText,
              filterParam || "",
              activeFilterKey
            );
          }}
        />
      )}
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
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
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D1D1D6",
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },
  filterScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  listContentContainer: {
    paddingBottom: 24,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
  },
});
