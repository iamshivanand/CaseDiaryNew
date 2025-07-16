import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import * as db from '../../DataBase';
import { CaseData, CaseDataScreen } from '../../Types/appTypes';
import NewCaseCard from '../CasesList/components/NewCaseCard';
import { useNavigation } from '@react-navigation/native';

const YesterdaysCasesScreen = () => {
  const [yesterdaysCases, setYesterdaysCases] = useState<CaseDataScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
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
            nextHearing: c.NextDate ? new Date(c.NextDate).toLocaleDateString() : 'N/A',
            lastUpdate: c.updated_at ? new Date(c.updated_at).toLocaleDateString() : 'N/A',
            previousHearing: c.PreviousDate ? new Date(c.PreviousDate).toLocaleDateString() : 'N/A',
            }));

        setYesterdaysCases(mappedCases);
      } catch (error) {
        console.error("Error fetching yesterday's cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchYesterdaysCases();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={yesterdaysCases}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <NewCaseCard
          caseDetails={item}
        />
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No cases found for yesterday.</Text>}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
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
