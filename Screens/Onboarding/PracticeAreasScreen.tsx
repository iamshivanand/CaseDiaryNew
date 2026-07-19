import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Platform, StatusBar } from 'react-native';
import PrimaryButton from './components/PrimaryButton';
import InputField from './components/InputField';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import { getDb, addUser, updateUserProfile } from '../../DataBase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitter } from '../../utils/event-emitter';
import { useTranslation } from '../../Providers/LanguageProvider';
import { ThemeContext } from '../../Providers/ThemeProvider';

const practiceAreas = [
  'Criminal Law',
  'Civil Law',
  'Corporate Law',
  'Family Law',
  'Intellectual Property',
  'Real Estate Law',
];

const areaTranslationKeys: { [key: string]: string } = {
  'Criminal Law': 'practice_criminal',
  'Civil Law': 'practice_civil',
  'Corporate Law': 'practice_corporate',
  'Family Law': 'practice_family',
  'Intellectual Property': 'practice_ip',
  'Real Estate Law': 'practice_realestate',
};

const PracticeAreasScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [otherArea, setOtherArea] = useState('');

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSkipAll = async () => {
    console.log('Skip to dashboard pressed from PracticeAreasScreen');
    try {
      const db = await getDb();
      const userId = await addUser(onboardingData.fullName || 'User', onboardingData.email || '');
      if (userId) {
        await updateUserProfile(db, userId, onboardingData);
        await AsyncStorage.setItem('@onboarding_complete', 'true');
        await AsyncStorage.setItem('@user_id', userId.toString());
        emitter.emit('onboardingComplete');
      }
    } catch (error) {
      console.error('Error completing onboarding during skip:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0 }]}>
      <TouchableOpacity 
        style={{ position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 20, right: 20, zIndex: 10 }}
        onPress={handleSkipAll}
      >
        <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>{t('btn_skip')}</Text>
      </TouchableOpacity>

      <Text style={[styles.stepText, { color: theme.colors.textSecondary, marginTop: 40 }]}>{t('onboarding_step_4_of_4')}</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('onboarding_select_areas')}</Text>
        <View style={styles.grid}>
          {practiceAreas.map((area) => (
            <TouchableOpacity
              key={area}
              style={[
                styles.pill,
                selectedAreas.includes(area) 
                  ? { backgroundColor: theme.colors.primary } 
                  : { backgroundColor: theme.colors.inputBackground },
              ]}
              onPress={() => toggleArea(area)}
            >
              <Text
                style={
                  selectedAreas.includes(area)
                    ? styles.activePillText
                    : [styles.inactivePillText, { color: theme.colors.textSecondary }]
                }
              >
                {t(areaTranslationKeys[area] as any)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.pill,
              selectedAreas.includes('Other') 
                ? { backgroundColor: theme.colors.primary } 
                : { backgroundColor: theme.colors.inputBackground },
            ]}
            onPress={() => toggleArea('Other')}
          >
            <Text
              style={
                selectedAreas.includes('Other')
                  ? styles.activePillText
                  : [styles.inactivePillText, { color: theme.colors.textSecondary }]
              }
            >
              {t('gender_other')}
            </Text>
          </TouchableOpacity>
        </View>
        {selectedAreas.includes('Other') && (
          <InputField
            label={t('onboarding_other_area')}
            placeholder={t('onboarding_specify')}
            value={otherArea}
            onChangeText={setOtherArea}
          />
        )}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={t('btn_finish')}
            onPress={async () => {
              console.log('Finish button pressed');
              if (selectedAreas.length === 0) {
                Alert.alert(t('alert_error'), t('onboarding_err_select_area'));
                return;
              }
              const practiceAreas = [...selectedAreas];
              if (selectedAreas.includes('Other') && otherArea) {
                practiceAreas.push(otherArea);
              }
              const finalOnboardingData = { ...onboardingData, practiceAreas };
              console.log('Final onboarding data:', finalOnboardingData);

              try {
                const db = await getDb();
                console.log('Database instance:', db);
                const userId = await addUser(finalOnboardingData.fullName || '', finalOnboardingData.email || '');
                console.log('User ID:', userId);
                if (userId) {
                   await updateUserProfile(db, userId, finalOnboardingData);
                   await AsyncStorage.setItem('@onboarding_complete', 'true');
                   await AsyncStorage.setItem('@user_id', userId.toString());
                   emitter.emit('onboardingComplete');
                }
              } catch (error) {
                console.error('Error saving onboarding data:', error);
              }
            }}
          />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.skipText, { color: theme.colors.primary }]}>{t('btn_previous')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
  },
  activePillText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inactivePillText: {
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
  skipText: {
    marginTop: 16,
  },
  stepText: {
    textAlign: 'center',
    paddingTop: 20,
    marginBottom: 20,
    fontSize: 16,
  },
});

export default PracticeAreasScreen;
