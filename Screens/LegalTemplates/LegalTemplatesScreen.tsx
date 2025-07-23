import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const templates = [
  { id: '1', name: 'Non-Disclosure Agreement' },
  { id: '2', name: 'Independent Contractor Agreement' },
  { id: '3', name: 'Employment Agreement' },
  { id: '4', name: 'Last Will and Testament' },
  { id: '5', name: 'Power of Attorney' },
  { id: '6', name: 'Residential Lease Agreement' },
  { id: '7', name: 'Bill of Sale' },
];

const LegalTemplatesScreen = () => {
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Legal Document Templates</Text>
      <FlatList
        data={templates}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
  },
});

export default LegalTemplatesScreen;
