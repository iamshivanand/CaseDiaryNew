import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import PrimaryButton from './components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../../Providers/LanguageProvider';
import { ThemeContext } from '../../Providers/ThemeProvider';

const UploadPhotoScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  const handleChooseImage = async () => {
    console.log('handleChooseImage called');
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Image selected:', result.assets[0].uri);
      setOnboardingData({ ...onboardingData, avatarUrl: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('onboarding_step_2_of_4')}</Text>
      <View style={styles.content}>
        <TouchableOpacity style={[styles.uploadBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]} onPress={handleChooseImage}>
          {onboardingData.avatarUrl ? (
            <Image source={{ uri: onboardingData.avatarUrl }} style={styles.previewImage} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.uploadText, { color: theme.colors.textSecondary }]}>{t('onboarding_tap_upload_photo')}</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={t('btn_continue')}
            onPress={() => navigation.navigate('SetupProfile')}
          />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.skipText, { color: theme.colors.primary }]}>{t('btn_previous')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('SetupProfile')}>
          <Text style={[styles.skipText, { color: theme.colors.primary }]}>{t('btn_skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBox: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadText: {
    marginTop: 8,
  },
  skipText: {
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
  stepText: {
    textAlign: 'center',
    paddingTop: 20,
    marginBottom: 20,
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});

export default UploadPhotoScreen;
