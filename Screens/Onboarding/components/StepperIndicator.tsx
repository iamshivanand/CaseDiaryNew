import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StepperIndicatorProps {
  steps: string[];
  currentStep: number;
}

const StepperIndicator: React.FC<StepperIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View
            style={[
              styles.circle,
              index + 1 === currentStep ? styles.activeCircle : styles.inactiveCircle,
            ]}
          >
            <Text
              style={[
                styles.stepText,
                index + 1 === currentStep ? styles.activeText : styles.inactiveText,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              index + 1 === currentStep ? styles.activeLabel : styles.inactiveLabel,
            ]}
          >
            {step}
          </Text>
          {index < steps.length - 1 && <View style={styles.connector} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    backgroundColor: '#2D60FF',
  },
  inactiveCircle: {
    backgroundColor: '#D1D5DB',
  },
  stepText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#FFFFFF',
  },
  inactiveText: {
    color: '#1E1E1E',
  },
  stepLabel: {
    marginLeft: 12,
    fontSize: 16,
  },
  activeLabel: {
    color: '#1E1E1E',
    fontWeight: '600',
  },
  inactiveLabel: {
    color: '#6B7280',
  },
  connector: {
    position: 'absolute',
    top: 32,
    left: 15,
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
});

export default StepperIndicator;
