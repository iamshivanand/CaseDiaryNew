// Screens/EditCase/components/DocumentItem.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Ensure this is installed
import { DocumentItemStyles } from './DocumentItemStyle';
import IconOnlyButton from '../../CommonComponents/IconOnlyButton'; // Adjusted path
import { Document } from '../../../Types/appTypes'; // Adjusted path
import { format, parseISO } from 'date-fns'; // For date formatting

interface DocumentItemProps {
  document: Document;
  onView: (document: Document) => void;
  onEdit: (document: Document) => void;
  onDelete: (document: Document) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ document, onView, onEdit, onDelete }) => {
  const getFileIconName = (fileType?: string | null): keyof typeof MaterialIcons.glyphMap => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return 'picture-as-pdf';
    if (type.includes('image') || type.includes('jpeg') || type.includes('jpg') || type.includes('png')) return 'image';
    if (type.includes('doc') || type.includes('word')) return 'description';
    if (type.includes('xls') || type.includes('excel')) return 'assessment'; // Using assessment for spreadsheets
    if (type.includes('ppt') || type.includes('presentation')) return 'slideshow';
    return 'insert-drive-file'; // Default file icon
  };

  const formattedUploadDate = () => {
    try {
      // Assuming document.uploadDate is an ISO string like "2023-09-15T10:00:00.000Z"
      // or "YYYY-MM-DD HH:MM:SS" - needs to be parseable by parseISO or new Date()
      const date = parseISO(document.uploadDate);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      // If date is already formatted or in an unexpected format, display as is
      return document.uploadDate;
    }
  };

  return (
    <View style={DocumentItemStyles.container}>
      <View style={DocumentItemStyles.fileIconContainer}>
        <MaterialIcons name={getFileIconName(document.fileType)} size={22} color="#3B82F6" /> {/* Tailwind blue-500 */}
      </View>
      <View style={DocumentItemStyles.textContainer}>
        <Text style={DocumentItemStyles.fileName} numberOfLines={1} ellipsizeMode="middle">
          {document.fileName}
        </Text>
        <Text style={DocumentItemStyles.uploadDate}>
          Uploaded: {formattedUploadDate()}
        </Text>
      </View>
      <View style={DocumentItemStyles.actionsContainer}>
        <IconOnlyButton
          icon={<MaterialIcons name="visibility" size={22} color="#6B7280" />} // Tailwind gray-500
          onPress={() => onView(document)}
          accessibilityLabel="View document"
          style={DocumentItemStyles.actionIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
        />
        <IconOnlyButton
          icon={<MaterialIcons name="edit" size={22} color="#6B7280" />} // Tailwind gray-500
          onPress={() => onEdit(document)}
          accessibilityLabel="Edit document metadata"
          style={DocumentItemStyles.actionIcon}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        />
        <IconOnlyButton
          icon={<MaterialIcons name="delete" size={22} color="#EF4444" />} // Tailwind red-500
          onPress={() => onDelete(document)}
          accessibilityLabel="Delete document"
          style={DocumentItemStyles.actionIcon}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
        />
      </View>
    </View>
  );
};

export default DocumentItem;
