import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TemplateCard = ({ template, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Ionicons name="document-text-outline" size={30} color="#007BFF" />
      <Text style={styles.cardText}>{template.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
  cardText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default TemplateCard;
