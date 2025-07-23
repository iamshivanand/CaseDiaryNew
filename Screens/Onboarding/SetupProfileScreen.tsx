import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import { OnboardingContext } from '../../Providers/OnboardingProvider';

const SetupProfileScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [title, setTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [license, setLicense] = useState('');
  const [location, setLocation] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.stepText}>Step 3 of 4</Text>
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
              console.log('Continue button pressed on SetupProfileScreen');
              if (!title || !experience) {
                Alert.alert(
                  'Error',
                  'Please enter your professional title and years of experience.'
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
