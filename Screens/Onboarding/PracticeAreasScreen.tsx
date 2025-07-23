import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import PrimaryButton from './components/PrimaryButton';
import StepperIndicator from './components/StepperIndicator';
import InputField from './components/InputField';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import { getDb, addUser, updateUserProfile } from '../../DataBase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitter } from '../../utils/event-emitter';

const practiceAreas = [
  'Criminal Law',
  'Civil Law',
  'Corporate Law',
  'Family Law',
  'Intellectual Property',
  'Real Estate Law',
];

const PracticeAreasScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [otherArea, setOtherArea] = useState('');

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const steps = ['Personal Details', 'Upload Photo', 'Setup Profile', 'Practice Areas', 'Done'];
  const currentStep = 4;

  return (
    <SafeAreaView style={styles.container}>
      <StepperIndicator steps={steps} currentStep={currentStep} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Select Practice Areas</Text>
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
                {area}
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
              Other
            </Text>
          </TouchableOpacity>
        </View>
        {selectedAreas.includes('Other') && (
          <InputField
            label="Other Practice Area"
            placeholder="Please specify"
            value={otherArea}
            onChangeText={setOtherArea}
          />
        )}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={async () => {
              console.log('Continue button pressed');
              if (selectedAreas.length === 0) {
                Alert.alert('Error', 'Please select at least one practice area.');
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
                  navigation.navigate('Done');
                }
              } catch (error) {
                console.error('Error saving onboarding data:', error);
              }
            }}
          />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.skipText}>Previous</Text>
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
  },
  scrollContainer: {
    padding: 24,
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
});

export default PracticeAreasScreen;
