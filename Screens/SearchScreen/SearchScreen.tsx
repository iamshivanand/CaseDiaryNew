import {
  useRoute,
  useNavigation,
  useIsFocused,
} from "@react-navigation/native";
import React, {
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import * as db from "../../DataBase";
import { useSearchCases } from "../../Hooks/useCases";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import { CaseDataScreen } from "../../Types/appTypes";
import { CASE_UPDATED_EVENT } from "../../utils/caseEvents";
import {
  getCurrentUserId,
  getLocalDateString,
} from "../../utils/commonFunctions";
import { promptClientNotification } from "../../utils/whatsappNotifier";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import { SkeletonList } from "../CommonComponents/SkeletonLoader";
import VoiceSearchBar from "../CommonComponents/VoiceSearchBar";

const SearchScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = getSearchScreenStyles(theme);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const isFromDashboardRef = useRef(false);

  const {
    searchQuery,
    setSearchQuery,
    results,
    isLoading,
    hasSearched,
    hasMore,
    refreshSearch,
    loadMore,
  } = useSearchCases();

  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  // Sync route params from Dashboard when screen is focused
  useEffect(() => {
    if (isFocused && route.params?.initialQuery !== undefined) {
      setSearchQuery(route.params.initialQuery);
      if (route.params.fromDashboard) {
        isFromDashboardRef.current = true;
      }
    }
  }, [isFocused, route.params]);

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    if (!text && isFromDashboardRef.current) {
      isFromDashboardRef.current = false;
      navigation.goBack();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    if (isFromDashboardRef.current) {
      isFromDashboardRef.current = false;
      navigation.goBack();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const sub = DeviceEventEmitter.addListener(CASE_UPDATED_EVENT, () => {
      if (isMounted) refreshSearch();
    });
    return () => {
      isMounted = false;
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, [refreshSearch]);

  const handleUpdateHearing = useCallback((caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  }, []);

  const handleSaveHearing = useCallback(
    async (
      notes: string,
      nextHearingDate: Date,
      userId: number,
      feeReceivedToday?: number
    ) => {
      if (!selectedCase || !selectedCase.id) return;
      const caseId = parseInt(selectedCase.id.toString(), 10);
      if (isNaN(caseId)) return;

      try {
        const caseExists = await db.getCaseById(caseId);
        if (!caseExists) {
          console.error("Case not found");
          return;
        }
        const feeNote =
          feeReceivedToday && feeReceivedToday > 0
            ? ` [Fee Received: ₹${feeReceivedToday.toLocaleString("en-IN")}]`
            : "";
        const finalNotes = (notes || "") + feeNote;

        // 1. Add timeline event
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: new Date().toISOString(),
          notes: finalNotes.trim(),
        });

        // 2. Update case's next hearing date and fee_paid
        const updatedFeePaid =
          (caseExists.fee_paid || 0) + (feeReceivedToday || 0);
        await db.updateCase(
          caseId,
          {
            NextDate: getLocalDateString(nextHearingDate),
            ...(feeReceivedToday && feeReceivedToday > 0
              ? { fee_paid: updatedFeePaid }
              : {}),
          },
          userId
        );

        // 3. Emit global event & refresh search
        DeviceEventEmitter.emit(CASE_UPDATED_EVENT);
        refreshSearch();

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
    [selectedCase, refreshSearch]
  );

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
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.searchSection}>
          <VoiceSearchBar
            value={searchQuery}
            onChangeText={handleTextChange}
            placeholder="🎙️ Search cases, CNR, client, court..."
            onClear={handleClear}
            autoFocus={route.params?.autoFocus ?? false}
          />
        </View>

        {isLoading && results.length === 0 ? (
          <SkeletonList count={4} />
        ) : (
          <FlatList
            data={results}
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
            contentContainerStyle={styles.listContentContainer}
            ListEmptyComponent={() => {
              if (!hasSearched) {
                return (
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Enter a query to start searching.
                  </Text>
                );
              }
              if (results.length === 0 && !isLoading) {
                return (
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    No cases found matching your query.
                  </Text>
                );
              }
              return null;
            }}
            ListFooterComponent={
              isLoading && results.length > 0 ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>
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
    </SafeAreaView>
  );
};

export default SearchScreen;

const getSearchScreenStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: Platform.OS === "android" ? 25 : 0,
    },
    screenContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    searchSection: {
      paddingBottom: 10,
      backgroundColor: theme.colors.background,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 48,
      marginBottom: 10,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    input: {
      flex: 1,
      height: "100%",
      fontSize: 16,
    },
    icon: {
      marginRight: 10,
    },
    searchButton: {
      minHeight: 48,
      marginVertical: 0,
    },
    searchButtonText: {
      fontSize: 16,
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContentContainer: {
      paddingHorizontal: 15,
      paddingBottom: 100,
      flexGrow: 1,
    },
    emptyText: {
      textAlign: "center",
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
