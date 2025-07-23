import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import Popup from '../CommonComponents/Popup';

const TemplateFormScreen = ({ route, navigation }) => {
  const { template } = route.params;
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [fileName, setFileName] = useState('');

  const createPDF = async () => {
    if (!fileName) {
      Alert.alert('File name is required');
      return;
    }

    const html = `
      <h1>${template.name}</h1>
      <p>Field 1: ${field1}</p>
      <p>Field 2: ${field2}</p>
    `;

    try {
      const options = {
        html,
        fileName: fileName,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('PDF Created', `PDF created at ${file.filePath}`);
      setPopupVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create PDF');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{template.name}</Text>
      <TextInput
        style={styles.input}
        placeholder="Field 1"
        value={field1}
        onChangeText={setField1}
      />
      <TextInput
        style={styles.input}
        placeholder="Field 2"
        value={field2}
        onChangeText={setField2}
      />
      <Button title="Save" onPress={() => setPopupVisible(true)} />
      <Popup
        visible={isPopupVisible}
        onClose={() => setPopupVisible(false)}
      >
        <Text style={styles.popupHeader}>Save Document</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter file name"
          value={fileName}
          onChangeText={setFileName}
        />
        <Button title="Save to App" onPress={createPDF} />
        <Button title="Link to Case" onPress={createPDF} />
      </Popup>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  popupHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default TemplateFormScreen;
