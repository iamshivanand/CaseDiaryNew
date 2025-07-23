import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Alert, Text } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import { Picker } from '@react-native-picker/picker';
import { OnboardingContext } from '../../Providers/OnboardingProvider';

const PersonalDetailsScreen = ({ navigation }) => {
  const { setOnboardingData } = useContext(OnboardingContext);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.stepText}>Step 1 of 4</Text>
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
              console.log('Continue button pressed on PersonalDetailsScreen');
              if (!fullName) {
                Alert.alert('Error', 'Please enter your full name.');
                return;
              }
              const personalDetails = { fullName, phone, email, gender };
              console.log('Saving personal details:', personalDetails);
              setOnboardingData(personalDetails);
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
    padding: 24,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
  stepText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default PersonalDetailsScreen;
