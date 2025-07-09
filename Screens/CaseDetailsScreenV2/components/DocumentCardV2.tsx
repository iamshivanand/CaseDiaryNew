// Screens/CaseDetailsScreenV2/components/DocumentCardV2.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native'; // Added Alert
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DocumentCardV2Styles as styles } from './DocumentCardV2Style';
import { Document } from '../../../Types/appTypes';
import { format, parseISO, isValid } from 'date-fns';
import IconOnlyButton from '../../CommonComponents/IconOnlyButton';

interface DocumentCardV2Props {
  document: Document;
  onPress?: (document: Document) => void;
  onDownloadPress?: (document: Document) => void;
}

const DocumentCardV2: React.FC<DocumentCardV2Props> = ({ document, onPress, onDownloadPress }) => {

  const getFileIconName = (fileType?: string | null): keyof typeof Icon.glyphMap => {
    const type = typeof fileType === 'string' ? fileType.toLowerCase() : '';
    if (type.includes('pdf')) return 'picture-as-pdf';
    if (type.includes('image') || type.includes('jpeg') || type.includes('jpg') || type.includes('png')) return 'image';
    if (type.includes('doc') || type.includes('word')) return 'description';
    if (type.includes('xls') || type.includes('excel')) return 'assessment';
    if (type.includes('ppt') || type.includes('presentation')) return 'slideshow';
    return 'insert-drive-file';
  };

  const formattedUploadDate = () => {
    if (typeof document.uploadDate !== 'string' || !document.uploadDate) {
      return 'N/A';
    }
    try {
      const dateObj = parseISO(document.uploadDate);
      return isValid(dateObj) ? format(dateObj, "MMM dd, yyyy") : document.uploadDate;
    } catch (e) {
      return document.uploadDate;
    }
  };

  const handleCardPress = () => {
    if (onPress) {
      onPress(document);
    } else if (onDownloadPress) { // Fallback to download if no general onPress
      onDownloadPress(document);
    } else {
      // Default action if neither is provided, e.g., view details or download
      Alert.alert("Document Action", `Selected: ${document.fileName}`);
    }
  };

  const handleDownload = (e: any) => {
    e.stopPropagation(); // Prevent card press if icon is tapped
    if (onDownloadPress) {
      onDownloadPress(document);
    } else {
      Alert.alert("Download", `Simulating download for ${document.fileName}`);
    }
  }

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8} style={styles.card}>
      {/* Removed outer View, TouchableOpacity is now the card root */}
        <View style={styles.documentIconContainer}>
          <Icon name={getFileIconName(document.fileType)} size={22} style={styles.documentIcon} />
        </View>
        <View style={styles.textInfoContainer}>
          <Text style={styles.documentName} numberOfLines={1} ellipsizeMode="middle">
            {document.fileName || "Unknown File"}
          </Text>
          <Text style={styles.documentDate}>
            Uploaded: {formattedUploadDate()}
          </Text>
        </View>
        <IconOnlyButton
            icon={<Icon name="file-download" size={24} color={styles.documentIcon.color} />} // Use consistent color
            onPress={handleDownload}
            accessibilityLabel="Download document"
            style={styles.downloadIconContainer} // Apply specific style if needed for positioning/margin
            hitSlop={{top:10, bottom:10, left:10, right:10}} // Make it easier to tap
        />
    </TouchableOpacity>
  );
};

export default DocumentCardV2;
