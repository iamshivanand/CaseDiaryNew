import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { formatDate, getLocalDateString, normalizeDateToYYYYMMDD } from '../../utils/commonFunctions';
import * as db from '../../DataBase';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CaseData, CaseDataScreen } from '../../Types/appTypes';
import NewCaseCard from '../CasesList/components/NewCaseCard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import UpdateHearingPopup from '../CaseDetailsScreen/components/UpdateHearingPopup';
import { getCurrentUserId } from '../../utils/commonFunctions';
import { ThemeContext } from '../../Providers/ThemeProvider';
import { promptClientNotification } from '../../utils/whatsappNotifier';
import { Ionicons } from '@expo/vector-icons';
import { exportUndatedCasesToPdf } from '../../utils/pdfExporter';
import { useAdTrigger } from '../CommonComponents/AdManager';

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

const UndatedCasesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [undatedCases, setUndatedCases] = useState<CaseDataScreen[]>([]);
  const [rawCases, setRawCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { showAdWithPreload } = useAdTrigger();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  const fetchUndatedCases = async () => {
    try {
      const allCases = await db.getCases();
      const todayStr = getLocalDateString(new Date());

      const filteredCases = allCases.filter(c => {
        const normalized = normalizeDateToYYYYMMDD(c.NextDate);
        if (!normalized) return true;
        return normalized < todayStr;
      });

      const mappedCases: CaseDataScreen[] = filteredCases.map(c => ({
        id: c.id,
        title: c.CaseTitle || 'No Title',
        client: c.ClientName || 'Unknown Client',
        status: (c.CaseStatus === 'Active' || c.CaseStatus === 'Closed' || c.CaseStatus === 'Pending' ? c.CaseStatus : 'Pending') as 'Active' | 'Closed' | 'Pending',
        nextHearing: c.NextDate ? formatDate(c.NextDate) : 'N/A',
        lastUpdate: c.updated_at ? formatDate(c.updated_at) : 'N/A',
        previousHearing: c.PreviousDate ? formatDate(c.PreviousDate) : 'N/A',
        priority: c.Priority || 'Low',
      }));

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
      fetchUndatedCases();
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
      await db.addCaseTimelineEvent({
        case_id: caseId,
        hearing_date: new Date().toISOString(),
        notes: notes || "",
      });

      // 2. Update case's next hearing date
      await db.updateCase(caseId, {
        NextDate: getLocalDateString(nextHearingDate),
      }, userId);

      // 3. Refresh the list
      fetchUndatedCases();

      // 4. Prompt WhatsApp notification to client
      setTimeout(() => {
        promptClientNotification(caseId, getLocalDateString(nextHearingDate), notes);
      }, 500);
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  };

  const handleShareUndatedCases = async () => {
    if (rawCases.length === 0) {
      Alert.alert("Empty List", "There are no undated cases to export.");
      return;
    }
    try {
      await showAdWithPreload("rewarded", async (success) => {
        if (success) {
          try {
            await exportUndatedCasesToPdf(rawCases, navigation);
          } catch (error) {
            Alert.alert("Export Failed", "Could not compile the undated cases PDF.");
          }
        }
      });
    } catch (adError) {
      console.warn("Ad preloading or display encountered an error:", adError);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.cardBackground
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text }}>Undated Cases</Text>
        {undatedCases.length > 0 && (
          <TouchableOpacity 
            onPress={handleShareUndatedCases}
            activeOpacity={0.9}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: theme.colors.primary, 
              paddingVertical: 6, 
              paddingHorizontal: 12, 
              borderRadius: 20,
            }}
          >
            <Ionicons name="share-social" size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Share List</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={undatedCases}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <AnimatedNewCaseCard
            caseDetails={item}
            onUpdateHearingPress={() => handleUpdateHearing(item)}
            index={index}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No undated cases found.
          </Text>
        }
        contentContainerStyle={styles.container}
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

export default UndatedCasesScreen;
