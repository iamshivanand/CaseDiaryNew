import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Document } from '../../../Types/appTypes';
import { Ionicons } from '@expo/vector-icons';

interface DocumentItemProps {
  document: Document;
  onView: (document: Document) => void;
  onEdit: (document: Document) => void;
  onDelete: (document: Document) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ document, onView, onEdit, onDelete }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onView(document)} style={styles.documentNameContainer}>
        <Ionicons name="document-text-outline" size={24} color="#1D4ED8" />
        <Text style={styles.documentName}>{document.fileName}</Text>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => onEdit(document)} style={styles.button}>
          <Ionicons name="pencil" size={20} color="#1D4ED8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(document)} style={[styles.button, styles.deleteButton]}>
          <Ionicons name="trash" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  documentNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentName: {
    marginLeft: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    padding: 8,
  },
  deleteButton: {
    marginLeft: 8,
  },
});

export default DocumentItem;
