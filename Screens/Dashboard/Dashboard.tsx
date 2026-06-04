import React, { useState, useEffect, useCallback, useContext } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, Pressable } from 'react-native';
import { format } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getDb, getUserProfile } from '../../DataBase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../../Providers/ThemeProvider';
import { mapCaseDbToScreen } from '../../utils/caseMapper';
import { LinearGradient } from 'expo-linear-gradient';

const WelcomeCard = () => {
  const { theme } = useContext(ThemeContext);
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

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      return { text: "Good morning", emoji: "☀️" };
    } else if (hours >= 12 && hours < 17) {
      return { text: "Good afternoon", emoji: "🌤️" };
    } else if (hours >= 17 && hours < 21) {
      return { text: "Good evening", emoji: "🌆" };
    } else {
      return { text: "Good night", emoji: "🌙" };
    }
  };

  const greeting = getGreeting();

  const welcomeGradient = theme.dark
    ? ["#312E81", "#0F172A"] // Premium dark Indigo-Slate gradient
    : ["#6366F1", "#312E81"]; // Premium Indigo gradient for light mode

  return (
    <LinearGradient
      colors={welcomeGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.welcomeCard,
        {
          borderBottomWidth: 0,
        }
      ]}
    >
      <Text style={[styles.welcomeTitle, { color: "#FFFFFF" }]}>
        {greeting.emoji} {greeting.text}, {userName}!
      </Text>
      <Text style={[styles.welcomeSubtitle, { color: "rgba(255, 255, 255, 0.85)" }]}>{formattedDate}</Text>
    </LinearGradient>
  );
};

import Ionicons from "react-native-vector-icons/Ionicons";

const QuickActionButton = ({ icon, text, onPress, color }) => {
  const { theme } = useContext(ThemeContext);
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.quickAction, 
        { 
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          borderWidth: 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: pressed ? 0.96 : 1,
          overflow: "hidden", // Clip absolute watermark within rounded borders
        }
      ]} 
      onPress={onPress}
    >
      {/* Subtle Background Watermark Icon */}
      <Ionicons 
        name={icon} 
        size={64} 
        color={color} 
        style={{
          position: "absolute",
          right: -10,
          bottom: -10,
          opacity: theme.dark ? 0.06 : 0.03,
        }} 
      />

      <View style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: `${color}12`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        zIndex: 2,
      }}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.quickActionText, { color: theme.colors.text, zIndex: 2 }]} numberOfLines={2}>{text}</Text>
    </Pressable>
  );
};

import SectionHeader from '../CommonComponents/SectionHeader';

const QuickActionsGrid = () => {
  const navigation = useNavigation();

  return (
    <View>
      <SectionHeader title="Quick Actions" />
      <View style={styles.quickActionsContainer}>
        <QuickActionButton icon="add-circle" text="Add New Case" onPress={() => navigation.navigate('AddCase' as any)} color="#00CC44" />
        <QuickActionButton icon="folder-open" text="View All Cases" onPress={() => navigation.navigate('AllCases' as any)} color="#007BFF" />
        <QuickActionButton icon="document-text" text="Draft Legal Doc" onPress={() => navigation.navigate('GenerateDocument' as any)} color="#8B5CF6" />
        <QuickActionButton icon="briefcase" text="Drafts Hub" onPress={() => navigation.navigate('DraftsHub' as any)} color="#EC4899" />
        <QuickActionButton icon="calendar" text="Yesterday's Cases" onPress={() => navigation.navigate('YesterdaysCases' as any)} color="#007BFF" />
        <QuickActionButton icon="alert-circle" text="Undated Cases" onPress={() => navigation.navigate('UndatedCases' as any)} color="#FF6B00" />
      </View>
    </View>
  );
};

// import AdvertisementSection from './components/AdvertisementSection';
import NewCaseCard from '../CasesList/components/NewCaseCard';
import * as db from '../../DataBase';
import { CaseData, CaseDataScreen } from '../../Types/appTypes';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import UpdateHearingPopup from '../CaseDetailsScreen/components/UpdateHearingPopup';
import { getCurrentUserId, formatDate } from '../../utils/commonFunctions';
import { exportDailyCauseListToPdf } from '../../utils/pdfExporter';
import { Alert } from 'react-native';

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

const TodaysCasesSection = () => {
  const { theme } = useContext(ThemeContext);
  const [todaysCases, setTodaysCases] = useState<CaseDataScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);

  const fetchTodaysCases = async () => {
    try {
      const allCases = await db.getCases();
      const today = new Date().toISOString().split('T')[0];

      const filteredCases = allCases.filter(c => {
        if (!c.NextDate) return false;
        const nextHearingDate = new Date(c.NextDate).toISOString().split('T')[0];
        return nextHearingDate === today;
      });

      const mappedCases: CaseDataScreen[] = filteredCases.map(mapCaseDbToScreen);

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
      fetchTodaysCases();
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  };

  const handleShareCauseList = async () => {
    if (todaysCases.length === 0) {
      Alert.alert("Empty Cause List", "There are no cases scheduled for today to export.");
      return;
    }
    try {
      const todayStr = format(new Date(), "eeee, MMMM d, yyyy");
      const allDbCases = await db.getCases();
      const today = new Date().toISOString().split('T')[0];
      const filteredDbCases = allDbCases.filter(c => {
        if (!c.NextDate) return false;
        const nextHearingDate = new Date(c.NextDate).toISOString().split('T')[0];
        return nextHearingDate === today;
      });

      await exportDailyCauseListToPdf(filteredDbCases, todayStr);
    } catch (error) {
      Alert.alert("Export Failed", "Could not compile the daily cause list PDF.");
    }
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 0, marginBottom: 0 }]}>Today's Cases</Text>
        {todaysCases.length > 0 && (
          <TouchableOpacity 
            onPress={handleShareCauseList}
            activeOpacity={0.9}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: theme.colors.primary, 
              paddingVertical: 8, 
              paddingHorizontal: 14, 
              borderRadius: 20,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="share-social" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Share List</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : todaysCases.length > 0 ? (
        todaysCases.map((caseData, index) => (
          <AnimatedNewCaseCard
            key={caseData.id}
            caseDetails={caseData}
            onUpdateHearingPress={() => handleUpdateHearing(caseData)}
            index={index}
          />
        ))
      ) : (
        <View style={{
          padding: 24,
          alignItems: 'center',
          backgroundColor: theme.colors.cardBackground,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginTop: 10,
        }}>
          <Ionicons name="calendar-outline" size={40} color={theme.colors.textSecondary} style={{ marginBottom: 8, opacity: 0.6 }} />
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', fontSize: 15, fontWeight: '500' }}>
            No cases scheduled for today.
          </Text>
        </View>
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
  const { theme } = useContext(ThemeContext);
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.content}>
          <WelcomeCard />
          <QuickActionsGrid />
          {/* <AdvertisementSection /> */}
          <TodaysCasesSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '48%',
    minHeight: 115,
    marginBottom: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  adLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  adButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  adButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
});

export default DashboardScreen;

