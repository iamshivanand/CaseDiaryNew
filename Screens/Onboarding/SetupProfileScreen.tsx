import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Text, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import { useTranslation } from '../../Providers/LanguageProvider';
import { ThemeContext } from '../../Providers/ThemeProvider';
import { getDb, addUser, updateUserProfile } from '../../DataBase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitter } from '../../utils/event-emitter';

const SetupProfileScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [license, setLicense] = useState('');
  const [location, setLocation] = useState('');

  const handleContinue = () => {
    console.log('Continue button pressed on SetupProfileScreen');
    const setupProfileData = { title, experience, license, location };
    console.log('Saving setup profile data:', setupProfileData);
    setOnboardingData({ ...onboardingData, ...setupProfileData });
    navigation.navigate('PracticeAreas');
  };

  const handleSkipAll = async () => {
    console.log('Skip to dashboard pressed from SetupProfileScreen');
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
      >
        <Text style={[styles.stepText, { color: theme.colors.textSecondary, marginTop: 40 }]}>{t('onboarding_step_3_of_4')}</Text>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <InputField
            label={t('onboarding_prof_title')}
            placeholder={t('onboarding_prof_title_placeholder')}
            value={title}
            onChangeText={setTitle}
          />
          <InputField
            label={t('onboarding_experience')}
            placeholder={t('onboarding_experience_placeholder')}
            value={experience}
            onChangeText={setExperience}
            keyboardType="number-pad"
          />
          <InputField
            label={t('onboarding_license')}
            placeholder={t('onboarding_license_placeholder')}
            value={license}
            onChangeText={setLicense}
          />
          <InputField
            label={t('onboarding_location')}
            placeholder={t('onboarding_location_placeholder')}
            value={location}
            onChangeText={setLocation}
          />
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title={t('btn_continue')}
              onPress={handleContinue}
            />
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.skipText, { color: theme.colors.primary }]}>{t('btn_previous')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('PracticeAreas')} style={{ alignSelf: 'center' }}>
            <Text style={[styles.skipText, { color: theme.colors.primary }]}>{t('btn_skip')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
    fontSize: 16,
  },
});

export default SetupProfileScreen;

