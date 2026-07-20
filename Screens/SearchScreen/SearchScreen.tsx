import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useState, useCallback } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator, SafeAreaView, StyleSheet, Platform } from "react-native";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import { CaseDataScreen } from "../../Types/appTypes";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import { getCurrentUserId, getLocalDateString } from "../../utils/commonFunctions";
import { useSearchCases } from "../../Hooks/useCases";
import * as db from "../../DataBase";
import { promptClientNotification } from "../../utils/whatsappNotifier";

const SearchScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = getSearchScreenStyles(theme);

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

  const handleUpdateHearing = useCallback((caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  }, []);

  const handleSaveHearing = useCallback(async (notes: string, nextHearingDate: Date, userId: number, feeReceivedToday?: number) => {
    if (!selectedCase || !selectedCase.id) return;
    const caseId = parseInt(selectedCase.id.toString(), 10);
    if (isNaN(caseId)) return;

    try {
      const caseExists = await db.getCaseById(caseId);
      if (!caseExists) {
        console.error("Case not found");
        return;
      }
      const feeNote = feeReceivedToday && feeReceivedToday > 0 
        ? ` [Fee Received: ₹${feeReceivedToday.toLocaleString('en-IN')}]` 
        : "";
      const finalNotes = (notes || "") + feeNote;

      // 1. Add timeline event
      await db.addCaseTimelineEvent({
        case_id: caseId,
        hearing_date: new Date().toISOString(),
        notes: finalNotes.trim(),
      });

      // 2. Update case's next hearing date and fee_paid
      const updatedFeePaid = (caseExists.fee_paid || 0) + (feeReceivedToday || 0);
      await db.updateCase(caseId, {
        NextDate: getLocalDateString(nextHearingDate),
        ...(feeReceivedToday && feeReceivedToday > 0 ? { fee_paid: updatedFeePaid } : {}),
      }, userId);

      // 3. Refresh list from page 0
      refreshSearch();

      // 4. Prompt WhatsApp notification to client
      setTimeout(() => {
        promptClientNotification(caseId, getLocalDateString(nextHearingDate), notes);
      }, 500);
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  }, [selectedCase, refreshSearch]);

  const renderItem = useCallback(({ item }: { item: CaseDataScreen }) => (
    <NewCaseCard caseDetails={item} onUpdateHearingPress={() => handleUpdateHearing(item)} />
  ), [handleUpdateHearing]);

  const keyExtractor = useCallback((item: CaseDataScreen) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.searchSection}>
          <View style={styles.inputContainer}>
            <AntDesign
              name="search1"
              size={22}
              color={theme.colors.textSecondary}
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Search cases..."
              placeholderTextColor={theme.colors.textSecondary}
              onChangeText={setSearchQuery}
              value={searchQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        {isLoading && results.length === 0 ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loader}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, marginTop: 8 }}>Searching...</Text>
          </Animated.View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContentContainer}
            ListEmptyComponent={() => {
              if (!hasSearched) {
                return <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Enter a query to start searching.</Text>;
              }
              if (results.length === 0 && !isLoading) {
                return <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No cases found matching your query.</Text>;
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
            handleSaveHearing(notes, nextHearingDate, await getCurrentUserId(), feeReceivedToday)
          }
        />
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;

const getSearchScreenStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
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
    height: '100%',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyText: {
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
