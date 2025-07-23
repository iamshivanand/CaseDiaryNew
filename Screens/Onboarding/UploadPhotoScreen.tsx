import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import PrimaryButton from './components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import StepperIndicator from './components/StepperIndicator';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import * as ImagePicker from 'expo-image-picker';

const UploadPhotoScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const steps = ['Personal Details', 'Upload Photo', 'Setup Profile', 'Practice Areas', 'Done'];
  const currentStep = 2;

  const handleChooseImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setOnboardingData({ ...onboardingData, avatarUrl: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StepperIndicator steps={steps} currentStep={currentStep} />
      <View style={styles.content}>
        <TouchableOpacity style={styles.uploadBox} onPress={handleChooseImage}>
          <Ionicons name="cloud-upload-outline" size={48} color="#6B7280" />
          <Text style={styles.uploadText}>Tap to upload your photo</Text>
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={() => navigation.navigate('SetupProfile')}
          />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.skipText}>Previous</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('SetupProfile')}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  uploadBox: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadText: {
    color: '#6B7280',
    marginTop: 8,
  },
  skipText: {
    color: '#2D60FF',
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
});

export default UploadPhotoScreen;
