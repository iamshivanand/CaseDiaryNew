import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import PrimaryButton from './components/PrimaryButton';

const GreetingScreen = ({ navigation }) => {
  useEffect(() => {
    console.log("GreetingScreen rendered");
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Case Diary!</Text>
        <Text style={styles.subtitle}>
          Let's get you set up for a seamless case management experience.
        </Text>
        <PrimaryButton
          title="Let's Get Started"
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
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
});

export default GreetingScreen;
