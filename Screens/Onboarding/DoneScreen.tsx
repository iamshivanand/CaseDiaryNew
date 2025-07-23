import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import PrimaryButton from './components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingContext } from '../../Providers/OnboardingProvider';
import { getDb, addUser, updateUserProfile } from '../../DataBase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitter } from '../../utils/event-emitter';

const DoneScreen = () => {
  const { onboardingData } = useContext(OnboardingContext);

  useEffect(() => {
    const saveProfile = async () => {
      const db = await getDb();
      const userId = await addUser(onboardingData.fullName, onboardingData.email);
      if (userId) {
        await updateUserProfile(db, userId, onboardingData);
        await AsyncStorage.setItem('@onboarding_complete', 'true');
        await AsyncStorage.setItem('@user_id', userId.toString());
        emitter.emit('onboardingComplete');
      }
    };
    saveProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="checkmark-circle-outline" size={100} color="#2D60FF" />
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          Your profile has been created successfully.
        </Text>
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
