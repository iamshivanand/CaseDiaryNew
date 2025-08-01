import React, { useState, useEffect, useCallback, useContext } from 'react';
import { ThemeContext } from '../../Providers/ThemeProvider';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { format } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getDb, getUserProfile } from '../../DataBase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { styles } from './DashboardStyle';
import SectionHeader from '../CommonComponents/SectionHeader';
import NewCaseCard from '../CasesList/components/NewCaseCard';
import * as db from '../../DataBase';
import { CaseDataScreen } from '../../Types/appTypes';
import UpdateHearingPopup from '../CaseDetailsScreen/components/UpdateHearingPopup';
import { getCurrentUserId, formatDate } from '../../utils/commonFunctions';

const WelcomeCard = () => {
  const [userName, setUserName] = useState("User");
  const today = new Date();
  const formattedDate = format(today, "eeee, MMMM d, yyyy");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const db = await getDb();
        const userId = await AsyncStorage.getItem("@user_id");
        if (userId) {
          const profile = await getUserProfile(db, parseInt(userId, 10));
          if (profile && profile.name) {
            setUserName(profile.name);
          }
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
  }, []);

  return (
    <View style={styles.welcomeCard}>
      <Text style={styles.welcomeTitle}>Good morning, {userName}!</Text>
      <Text style={styles.welcomeSubtitle}>{formattedDate}</Text>
    </View>
  );
};

const QuickActionButton = ({ icon, title, onPress }) => {
  const { theme } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.colors.componentBackground,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      margin: 4,
      minWidth: '45%',
    },
    icon: {
      marginBottom: 8,
    },
    title: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name={icon} size={24} color={theme.colors.primary} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

import ThemeProvider from '../../Providers/ThemeProvider';

const QuickActionsGrid = () => {
  const navigation = useNavigation();

  return (
    <ThemeProvider>
      <View>
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActionsContainer}>
          <QuickActionButton icon="add-circle" title="Add New Case" onPress={() => navigation.navigate('AddCase')} />
          <QuickActionButton icon="folder-open" title="View All Cases" onPress={() => navigation.navigate('AllCases')} />
          <QuickActionButton icon="calendar" title="Yesterday's Cases" onPress={() => navigation.navigate('YesterdaysCases')} />
          <QuickActionButton icon="alert-circle" title="Undated Cases" onPress={() => navigation.navigate('UndatedCases')} />
        </View>
      </View>
    </ThemeProvider>
  );
};

const AnimatedNewCaseCard = ({ caseDetails, onUpdateHearingPress, index }) => {
  if (!caseDetails) {
    return null;
  }
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <NewCaseCard
        caseDetails={caseDetails}
        onUpdateHearingPress={onUpdateHearingPress}
      />
    </Animated.View>
  );
};

const TodaysCasesSection = () => {
  const [todaysCases, setTodaysCases] = useState<CaseDataScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  const fetchTodaysCases = async () => {
    setLoading(true);
    try {
      const allCases = await db.getCases();
      const today = new Date().toISOString().split('T')[0];

      const filteredCases = allCases.filter(c => {
        if (!c.NextDate) return false;
        const nextHearingDate = new Date(c.NextDate).toISOString().split('T')[0];
        return nextHearingDate === today;
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

      console.log('mappedCases', mappedCases);
      setTodaysCases(mappedCases);
    } catch (error) {
      console.error("Error fetching today's cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTodaysCases();
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
      if (notes) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: new Date().toISOString(),
          notes: notes,
        });
      }
      await db.updateCase(caseId, { NextDate: nextHearingDate.toISOString() }, userId);
      fetchTodaysCases();
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  };

  return (
    <View>
      <SectionHeader title="Today's Cases" />
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : todaysCases.length > 0 ? (
        todaysCases.map((caseData, index) => {
          console.log('caseData', caseData);
          return (
            <AnimatedNewCaseCard
              key={caseData.id}
              caseDetails={caseData}
              onUpdateHearingPress={() => handleUpdateHearing(caseData)}
              index={index}
            />
          );
        })
      ) : (
        <Text style={styles.emptyMessage}>No cases scheduled for today.</Text>
      )}
      {selectedCase && (
        <UpdateHearingPopup
          visible={isPopupVisible}
          onClose={() => setPopupVisible(false)}
          onSave={(notes, nextHearingDate) =>
            handleSaveHearing(notes, nextHearingDate, getCurrentUserId())
          }
        />
      )}
    </View>
  );
};

const DashboardScreen = () => {
  try {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <WelcomeCard />
            <QuickActionsGrid />
            <TodaysCasesSection />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  } catch (error) {
    console.error("Error in DashboardScreen:", error);
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong.</Text>
        </View>
      </SafeAreaView>
    );
  }
};

export default DashboardScreen;
