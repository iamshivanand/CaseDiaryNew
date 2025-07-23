import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TemplateCard from './components/TemplateCard';

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
  const navigation = useNavigation();

  const handleTemplatePress = (template) => {
    navigation.navigate('TemplateFormScreen', { template });
  };

  const renderItem = ({ item }) => (
    <TemplateCard template={item} onPress={() => handleTemplatePress(item)} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Legal Document Templates</Text>
      <FlatList
        data={templates}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default LegalTemplatesScreen;
