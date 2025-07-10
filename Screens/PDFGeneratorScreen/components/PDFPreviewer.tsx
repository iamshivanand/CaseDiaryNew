import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path as needed

interface PDFPreviewerProps {
  htmlContent: string | null; // Allow null for when no content is ready
  theme: any; // Replace 'any' with your actual Theme type
}

const PDFPreviewer: React.FC<PDFPreviewerProps> = ({ htmlContent, theme }) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1, // Make it flexible if it's meant to take significant space
      minHeight: 300, // Ensure it has a decent minimum height for preview
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      overflow: 'hidden', // Important for webview content to respect border radius
      backgroundColor: theme.colors.card, // Background for the area
    },
    webview: {
      flex: 1,
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    placeholderText: {
      color: theme.colors.textMuted || '#888',
      textAlign: 'center',
      fontSize: 14,
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject, // Cover the parent view
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent overlay
    },
  });

  if (!htmlContent) {
    return (
      <View style={[styles.container, styles.placeholderContainer]}>
        <Text style={styles.placeholderText}>
          Select a template and enter details to see a preview.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        // onError={(syntheticEvent) => {
        //   const { nativeEvent } = syntheticEvent;
        //   console.warn('WebView error: ', nativeEvent);
        //   // Optionally, show an error message in the preview area
        // }}
        // onHttpError={(syntheticEvent) => {
        //   const { nativeEvent } = syntheticEvent;
        //   console.warn(
        //     'WebView HTTP error: ',
        //     nativeEvent.url,
        //     nativeEvent.statusCode,
        //     nativeEvent.description,
        //   );
        // }}
      />
    </View>
  );
};

export default PDFPreviewer;
