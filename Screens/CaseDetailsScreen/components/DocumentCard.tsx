// Screens/CaseDetailsScreen/components/DocumentCard.tsx
import React, { useContext } from 'react'; // Added useContext
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDocumentCardStyles } from './DocumentCardStyle'; // Import function
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path
import { Document } from '../../../Types/appTypes';
import { format, parseISO, isValid } from 'date-fns';
import IconOnlyButton from '../../CommonComponents/IconOnlyButton';

interface DocumentCardProps {
  document: Document;
  onPress?: (document: Document) => void;
  onDownloadPress?: (document: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPress, onDownloadPress }) => {
  const { theme } = useContext(ThemeContext); // Get theme
  const styles = getDocumentCardStyles(theme); // Generate styles

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
    } else if (onDownloadPress) {
      onDownloadPress(document);
    } else {
      Alert.alert("Document Action", `Selected: ${document.fileName}`);
    }
  };

  const handleDownload = (e: any) => {
    e.stopPropagation();
    if (onDownloadPress) {
      onDownloadPress(document);
    } else {
      Alert.alert("Download", `Simulating download for ${document.fileName}`);
    }
  }

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8} style={styles.card}>
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
            icon={<Icon name="file-download" size={24} color={styles.documentIcon.color} />}
            onPress={handleDownload}
            accessibilityLabel="Download document"
            style={styles.downloadIconContainer}
            hitSlop={{top:10, bottom:10, left:10, right:10}}
        />
    </TouchableOpacity>
  );
};

export default DocumentCard; // Renamed export
