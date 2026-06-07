import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import PrimaryButton from './components/PrimaryButton';
import InputField from './components/InputField';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import { getDb, addUser, updateUserProfile } from '../../DataBase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitter } from '../../utils/event-emitter';
import { useTranslation } from '../../Providers/LanguageProvider';

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
  const { t } = useTranslation();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [otherArea, setOtherArea] = useState('');

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.stepText}>{t('onboarding_step_4_of_4')}</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>{t('onboarding_select_areas')}</Text>
        <View style={styles.grid}>
          {practiceAreas.map((area) => (
            <TouchableOpacity
              key={area}
              style={[
                styles.pill,
                selectedAreas.includes(area) ? styles.activePill : styles.inactivePill,
              ]}
              onPress={() => toggleArea(area)}
            >
              <Text
                style={
                  selectedAreas.includes(area)
                    ? styles.activePillText
                    : styles.inactivePillText
                }
              >
                {t(areaTranslationKeys[area] as any)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.pill,
              selectedAreas.includes('Other') ? styles.activePill : styles.inactivePill,
            ]}
            onPress={() => toggleArea('Other')}
          >
            <Text
              style={
                selectedAreas.includes('Other')
                  ? styles.activePillText
                  : styles.inactivePillText
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
                const userId = await addUser(finalOnboardingData.fullName, finalOnboardingData.email);
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
            <Text style={styles.skipText}>{t('btn_previous')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#1E1E1E',
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
  activePill: {
    backgroundColor: '#2D60FF',
  },
  inactivePill: {
    backgroundColor: '#F3F4F6',
  },
  activePillText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inactivePillText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
  skipText: {
    color: '#2D60FF',
    marginTop: 16,
  },
  stepText: {
    textAlign: 'center',
    paddingTop: 20,
    marginBottom: 20,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default PracticeAreasScreen;
