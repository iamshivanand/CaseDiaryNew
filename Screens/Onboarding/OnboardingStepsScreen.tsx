import React, { useContext } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import StepperIndicator from './components/StepperIndicator';
import PrimaryButton from './components/PrimaryButton';
import { ThemeContext } from '../../Providers/ThemeProvider';

const OnboardingStepsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const steps = ['Personal Details', 'Upload Photo', 'Setup Profile', 'Practice Areas', 'Done'];
  const currentStep = 1; // This will be dynamic in the real app

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
});

export default OnboardingStepsScreen;
