import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const Advertisement = () => {
  return (
    <View style={styles.adBanner}>
      <Text>Advertisement</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  adBanner: {
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  adLabel: {
    color: '#777',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  adButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  adButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Advertisement;
