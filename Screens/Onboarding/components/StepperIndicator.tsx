import React, { useEffect, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ThemeContext } from '../../../Providers/ThemeProvider';

interface StepperIndicatorProps {
  steps: string[];
  currentStep: number;
}

const StepperIndicator: React.FC<StepperIndicatorProps> = ({ steps, currentStep }) => {
  const { theme } = useContext(ThemeContext);
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
        <View style={[styles.connector, { backgroundColor: theme.colors.border }]} />
        <Animated.View style={[styles.connector, styles.activeConnector, { backgroundColor: theme.colors.primary }, animatedStyle]} />
      </View>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View
            style={[
              styles.circle,
              index + 1 <= currentStep 
                ? { backgroundColor: theme.colors.primary } 
                : { backgroundColor: theme.colors.border },
            ]}
          >
            <Text
              style={[
                styles.stepText,
                index + 1 <= currentStep 
                  ? { color: '#FFFFFF' } 
                  : { color: theme.colors.text },
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              index + 1 === currentStep 
                ? { color: theme.colors.text, fontWeight: '600' } 
                : { color: theme.colors.textSecondary },
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
  stepText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
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
  },
  activeConnector: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
});

export default StepperIndicator;
