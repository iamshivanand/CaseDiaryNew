import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import { Picker } from '@react-native-picker/picker';
import StepperIndicator from './components/StepperIndicator';
import { OnboardingContext } from '../../Providers/OnboardingProvider';

const PersonalDetailsScreen = ({ navigation }) => {
  const { setOnboardingData } = useContext(OnboardingContext);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');

  const steps = ['Personal Details', 'Upload Photo', 'Setup Profile', 'Practice Areas', 'Done'];
  const currentStep = 1;

  return (
    <SafeAreaView style={styles.container}>
      <StepperIndicator steps={steps} currentStep={currentStep} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
        />
        <InputField
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <InputField
          label="Email Address"
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={() => {
              if (!fullName) {
                Alert.alert('Error', 'Please enter your full name.');
                return;
              }
              setOnboardingData({ fullName, phone, email, gender });
              navigation.navigate('UploadPhoto');
            }}
          />
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
});

export default PersonalDetailsScreen;
