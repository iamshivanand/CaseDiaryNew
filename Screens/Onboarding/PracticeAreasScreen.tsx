import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import PrimaryButton from './components/PrimaryButton';

const practiceAreas = [
  'Criminal Law',
  'Civil Law',
  'Corporate Law',
  'Family Law',
  'Intellectual Property',
  'Real Estate Law',
];

const PracticeAreasScreen = ({ navigation }) => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Select Practice Areas</Text>
        <View style={styles.grid}>
          {practiceAreas.map((area) => (
            <TouchableOpacity
              key={area}
              style={[
                styles.pill,
                selectedAreas.includes(area) ? styles.activePill : styles.inactivePill,
              ]}
              onPress={() => toggleArea(area)}
            >
              <Text
                style={
                  selectedAreas.includes(area)
                    ? styles.activePillText
                    : styles.inactivePillText
                }
              >
                {area}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <PrimaryButton title="Continue" onPress={() => navigation.navigate('Done')} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 5,
  },
  activePill: {
    backgroundColor: '#2D60FF',
  },
  inactivePill: {
    backgroundColor: '#F3F4F6',
  },
  activePillText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inactivePillText: {
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default PracticeAreasScreen;
