import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Button, List, Text, useTheme, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';

import * as db from '../../DataBase'; // Corrected import
import { CaseDocument } from '../../DataBase/schema';
// Assuming RootStackParamList is correctly defined in your types
// For AddCaseDetails flow, uniqueId is passed. We need caseId for existing cases.
// The screen should ideally receive caseId if the case exists, or uniqueId if it's a new case.
// Let's adjust props to reflect this possibility.
export type DocumentUploadRouteParams = {
  caseId?: number; // For existing cases
};

type DocumentUploadScreenRouteProp = RouteProp<{ Documents: DocumentUploadRouteParams }, 'Documents'>;

const DocumentUpload: React.FC<{ caseId: number }> = ({ caseId }) => {
  const theme = useTheme();

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Mock user ID, replace with actual auth data when available
  const MOCK_CURRENT_USER_ID = 1;

  const loadDocuments = useCallback(async () => {
    if (!caseId) { // If no caseId, it's a new case, no documents to load from DB yet
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const docs = await db.getCaseDocuments(caseId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      Alert.alert("Error", "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const handlePickAndUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types, or specify (e.g., 'application/pdf', 'image/*')
        copyToCacheDirectory: true, // Important for expo-file-system to access it reliably
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert("Error", "Could not get document URI.");
        return;
      }

      setIsUploading(true);

      // Determine fileType more reliably if possible, asset.mimeType might be good
      const fileType = asset.mimeType || asset.name?.split('.').pop() || 'unknown';

      const uploadedDocId = await db.uploadCaseDocument({
        originalFileName: asset.name || `document_${Date.now()}`,
        fileType: fileType,
        fileUri: asset.uri, // Use asset.uri which is a local cache URI
        caseId: caseId,
        userId: MOCK_CURRENT_USER_ID, // Pass current user ID
        fileSize: asset.size,
      });

      if (uploadedDocId) {
        Alert.alert("Success", "Document uploaded.");
        loadDocuments(); // Refresh list
      } else {
        Alert.alert("Error", "Failed to upload document.");
      }
    } catch (error) {
      console.error("Error picking or uploading document:", error);
      Alert.alert("Error", "An error occurred during document upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeleteDocument = (doc: CaseDocument) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${doc.original_display_name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDeleteDocument(doc.id) }
      ]
    );
  };

  const handleDeleteDocument = async (documentId: number) => {
    setLoading(true); // Or a specific deleting loader
    try {
      const success = await db.deleteCaseDocument(documentId);
      if (success) {
        Alert.alert("Success", "Document deleted.");
        loadDocuments(); // Refresh list
      } else {
        Alert.alert("Error", "Failed to delete document.");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      Alert.alert("Error", "Could not delete document.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = async (doc: CaseDocument) => {
    if (!doc.stored_filename) {
        Alert.alert("Error", "Document path not found.");
        return;
    }
    const localUri = db.getFullDocumentPath(doc.stored_filename);
    if (!localUri) {
         Alert.alert("Error", "Could not construct document path.");
        return;
    }

    try {
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
            Alert.alert("Error", "File does not exist at the specified path. It might have been moved or deleted.");
            return;
        }

        const contentUri = await FileSystem.getContentUriAsync(localUri);

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: doc.file_type || '*/*', // MIME type
        });
    } catch (error) {
        console.error("Error opening document:", error);
        Alert.alert("Error", "Could not open document. Ensure you have an app that can open this file type.");
    }
  };


  const renderItem = ({ item }: { item: CaseDocument }) => (
    <List.Item
      title={item.original_display_name}
      description={`Type: ${item.file_type || 'N/A'}, Size: ${item.file_size ? (item.file_size / 1024).toFixed(2) + ' KB' : 'N/A'}`}
      titleStyle={{ color: theme.colors.onSurface }}
      descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      left={props => <List.Icon {...props} icon={ item.file_type?.startsWith('image') ? "file-image-outline" : "file-document-outline"} />}
      right={props => (
        <IconButton
          {...props}
          icon="delete-outline"
          iconColor={theme.colors.error}
          onPress={() => confirmDeleteDocument(item)}
        />
      )}
      onPress={() => handleOpenDocument(item)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Button
        mode="contained"
        onPress={handlePickAndUploadDocument}
        style={styles.addButton}
        icon="plus"
        loading={isUploading}
        disabled={isUploading}
      >
        Add Document
      </Button>
      {loading && documents.length === 0 ? (
        <ActivityIndicator animating={true} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={documents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>No Documents Yet</Text> : null
          }
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  addButton: {
    margin: 8,
  },
  noticeText: {
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  listContentContainer: {
    flexGrow: 1, // Ensures ListEmptyComponent is centered if list is empty
  }
});

export default DocumentUpload;
