import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import * as db from '../../DataBase';
import { CaseData } from '../../Types/appTypes';
import CaseCard from '../CommonComponents/CaseCard';
import { useNavigation } from '@react-navigation/native';

const YesterdaysCasesScreen = () => {
  const [yesterdaysCases, setYesterdaysCases] = useState<CaseData[]>([]);
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

        setYesterdaysCases(filteredCases);
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
        <CaseCard
          caseData={item}
          onPress={() => navigation.navigate('CaseDetails', { caseId: item.id })}
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
