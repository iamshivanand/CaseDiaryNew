import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import { useTranslation } from '../../Providers/LanguageProvider';

const SetupProfileScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [license, setLicense] = useState('');
  const [location, setLocation] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.stepText}>{t('onboarding_step_3_of_4')}</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            onPress={() => {
              console.log('Continue button pressed on SetupProfileScreen');
              if (!title || !experience) {
                Alert.alert(
                  t('alert_error'),
                  t('onboarding_err_prof_title')
                );
                return;
              }
              const setupProfileData = { title, experience, license, location };
              console.log('Saving setup profile data:', setupProfileData);
              setOnboardingData({ ...onboardingData, ...setupProfileData });
              navigation.navigate('PracticeAreas');
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

export default SetupProfileScreen;
