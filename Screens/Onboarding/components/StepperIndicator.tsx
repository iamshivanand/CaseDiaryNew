import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface StepperIndicatorProps {
  steps: string[];
  currentStep: number;
}

const StepperIndicator: React.FC<StepperIndicatorProps> = ({ steps, currentStep }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((currentStep - 1) / (steps.length - 1), {
      duration: 500,
    });
  }, [currentStep]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.connectorContainer}>
        <View style={styles.connector} />
        <Animated.View style={[styles.connector, styles.activeConnector, animatedStyle]} />
      </View>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View
            style={[
              styles.circle,
              index + 1 <= currentStep ? styles.activeCircle : styles.inactiveCircle,
            ]}
          >
            <Text
              style={[
                styles.stepText,
                index + 1 <= currentStep ? styles.activeText : styles.inactiveText,
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
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
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
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  activeLabel: {
    color: '#1E1E1E',
    fontWeight: '600',
  },
  inactiveLabel: {
    color: '#6B7280',
  },
  connectorContainer: {
    position: 'absolute',
    top: 15,
    left: '50%',
    right: '-50%',
    height: 2,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  activeConnector: {
    backgroundColor: '#2D60FF',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
});

export default StepperIndicator;
