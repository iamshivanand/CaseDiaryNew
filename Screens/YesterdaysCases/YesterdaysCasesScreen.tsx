import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { formatDate } from '../../utils/commonFunctions';
import * as db from '../../DataBase';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CaseData, CaseDataScreen } from '../../Types/appTypes';
import NewCaseCard from '../CasesList/components/NewCaseCard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import UpdateHearingPopup from '../CaseDetailsScreen/components/UpdateHearingPopup';
import { getCurrentUserId } from '../../utils/commonFunctions';

import { SafeAreaView, Platform } from "react-native";

const AnimatedNewCaseCard = ({ caseDetails, onUpdateHearingPress, index }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <NewCaseCard
        caseDetails={caseDetails}
        onUpdateHearingPress={onUpdateHearingPress}
      />
    </Animated.View>
  );
};

const YesterdaysCasesScreen = () => {
  const [yesterdaysCases, setYesterdaysCases] = useState<CaseDataScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  const fetchYesterdaysCases = async () => {
    try {
      const allCases = await db.getCases();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      const filteredCases = allCases.filter(c => {
        if (!c.NextDate) return false;
        const nextHearingDate = new Date(c.NextDate);
        const nextHearingDateString = nextHearingDate.toISOString().split('T')[0];
        return nextHearingDateString === yesterdayString;
      });

      const mappedCases: CaseDataScreen[] = filteredCases.map(c => ({
          id: c.id,
          title: c.CaseTitle || 'No Title',
          client: c.ClientName || 'Unknown Client',
          status: c.CaseStatus || 'Pending',
          nextHearing: c.NextDate ? formatDate(c.NextDate) : 'N/A',
          lastUpdate: c.updated_at ? formatDate(c.updated_at) : 'N/A',
          previousHearing: c.PreviousDate ? formatDate(c.PreviousDate) : 'N/A',
          }));

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
      // 1. Add timeline event
      if (notes) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: new Date().toISOString(),
          notes: notes,
        });
      }

      // 2. Update case's next hearing date
      await db.updateCase(caseId, {
        NextDate: nextHearingDate.toISOString(),
      }, userId);

      // 3. Refresh the list
      fetchYesterdaysCases();
    } catch (error)      {console.error("Error updating hearing:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={yesterdaysCases}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <AnimatedNewCaseCard
            caseDetails={item}
            onUpdateHearingPress={() => handleUpdateHearing(item)}
            index={index}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No cases found for yesterday.</Text>}
        contentContainerStyle={styles.container}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
