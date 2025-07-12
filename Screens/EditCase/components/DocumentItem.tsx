// Screens/EditCase/components/DocumentItem.tsx
// Screens/EditCase/components/DocumentItem.tsx
// DRASICALLY SIMPLIFIED FOR DEBUGGING the "Text strings must be rendered within a <Text>" error.
import React from 'react';
import { View, Text } from 'react-native';
import { DocumentItemStyles } from './DocumentItemStyle'; // Keep styles for basic layout
import { Document } from '../../../Types/appTypes'; // Keep type for props interface
// Import of MaterialIcons and IconOnlyButton removed for this simplified version
// import { MaterialIcons } from '@expo/vector-icons';
// import IconOnlyButton from '../../CommonComponents/IconOnlyButton';
// import { format, parseISO } from 'date-fns';

interface DocumentItemProps {
  document: Document; // Prop is still expected by EditCaseScreen's map function
  onView: (document: Document) => void; // Still expected
  onEdit: (document: Document) => void; // Still expected
  onDelete: (document: Document) => void; // Still expected
}

const DocumentItem: React.FC<DocumentItemProps> = ({ document, onView, onEdit, onDelete }) => {
  // All dynamic logic and complex rendering removed.
  return (
    <View style={DocumentItemStyles.container}>
      <Text>Test Document Item: {document.id}</Text>
      {/* Displaying document.id which is a number, Text component handles number fine */}
    </View>
  );
};

export default DocumentItem;
