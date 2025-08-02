import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import StepperIndicator from './components/StepperIndicator';
import PrimaryButton from './components/PrimaryButton';

const OnboardingStepsScreen = ({ navigation }) => {
  useEffect(() => {
    console.log("OnboardingStepsScreen rendered");
  }, []);
  const steps = ['Personal Details', 'Upload Photo', 'Setup Profile', 'Practice Areas', 'Done'];
  const currentStep = 1; // This will be dynamic in the real app

  return (
    <SafeAreaView style={styles.container}>
      <StepperIndicator steps={steps} currentStep={currentStep} />
      <View style={styles.buttonContainer}>
        <PrimaryButton
          title="Continue"
          onPress={() => navigation.navigate('PersonalDetails')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
});

export default OnboardingStepsScreen;
