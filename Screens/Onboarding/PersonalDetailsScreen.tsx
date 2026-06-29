import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Alert, Text } from 'react-native';
import InputField from './components/InputField';
import PrimaryButton from './components/PrimaryButton';
import { Picker } from '@react-native-picker/picker';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import { useTranslation } from '../../Providers/LanguageProvider';
import { ThemeContext } from '../../Providers/ThemeProvider';

const PersonalDetailsScreen = ({ navigation }) => {
  const { setOnboardingData } = useContext(OnboardingContext);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('onboarding_step_1_of_4')}</Text>
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
        <View style={[styles.pickerContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
            style={{ color: theme.colors.text }}
            dropdownIconColor={theme.colors.textSecondary}
          >
            <Picker.Item label={t('gender_male')} value="Male" color={theme.colors.text} style={{ backgroundColor: theme.colors.inputBackground }} />
            <Picker.Item label={t('gender_female')} value="Female" color={theme.colors.text} style={{ backgroundColor: theme.colors.inputBackground }} />
            <Picker.Item label={t('gender_other')} value="Other" color={theme.colors.text} style={{ backgroundColor: theme.colors.inputBackground }} />
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
    justifyContent: 'center',
    padding: 24,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
  stepText: {
    textAlign: 'center',
    paddingTop: 20,
    marginBottom: 20,
    fontSize: 16,
  },
});

export default PersonalDetailsScreen;
