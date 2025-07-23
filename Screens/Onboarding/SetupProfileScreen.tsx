import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Text } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import StepperIndicator from './components/StepperIndicator';
import { OnboardingContext } from '../../Providers/OnboardingProvider';

const SetupProfileScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [title, setTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [license, setLicense] = useState('');
  const [location, setLocation] = useState('');

  const steps = ['Personal Details', 'Upload Photo', 'Setup Profile', 'Practice Areas', 'Done'];
  const currentStep = 3;

  return (
    <SafeAreaView style={styles.container}>
      <StepperIndicator steps={steps} currentStep={currentStep} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <InputField
          label="Professional Title"
          placeholder="e.g. Senior Lawyer"
          value={title}
          onChangeText={setTitle}
        />
        <InputField
          label="Years of Experience"
          placeholder="Enter number of years"
          value={experience}
          onChangeText={setExperience}
          keyboardType="number-pad"
        />
        <InputField
          label="License Number"
          placeholder="Enter your license number"
          value={license}
          onChangeText={setLicense}
        />
        <InputField
          label="Location"
          placeholder="Enter your city and state"
          value={location}
          onChangeText={setLocation}
        />
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={() => {
              if (!title || !experience) {
                Alert.alert(
                  'Error',
                  'Please enter your professional title and years of experience.'
                );
                return;
              }
              setOnboardingData({ ...onboardingData, title, experience, license, location });
              navigation.navigate('PracticeAreas');
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

export default SetupProfileScreen;
