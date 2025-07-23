import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';

const SetupProfileScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [license, setLicense] = useState('');
  const [location, setLocation] = useState('');

  return (
    <SafeAreaView style={styles.container}>
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
        <PrimaryButton
          title="Continue"
          onPress={() => navigation.navigate('PracticeAreas')}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 24,
  },
});

export default SetupProfileScreen;
