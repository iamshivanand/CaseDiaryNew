import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import * as db from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { CaseDataScreen } from "../../Types/appTypes";
import { CASE_UPDATED_EVENT } from "../../utils/caseEvents";
import { mapCaseDbToScreen } from "../../utils/caseMapper";
import {
  getCurrentUserId,
  getLocalDateString,
} from "../../utils/commonFunctions";
import dbCacheManager from "../../utils/dbCacheManager";
import { exportUndatedCasesToPdf } from "../../utils/pdfExporter";
import { promptClientNotification } from "../../utils/whatsappNotifier";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import { useAdTrigger } from "../CommonComponents/AdManager";
import { CauseListCustomizerModal } from "../CommonComponents/CauseListCustomizerModal";
import { SkeletonList } from "../CommonComponents/SkeletonLoader";

const AnimatedNewCaseCard = ({
  caseDetails,
  onUpdateHearingPress,
  index,
}: any) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30)
        .springify()
        .damping(20)
        .stiffness(300)}
    >
      <NewCaseCard
        caseDetails={caseDetails}
        onUpdateHearingPress={onUpdateHearingPress}
      />
    </Animated.View>
  );
};

const UndatedCasesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [undatedCases, setUndatedCases] = useState<CaseDataScreen[]>([]);
  const [rawCases, setRawCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { showAdWithPreload } = useAdTrigger();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);
  const [isCauseListModalVisible, setIsCauseListModalVisible] = useState(false);

  const fetchUndatedCases = async () => {
    try {
      const filteredCases = await db.getUndatedCases();
      const mappedCases: CaseDataScreen[] =
        filteredCases.map(mapCaseDbToScreen);
      setRawCases(filteredCases);
      setUndatedCases(mappedCases);
    } catch (error) {
      console.error("Error fetching undated cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (dbCacheManager.shouldRefreshCases(!loading)) {
        fetchUndatedCases();
      }
    }, [loading])
  );

  useEffect(() => {
    let isMounted = true;
    const sub = DeviceEventEmitter.addListener(CASE_UPDATED_EVENT, () => {
      if (isMounted) fetchUndatedCases();
    });
    return () => {
      isMounted = false;
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, []);

  const handleUpdateHearing = useCallback((caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  }, []);

  const handleSaveHearing = async (
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
      const caseExists = await db.getCaseById(caseId);
      if (!caseExists) {
        console.error("Case not found");
        return;
      }

      const nowIso = new Date().toISOString();
      const modeTag = paymentMode ? paymentMode : "Cash";
      const noteTag =
        paymentNotes && paymentNotes.trim() ? ` - ${paymentNotes.trim()}` : "";

      if (notes && notes.trim()) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: notes.trim(),
          event_type: "hearing_proceeding",
        });
      }

      if (dateFeeCollectedToday && dateFeeCollectedToday > 0) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: `Fee Payment Received (Date Fee): ₹${dateFeeCollectedToday.toLocaleString("en-IN")} [Mode: ${modeTag}]${noteTag}`,
          event_type: "date_fee_payment",
          amount: dateFeeCollectedToday,
          payment_mode: modeTag,
        });
      }

      if (totalFeeCollectedToday && totalFeeCollectedToday > 0) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: `Fee Payment Received (Total Retainer): ₹${totalFeeCollectedToday.toLocaleString("en-IN")} [Mode: ${modeTag}]${noteTag}`,
          event_type: "total_fee_payment",
          amount: totalFeeCollectedToday,
          payment_mode: modeTag,
        });
      }

      const updatedDateFeeCollected =
        ((caseExists as any).date_fee_collected || 0) +
        (dateFeeCollectedToday || 0);
      const updatedTotalFeePaid =
        (caseExists.fee_paid || 0) + (totalFeeCollectedToday || 0);
      const targetDateFee = (caseExists as any).date_fee || 0;
      const isDateFeePaidNow =
        targetDateFee > 0 && updatedDateFeeCollected >= targetDateFee
          ? 1
          : (caseExists as any).date_fee_paid || 0;

      await db.updateCase(
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

      fetchUndatedCases();

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
  };

  const renderItem = useCallback(
    ({ item, index }: { item: CaseDataScreen; index: number }) => (
      <AnimatedNewCaseCard
        caseDetails={item}
        onUpdateHearingPress={() => handleUpdateHearing(item)}
        index={index}
      />
    ),
    [handleUpdateHearing]
  );

  const keyExtractor = useCallback(
    (item: CaseDataScreen) =>
      `${item.id}-${(item as any).updated_at || ""}-${(item as any).fee_paid || 0}-${(item as any).date_fee_collected || 0}-${(item as any).date_fee_paid || 0}-${(item as any).date_fee || 0}-${item.nextHearing || ""}`,
    []
  );

  const handleShareUndatedCases = () => {
    if (rawCases.length === 0) {
      Alert.alert("Empty List", "There are no undated cases to export.");
      return;
    }
    setIsCauseListModalVisible(true);
  };

  const handleGenerateUndatedPdf = async (
    selectedFields: string[],
    sortField?: string,
    sortDirection?: "asc" | "desc"
  ) => {
    try {
      await showAdWithPreload("rewarded", async (success) => {
        if (success) {
          try {
            await exportUndatedCasesToPdf(
              rawCases,
              navigation,
              selectedFields,
              sortField,
              sortDirection
            );
          } catch (error) {
            Alert.alert(
              "Export Failed",
              "Could not compile the undated cases PDF."
            );
          }
        }
      });
    } catch (adError) {
      console.warn("Ad preloading or display encountered an error:", adError);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShareUndatedCases}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.primary,
            paddingVertical: 5,
            paddingHorizontal: 12,
            borderRadius: 16,
            marginRight: 8,
          }}
        >
          <Ionicons
            name="share-social"
            size={14}
            color="#FFF"
            style={{ marginRight: 4 }}
          />
          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>
            Share PDF
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, rawCases]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <SkeletonList count={3} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={undatedCases}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={(data, index) => ({
          length: 160,
          offset: 160 * index,
          index,
        })}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={3}
        removeClippedSubviews
        ListEmptyComponent={
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No undated cases found.
          </Text>
        }
        contentContainerStyle={styles.container}
      />
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
      <CauseListCustomizerModal
        visible={isCauseListModalVisible}
        onClose={() => setIsCauseListModalVisible(false)}
        onGenerate={handleGenerateUndatedPdf}
        title="Customize Undated Cases List"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
});

export default UndatedCasesScreen;
