import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { format } from 'date-fns';

const WelcomeCard = () => {
  const today = new Date();
  const formattedDate = format(today, "eeee, MMMM d, yyyy");

  return (
    <View style={styles.welcomeCard}>
      <Text style={styles.welcomeTitle}>Good morning, John!</Text>
      <Text style={styles.welcomeSubtitle}>{formattedDate}</Text>
    </View>
  );
};

const QuickActionButton = ({ icon, text, onPress, color }) => {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={[styles.quickActionIcon, { color }]}>{icon}</Text>
      <Text style={styles.quickActionText}>{text}</Text>
    </TouchableOpacity>
  );
};

import SectionHeader from '../CommonComponents/SectionHeader';

const QuickActionsGrid = () => {
  const navigation = useNavigation();

  return (
    <View>
      <SectionHeader title="Quick Actions" />
      <View style={styles.quickActionsContainer}>
        <QuickActionButton icon="➕" text="Add New Case" onPress={() => navigation.navigate('AddCase')} color="#00CC44" />
        <QuickActionButton icon="📂" text="View All Cases" onPress={() => navigation.navigate('AllCases')} color="#007BFF" />
        <QuickActionButton icon="📅" text="Yesterday's Cases" onPress={() => navigation.navigate('YesterdaysCases')} color="#007BFF" />
        <QuickActionButton icon="⚠️" text="Undated Cases" onPress={() => navigation.navigate('UndatedCases')} color="#FF6B00" />
      </View>
    </View>
  );
};

const AdvertisementBanner = () => {
  return (
    <View style={styles.adBanner}>
      <Text style={styles.adLabel}>ADVERTISEMENT</Text>
      <Text style={styles.adMessage}>Boost your practice with Premium features!</Text>
      <TouchableOpacity style={styles.adButton}>
        <Text style={styles.adButtonText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

import CaseCard from '../CommonComponents/CaseCard';
import * as db from '../../DataBase';
import { CaseData } from '../../Types/appTypes';
import { useNavigation } from '@react-navigation/native';

const TodaysCasesSection = () => {
  const [todaysCases, setTodaysCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTodaysCases = async () => {
      try {
        const allCases = await db.getCases();
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        const filteredCases = allCases.filter(c => {
          if (!c.NextDate) return false;
          const nextHearingDate = new Date(c.NextDate);
          const nextHearingDateString = nextHearingDate.toISOString().split('T')[0];
          return nextHearingDateString === todayString;
        });

        setTodaysCases(filteredCases);
      } catch (error) {
        console.error("Error fetching today's cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysCases();
  }, []);

  return (
    <View>
      <Text style={styles.sectionTitle}>Today's Cases</Text>
      {loading ? (
        <ActivityIndicator />
      ) : todaysCases.length > 0 ? (
        todaysCases.map(caseData => (
          <CaseCard
            key={caseData.id}
            caseData={caseData}
            onPress={() => navigation.navigate('CaseDetails', { caseId: caseData.id })}
          />
        ))
      ) : (
        <Text>No cases scheduled for today.</Text>
      )}
    </View>
  );
};

const DashboardScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <WelcomeCard />
          <QuickActionsGrid />
          <AdvertisementBanner />
          <TodaysCasesSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  adBanner: {
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  adLabel: {
    color: '#777',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  adButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  adButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
});

export default DashboardScreen;
