import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Alert, Text } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import { Picker } from '@react-native-picker/picker';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import { useTranslation } from '../../Providers/LanguageProvider';

const PersonalDetailsScreen = ({ navigation }) => {
  const { setOnboardingData } = useContext(OnboardingContext);
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.stepText}>{t('onboarding_step_1_of_4')}</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <InputField
          label={t('onboarding_full_name')}
          placeholder={t('onboarding_enter_full_name')}
          value={fullName}
          onChangeText={setFullName}
        />
        <InputField
          label={t('onboarding_phone_number')}
          placeholder={t('onboarding_enter_phone_number')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <InputField
          label={t('onboarding_email')}
          placeholder={t('onboarding_enter_email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label={t('gender_male')} value="Male" />
            <Picker.Item label={t('gender_female')} value="Female" />
            <Picker.Item label={t('gender_other')} value="Other" />
          </Picker>
        </View>
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={t('btn_continue')}
            onPress={() => {
              console.log('Continue button pressed on PersonalDetailsScreen');
              if (!fullName) {
                Alert.alert(t('alert_error'), t('onboarding_err_enter_name'));
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
    paddingTop: 20,
    marginBottom: 20,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default PersonalDetailsScreen;
