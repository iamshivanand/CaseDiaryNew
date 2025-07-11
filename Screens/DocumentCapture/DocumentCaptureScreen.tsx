import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { Camera, useCameraDevice, PhotoFile, CameraPermissionStatus } from 'react-native-vision-camera';


import { HomeStackParamList } from '../../Types/navigationtypes'; // Adjust if your param list is different
import { CaseData } from '../../Types/appTypes'; // For fieldName type

type DocumentCaptureScreenRouteProp = RouteProp<HomeStackParamList, 'DocumentCaptureScreen'>; // Ensure this is in HomeStackParamList

interface CapturedImage {
  uri: string;
  path?: string; // VisionCamera PhotoFile has a path property
  width?: number;
  height?: number;
}

const DocumentCaptureScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DocumentCaptureScreenRouteProp>();
  const { fieldName, currentText: initialText, returnScreen } = route.params;

  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isLoadingOcr, setIsLoadingOcr] = useState<boolean>(false);
  const [showCameraView, setShowCameraView] = useState<boolean>(false); // To toggle camera
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus | null>(null);

  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    // Check initial camera permission status
    Camera.getCameraPermissionStatus().then(setCameraPermission);
  }, []);

  const requestCameraPermission = async (): Promise<boolean> => {
    console.log('Requesting camera permission...');
    const permissionStatus = await Camera.requestCameraPermission();
    setCameraPermission(permissionStatus);
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos. Please enable it in settings.');
      console.log('Camera permission denied.');
      return false;
    }
    console.log('Camera permission granted.');
    return true;
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    // For Android, READ_EXTERNAL_STORAGE is needed for document picker for older APIs
    // For newer APIs (SDK 33+), READ_MEDIA_IMAGES might be needed.
    // For simplicity, let's use CAMERA permission as a gate for VisionCamera which might store temp files.
    // DocumentPicker itself handles its own permission needs on modern Android for scoped storage.
    if (Platform.OS === 'android') {
        const permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE; // Or specific media for SDK 33+
        // const status = await request(permission);
        // if (status !== RESULTS.GRANTED) {
        //   Alert.alert('Permission Denied', 'Storage permission is required to upload documents.');
        //   return false;
        // }
        // For now, let document picker handle its own permissions.
    }
    return true; // Assume granted for non-Android or let picker handle
  };


  const handleTakePhoto = async () => {
    if (cameraPermission !== 'granted') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
    }
    if (!device) {
      Alert.alert('Error', 'No camera device found.');
      return;
    }
    setShowCameraView(true);
    setCapturedImage(null); // Clear previous image
    setRecognizedText(''); // Clear previous OCR
  };

  const onCapturePhotoPressed = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'quality', // Or 'speed' or 'balanced'
          flash: 'off', // 'on', 'auto'
          enableShutterSound: true,
        });
        console.log('Photo captured:', photo);
        // VisionCamera returns path with file:// prefix already
        setCapturedImage({ uri: photo.path, path: photo.path, width: photo.width, height: photo.height });
        setShowCameraView(false);
      } catch (e) {
        console.error('Failed to take photo:', e);
        Alert.alert('Camera Error', 'Failed to capture photo.');
        setShowCameraView(false);
      }
    }
  };

  const handleUploadDocument = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    try {
      const pickerResult = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images], // Initially focus on images
        // To include PDFs: [DocumentPicker.types.images, DocumentPicker.types.pdf]
        // copyTo: 'cachesDirectory', // Optional: manage file lifecycle
      });
      console.log('Picked document:', pickerResult);
      setCapturedImage({ uri: pickerResult.uri, width: 0, height: 0 }); // width/height might be available from pickerResult for images
      setRecognizedText(''); // Clear previous OCR results
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled document picker');
      } else {
        console.error('Error picking document:', err);
        Alert.alert('Error', 'Failed to pick document.');
      }
    }
  };

  const handleClearImage = () => {
    setCapturedImage(null);
    setRecognizedText('');
  };

  const handleExtractText = async () => {
    if (!capturedImage) {
      Alert.alert('No Image', 'Please capture or upload an image first.');
      return;
    }
    setIsLoadingOcr(true);
    setRecognizedText(''); // Clear previous/set to loading state
    let processedImagePath = capturedImage.uri;

    try {
      if (Platform.OS === 'android' && capturedImage.uri.startsWith('content://')) {
        // Ideally, copy to a local cache file using react-native-fs here
        // For now, we'll log and alert, as ML Kit might not handle content URIs directly.
        console.warn('Attempting OCR with content:// URI on Android. This may fail without file copying. URI:', capturedImage.uri);
        Alert.alert(
          'Potential Issue',
          'Processing a directly selected file on Android. If OCR fails, try taking a photo instead or ensure the app has broad file access (this may require specific permissions or a file copy step not yet implemented).'
        );
        // ML Kit might still work with some content URIs if they resolve to accessible files,
        // but it's not guaranteed. A robust solution involves copying to app's cache.
        // processedImagePath remains capturedImage.uri for this attempt
      } else if (!capturedImage.uri.startsWith('file://')) {
        processedImagePath = `file://${capturedImage.uri}`;
      }

      console.log('Processing OCR for image path:', processedImagePath);
      const result = await TextRecognition.recognize(processedImagePath);

      if (result && result.text.trim()) {
        setRecognizedText(result.text);
      } else {
        setRecognizedText(''); // Clear if no text found
        Alert.alert('OCR Result', 'No text recognized. Please ensure the image is clear and contains text.');
      }
    } catch (error: any) {
      console.error('OCR Error:', error);
      Alert.alert('OCR Error', `Failed to recognize text: ${error.message || 'An unknown error occurred'}`);
      setRecognizedText(''); // Clear on error
    } finally {
      setIsLoadingOcr(false);
    }
  };

  const handleUseText = () => {
    if (navigation.canGoBack()) {
      // @ts-ignore // TODO: Fix navigation types for params
      navigation.navigate({
        name: returnScreen || 'AddCase', // Default to AddCase if not specified
        params: { recognizedText, fieldName },
        merge: true,
      });
    }
  };

  // This will be the actual camera view component render logic
  // if (showCameraView && device) {
  //   return (
  //     <View style={styles.fullScreen}>
  //       <Camera
  //         ref={cameraRef}
  //         style={StyleSheet.absoluteFill}
  //         device={device}
  //         isActive={true}
  //         photo={true}
  //       />
  //       <TouchableOpacity style={styles.captureButton} onPress={onCapturePhotoPressed} />
  //       <TouchableOpacity style={styles.cameraBackButton} onPress={() => setShowCameraView(false)}>
  //         <Text style={styles.buttonText}>Back</Text>
  //       </TouchableOpacity>
  if (showCameraView) {
    if (!device) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>No camera device found or permission not granted.</Text>
          <TouchableOpacity style={[styles.button, styles.cameraNavButton]} onPress={() => setShowCameraView(false)}>
            <Text style={styles.buttonText}>Back to Options</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.fullScreen}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true} // Enable photo capture
        />
        <View style={styles.cameraControlsContainer}>
            <TouchableOpacity style={styles.cameraNavButton} onPress={() => setShowCameraView(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={onCapturePhotoPressed}>
                 {/* You can use an Icon here */}
            </TouchableOpacity>
            <View style={{width: 70}} /> {/* Spacer */}
        </View>
      </View>
    );
  }

  // Main screen UI when not in camera view
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Import Text from Document</Text>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={handleTakePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={handleUploadDocument}>
          <Text style={styles.buttonText}>Upload Image</Text>
        </TouchableOpacity>
      </View>

      {capturedImage && (
        <View style={styles.previewContainer}>
          <Text style={styles.subHeader}>Preview:</Text>
          <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.imageActionsContainer}>
            <TouchableOpacity style={[styles.button, styles.imageActionButton, styles.clearButton]} onPress={handleClearImage}>
              <Text style={styles.buttonText}>Clear Image</Text>
            </TouchableOpacity>
            {/* Consider adding a retake button that calls handleTakePhoto again */}
          </View>
          <TouchableOpacity
            style={[styles.button, styles.extractButton, isLoadingOcr && styles.buttonDisabled]}
            onPress={handleExtractText}
            disabled={isLoadingOcr || !capturedImage}
          >
            {isLoadingOcr ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Extract Text</Text>}
          </TouchableOpacity>
        </View>
      )}

      { (recognizedText || isLoadingOcr) && ( // Show this section if OCR is loading or text is present
        <View style={styles.ocrResultContainer}>
          <Text style={styles.subHeader}>Recognized Text (Editable):</Text>
          <TextInput
            style={styles.textInputOcr}
            multiline
            value={isLoadingOcr ? "Processing..." : recognizedText}
            onChangeText={setRecognizedText}
            editable={!isLoadingOcr}
            placeholder="Text will appear here after OCR"
          />
        </View>
      )}

      <View style={styles.footerButtonsContainer}>
        <TouchableOpacity style={[styles.button, styles.footerButton, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.button, styles.footerButton, styles.useTextButton, (!recognizedText || isLoadingOcr) && styles.buttonDisabled]}
            onPress={handleUseText}
            disabled={!recognizedText || isLoadingOcr} // Disable if no text or still loading
        >
          <Text style={styles.buttonText}>Use This Text</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButton: {
    backgroundColor: '#007AFF', // Blue
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
    borderRadius: 8,
  },
  imageActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  imageActionButton: {
    backgroundColor: '#5bc0de', // Info blue
    flex: 1,
    marginHorizontal: 5,
  },
  clearButton: {
    backgroundColor: '#d9534f', // Red
  },
  extractButton: {
    backgroundColor: '#5cb85c', // Green
    width: '100%',
  },
  ocrResultContainer: {
    marginBottom: 20,
  },
  textInputOcr: {
    backgroundColor: 'white',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 150,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopColor: '#e0e0e0',
    borderTopWidth: 1,
    paddingTop: 20,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#777', // Grey
  },
  useTextButton: {
    backgroundColor: '#0275d8', // Primary blue
  },
  fullScreen: {
    flex: 1,
    backgroundColor: 'black', // Fallback if camera isn't active
  },
  cameraControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'grey',
  },
  cameraNavButton: {
    backgroundColor: 'transparent',
    padding: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
  }
});

export default DocumentCaptureScreen;
