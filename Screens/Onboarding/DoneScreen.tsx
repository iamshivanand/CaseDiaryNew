import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const DoneScreen = ({ navigation }) => {
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    console.log("DoneScreen rendered");
    opacity.value = withDelay(
      2000,
      withTiming(0, { duration: 500 }, () => {
        navigation.navigate('MainApp');
      })
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Ionicons name="checkmark-circle-outline" size={100} color="#2D60FF" />
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          Your profile has been created successfully.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E1E1E',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});

export default DoneScreen;
