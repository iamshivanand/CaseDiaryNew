import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import PrimaryButton from './components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

const UploadPhotoScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.uploadBox}>
          <Ionicons name="cloud-upload-outline" size={48} color="#6B7280" />
          <Text style={styles.uploadText}>Tap to upload your photo</Text>
        </TouchableOpacity>
        <PrimaryButton
          title="Continue"
          onPress={() => navigation.navigate('SetupProfile')}
        />
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
    padding: 24,
  },
  content: {
    alignItems: 'center',
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
});

export default UploadPhotoScreen;
