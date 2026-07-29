import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { formatDate, getLocalDateString } from '../../utils/commonFunctions';
import * as db from '../../DataBase';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CaseData, CaseDataScreen } from '../../Types/appTypes';
import NewCaseCard from '../CasesList/components/NewCaseCard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import UpdateHearingPopup from '../CaseDetailsScreen/components/UpdateHearingPopup';
import { getCurrentUserId } from '../../utils/commonFunctions';
import { ThemeContext } from '../../Providers/ThemeProvider';
import { promptClientNotification } from '../../utils/whatsappNotifier';

import { DeviceEventEmitter } from 'react-native';
import { CASE_UPDATED_EVENT } from '../../utils/caseEvents';
import { mapCaseDbToScreen } from '../../utils/caseMapper';

const AnimatedNewCaseCard = ({ caseDetails, onUpdateHearingPress, index }: any) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 30).springify().damping(20).stiffness(300)}>
      <NewCaseCard
        caseDetails={caseDetails}
        onUpdateHearingPress={onUpdateHearingPress}
      />
    </Animated.View>
  );
};

const YesterdaysCasesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [yesterdaysCases, setYesterdaysCases] = useState<CaseDataScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  const fetchYesterdaysCases = async () => {
    try {
      const rawCases = await db.getYesterdaysCases();
      const mappedCases: CaseDataScreen[] = rawCases.map(mapCaseDbToScreen);
      setYesterdaysCases(mappedCases);
    } catch (error) {
      console.error("Error fetching yesterday's cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchYesterdaysCases();
    }, [])
  );

  useEffect(() => {
    let isMounted = true;
    const sub = DeviceEventEmitter.addListener(CASE_UPDATED_EVENT, () => {
      if (isMounted) fetchYesterdaysCases();
    });
    return () => {
      isMounted = false;
      if (sub && typeof sub.remove === 'function') sub.remove();
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
      const noteTag = paymentNotes && paymentNotes.trim() ? ` - ${paymentNotes.trim()}` : "";

      if (notes && notes.trim()) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: notes.trim(),
          event_type: 'hearing_proceeding',
        });
      }

      if (dateFeeCollectedToday && dateFeeCollectedToday > 0) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: `Fee Payment Received (Date Fee): ₹${dateFeeCollectedToday.toLocaleString('en-IN')} [Mode: ${modeTag}]${noteTag}`,
          event_type: 'date_fee_payment',
          amount: dateFeeCollectedToday,
          payment_mode: modeTag,
        });
      }

      if (totalFeeCollectedToday && totalFeeCollectedToday > 0) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: `Fee Payment Received (Total Retainer): ₹${totalFeeCollectedToday.toLocaleString('en-IN')} [Mode: ${modeTag}]${noteTag}`,
          event_type: 'total_fee_payment',
          amount: totalFeeCollectedToday,
          payment_mode: modeTag,
        });
      }

      const updatedDateFeeCollected = ((caseExists as any).date_fee_collected || 0) + (dateFeeCollectedToday || 0);
      const updatedTotalFeePaid = (caseExists.fee_paid || 0) + (totalFeeCollectedToday || 0);
      const targetDateFee = (caseExists as any).date_fee || 0;
      const isDateFeePaidNow = targetDateFee > 0 && updatedDateFeeCollected >= targetDateFee ? 1 : ((caseExists as any).date_fee_paid || 0);

      await db.updateCase(caseId, {
        NextDate: getLocalDateString(nextHearingDate),
        ...(dateFeeCollectedToday && dateFeeCollectedToday > 0 ? { date_fee_collected: updatedDateFeeCollected, date_fee_paid: isDateFeePaidNow } : {}),
        ...(totalFeeCollectedToday && totalFeeCollectedToday > 0 ? { fee_paid: updatedTotalFeePaid } : {}),
      }, userId);

      fetchYesterdaysCases();

      setTimeout(() => {
        promptClientNotification(caseId, getLocalDateString(nextHearingDate), notes);
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
    (item: CaseDataScreen) => `${item.id}-${(item as any).updated_at || ''}-${(item as any).fee_paid || 0}-${(item as any).date_fee_collected || 0}-${(item as any).date_fee_paid || 0}-${(item as any).date_fee || 0}-${item.nextHearing || ''}`,
    []
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={yesterdaysCases}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={(data, index) => ({ length: 160, offset: 160 * index, index })}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={3}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No cases found for yesterday.
          </Text>
        }
        contentContainerStyle={styles.container}
      />
      {selectedCase && (
        <UpdateHearingPopup
          visible={isPopupVisible}
          onClose={() => setPopupVisible(false)}
          onSave={async (notes, nextHearingDate, dateFeeCollectedToday, totalFeeCollectedToday, paymentMode, paymentNotes) =>
            handleSaveHearing(notes, nextHearingDate, await getCurrentUserId(), dateFeeCollectedToday, totalFeeCollectedToday, paymentMode, paymentNotes)
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

export default YesterdaysCasesScreen;
