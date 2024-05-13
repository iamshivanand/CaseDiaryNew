import { RouteProp } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { Button, View, TouchableOpacity, Text, FlatList } from "react-native";

import uploadFile, { checkFileExists, getFormsAsync } from "../../DataBase"; // Import the uploadFile function
import { RootStackParamList } from "../../Types/navigationtypes";
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen";

interface Props {
  update?: boolean;
  initialValues?: CaseDetails;
  route: RouteProp<RootStackParamList, "Documents">;
}

const DocumentUpload: React.FC<Props> = ({ route }) => {
  const { update, uniqueId } = route?.params;
  const [documentUri, setDocumentUri] = useState(null);
  const [document, setDocument] = useState();
  const [documentData, setDocumentData] = useState();

  console.log("Documents", document);
  const handleDocumentPick = async () => {
    try {
      const document = await DocumentPicker.getDocumentAsync({});
      console.log("heloo the DOCUMENT IS ", document);

      if (!document.canceled) {
        setDocumentUri(document.assets[0].uri);
        let fileContent;
        try {
          fileContent = await FileSystem.readAsStringAsync(
            document.assets[0].uri,
            {
              encoding: FileSystem.EncodingType.UTF8,
            }
          );
          setDocumentData(fileContent);
        } catch (error) {
          console.error("Error reading file:", error);
          return;
        }

        // Process the file content (e.g., parse JSON, display text)
        // console.log(`File name: ${name}`);
        console.log(`File content: ${fileContent}`);
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const handleUploadDocument = async () => {
    if (documentUri) {
      try {
        const fileName = `document_${uniqueId}`; // Generate a unique file name based on caseId
        const fileType = documentUri.split(".").pop(); // Get the file type from the uri
        const fileUri = documentUri;
        const copyToFilesystem = true;
        const folderName = "documents"; // Folder name to save the document

        const uploadedFilePath = await uploadFile({
          fileName,
          fileType,
          fileUri,
          copyToFilesystem,
          folderName,
          uniqueId,
          documentData,
        });

        // Here you can save the uploadedFilePath to the SQLite database along with the caseId
        // Example: saveToDatabase(uploadedFilePath, caseId);

        console.log("Document uploaded and saved to:", uploadedFilePath);
      } catch (error) {
        console.error("Error uploading document:", error);
      }
    } else {
      console.warn("No document selected.");
    }
  };

  const handleOpenDocument = async (documentUri) => {
    checkFileExists(documentUri)
      .then((exists) => {
        if (exists) {
          console.log("File exists.");
          openDocument(documentUri);
        } else {
          console.log("File does not exist.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    // try {
    //   // Open the document based on its file type
    //   await Linking.openURL(documentUri);
    //   //   if (fileType === "pdf") {
    //   //     // Open PDF document with default viewer

    //   //   } else {
    //   //     console.log("Unsupported file type:", fileType);
    //   //   }
    // } catch (error) {
    //   console.error("Error opening document:", error);
    // }
  };
  const openDocument = async (filePath: string) => {
    try {
      const fileUri = filePath;
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await Linking.openURL(contentUri);
    } catch (error) {
      console.error("Error opening document:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Fetch the list of documents when the component mounts
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Open the SQLite database
      const fetchedDocuments = await getFormsAsync(global.db); // Fetch documents from the database
      console.log("Fetched Documents", fetchedDocuments);
      setDocument(fetchedDocuments._array); // Set the documents state with the fetched documents
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };
  const renderDocumentItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleOpenDocument(item?.DocumentPath)}>
      <Text>{item?.DocumentPath}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <Button title="Pick Document" onPress={handleDocumentPick} />
      <Button title="Upload Document" onPress={handleUploadDocument} />
      <Text>List of Documents:</Text>
      <FlatList
        data={document}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item?.id?.toString()}
      />
    </View>
  );
};

export default DocumentUpload;
