import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import FormInput from './FormInput';
import { CaseData } from '../../Types/appTypes'; // For fieldName type
import { HomeStackParamList } from '../../Types/navigationtypes'; // For returnScreen type

interface FormInputWithScanProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  fieldName: keyof CaseData;
  // Optional: specify the return screen if it can vary, otherwise default in component
  returnScreen?: keyof HomeStackParamList;
}

const FormInputWithScan: React.FC<FormInputWithScanProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  numberOfLines = 4,
  style,
  inputStyle,
  fieldName,
  returnScreen = 'AddCase', // Default return screen
}) => {
  const navigation = useNavigation();

  const openDocumentCaptureScreen = () => {
    // @ts-ignore TODO: Fix navigation types for HomeStackParamList if not already covering this
    navigation.navigate('DocumentCaptureScreen', {
      fieldName: fieldName,
      currentText: value || '',
      returnScreen: returnScreen,
    });
  };

  return (
    <View style={[styles.fieldContainer, style]}>
      <FormInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        multiline={multiline}
        numberOfLines={numberOfLines}
        // Remove FormInput's own bottom margin if it has one, as fieldContainer handles it
        style={ { marginBottom: 0 } }
        inputStyle={inputStyle}
      />
      <TouchableOpacity onPress={openDocumentCaptureScreen} style={styles.scanButton}>
        <MaterialIcons name="description" size={20} color="#007AFF" />
        <Text style={styles.scanButtonText}>Scan Document</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 15, // Standard margin for a form field group
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#e7f0ff',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    marginTop: -5,
    borderTopWidth: 1,
    borderTopColor: '#cce0ff',
    alignSelf: 'flex-start',
  },
  scanButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FormInputWithScan;
