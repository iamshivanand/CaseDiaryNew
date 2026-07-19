import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Text, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
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
  
  const [errors, setErrors] = useState<{ fullName?: string | null; phone?: string | null; email?: string | null }>({});

  const handleContinue = () => {
    console.log('Continue button pressed on PersonalDetailsScreen');
    const newErrors: { fullName?: string | null; phone?: string | null; email?: string | null } = {};

    if (!fullName.trim()) {
      newErrors.fullName = t('onboarding_err_enter_name');
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      newErrors.phone = t('onboarding_err_enter_phone');
    } else if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
      newErrors.phone = t('onboarding_err_invalid_phone');
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = t('onboarding_err_enter_email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = t('onboarding_err_invalid_email');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const personalDetails = { fullName: fullName.trim(), phone: trimmedPhone, email: trimmedEmail, gender };
    console.log('Saving personal details:', personalDetails);
    setOnboardingData(personalDetails);
    navigation.navigate('UploadPhoto');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
      >
        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('onboarding_step_1_of_4')}</Text>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <InputField
            label={t('onboarding_full_name')}
            placeholder={t('onboarding_enter_full_name')}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors({ ...errors, fullName: null });
            }}
            error={errors.fullName}
          />
          <InputField
            label={t('onboarding_phone_number')}
            placeholder={t('onboarding_enter_phone_number')}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors({ ...errors, phone: null });
            }}
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <InputField
            label={t('onboarding_email')}
            placeholder={t('onboarding_enter_email')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            keyboardType="email-address"
            error={errors.email}
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
              onPress={handleContinue}
            />
          </View>
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  stepText: {
    textAlign: 'center',
    paddingTop: 10,
    marginBottom: 10,
    fontSize: 16,
  },
});

export default PersonalDetailsScreen;

