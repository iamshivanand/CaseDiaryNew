import React from 'react';
import { View, StyleSheet } from 'react-native';
import Advertisement from './Advertisement';
import SectionHeader from '../../CommonComponents/SectionHeader';

const AdvertisementSection = () => {
  return (
    <View>
      <SectionHeader title="Advertisement" />
      <Advertisement />
    </View>
  );
};

export default AdvertisementSection;
