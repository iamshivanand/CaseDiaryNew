import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import * as db from '../../DataBase';
import { CaseData, CaseDataScreen } from '../../Types/appTypes';
import NewCaseCard from '../CasesList/components/NewCaseCard';
import { useNavigation } from '@react-navigation/native';

const UndatedCasesScreen = () => {
  const [undatedCases, setUndatedCases] = useState<CaseDataScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUndatedCases = async () => {
      try {
        const allCases = await db.getCases();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredCases = allCases.filter(c => {
          if (!c.NextDate) return true;
          const nextHearingDate = new Date(c.NextDate);
          return nextHearingDate < today;
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

        setUndatedCases(mappedCases);
      } catch (error) {
        console.error("Error fetching undated cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUndatedCases();
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
      data={undatedCases}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <NewCaseCard
          caseDetails={item}
        />
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No undated cases found.</Text>}
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

export default UndatedCasesScreen;
