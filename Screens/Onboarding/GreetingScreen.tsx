import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import PrimaryButton from './components/PrimaryButton';
import { useTranslation } from '../../Providers/LanguageProvider';

const GreetingScreen = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding_welcome_title')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding_welcome_desc')}
        </Text>
        <PrimaryButton
          title={t('onboarding_start_btn')}
          onPress={() => navigation.navigate('PersonalDetails')}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('ImportMigration', { isFromOnboarding: true })}
          style={{ marginTop: 24, padding: 8 }}
          activeOpacity={0.8}
        >
          <Text style={styles.importLink}>{t('onboarding_import_link')}</Text>
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
  importLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

export default GreetingScreen;
