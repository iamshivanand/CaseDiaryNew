import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Button, List, Text, useTheme, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { useTranslation } from '../../Providers/LanguageProvider';

import * as db from '../../DataBase'; // Corrected import
import { CaseDocument } from '../../DataBase/schema';

export type DocumentUploadRouteParams = {
  caseId?: number; // For existing cases
};

type DocumentUploadScreenRouteProp = RouteProp<{ Documents: DocumentUploadRouteParams }, 'Documents'>;

const DocumentUpload: React.FC<{ caseId: number }> = ({ caseId }) => {
  const theme = useTheme();
  const { t } = useTranslation();

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
      Alert.alert(t("alert_error"), t("doc_err_load"));
    } finally {
      setLoading(false);
    }
  }, [caseId, t]);

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
        Alert.alert(t("alert_error"), t("doc_err_uri"));
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
        Alert.alert(t("alert_success"), t("doc_success_upload"));
        loadDocuments(); // Refresh list
      } else {
        Alert.alert(t("alert_error"), t("doc_err_upload"));
      }
    } catch (error) {
      console.error("Error picking or uploading document:", error);
      Alert.alert(t("alert_error"), t("doc_err_upload_general"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t("alert_error"), "Permission to access camera was denied.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert(t("alert_error"), t("doc_err_uri"));
        return;
      }

      setIsUploading(true);

      const timestamp = Date.now();
      const fileName = asset.fileName || `photo_${timestamp}.jpg`;
      const fileType = asset.mimeType || 'image/jpeg';

      const uploadedDocId = await db.uploadCaseDocument({
        originalFileName: fileName,
        fileType: fileType,
        fileUri: asset.uri,
        caseId: caseId,
        userId: MOCK_CURRENT_USER_ID,
        fileSize: asset.fileSize || null,
      });

      if (uploadedDocId) {
        Alert.alert(t("alert_success"), t("doc_success_upload"));
        loadDocuments();
      } else {
        Alert.alert(t("alert_error"), t("doc_err_upload"));
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert(t("alert_error"), "Failed to capture or upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDocument = async (doc: CaseDocument) => {
    if (!doc.stored_filename) {
      Alert.alert(t("alert_error"), t("doc_err_path"));
      return;
    }
    const localUri = db.getFullDocumentPath(doc.stored_filename);
    if (!localUri) {
      Alert.alert(t("alert_error"), t("doc_err_construct_path"));
      return;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        Alert.alert(t("alert_error"), t("doc_err_not_exist"));
        return;
      }

      await Sharing.shareAsync(localUri, {
        mimeType: doc.file_type || '*/*',
        dialogTitle: t("doc_dialog_title"),
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      Alert.alert(t("alert_error"), t("doc_err_download"));
    }
  };

  const renderItem = ({ item }: { item: CaseDocument }) => (
    <List.Item
      title={item.original_display_name}
      description={`${t("doc_info_type")}: ${item.file_type || 'N/A'}, ${t("doc_info_size")}: ${item.file_size ? (item.file_size / 1024).toFixed(2) + ' KB' : 'N/A'}`}
      titleStyle={{ color: theme.colors.onSurface }}
      descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      left={props => <List.Icon {...props} icon={ item.file_type?.startsWith('image') ? "file-image-outline" : "file-document-outline"} />}
      right={props => (
        <IconButton
          {...props}
          icon="download"
          onPress={() => handleDownloadDocument(item)}
        />
      )}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 4, marginVertical: 4 }}>
        <Button
          mode="contained"
          onPress={handlePickAndUploadDocument}
          style={{ flex: 1, marginRight: 4, justifyContent: 'center' }}
          icon="file-document-outline"
          loading={isUploading}
          disabled={isUploading}
          labelStyle={{ fontSize: 12 }}
        >
          {t("doc_btn_add")}
        </Button>
        <Button
          mode="contained"
          onPress={handleCameraCapture}
          style={{ flex: 1, marginLeft: 4, backgroundColor: '#8B5CF6', justifyContent: 'center' }}
          icon="camera"
          loading={isUploading}
          disabled={isUploading}
          labelStyle={{ fontSize: 12 }}
        >
          {t("doc_btn_capture")}
        </Button>
      </View>
      {loading && documents.length === 0 ? (
        <ActivityIndicator animating={true} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={documents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>{t("doc_no_documents")}</Text> : null
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
