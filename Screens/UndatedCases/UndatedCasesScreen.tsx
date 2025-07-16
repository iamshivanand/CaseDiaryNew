import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import * as db from '../../DataBase';
import { CaseData } from '../../Types/appTypes';
import CaseCard from '../CommonComponents/CaseCard';
import { useNavigation } from '@react-navigation/native';

const UndatedCasesScreen = () => {
  const [undatedCases, setUndatedCases] = useState<CaseData[]>([]);
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

        setUndatedCases(filteredCases);
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
        <CaseCard
          caseDetails={item}
          onPress={() => navigation.navigate('CaseDetails', { caseId: item.id })}
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
