import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";

import { ThemeContext } from "../../Providers/ThemeProvider";

export const PdfViewerScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme } = useContext(ThemeContext);

  const { pdfUri, title } = route.params || {};
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdfFile = async () => {
      try {
        if (!pdfUri) {
          setError("No PDF file provided.");
          setIsLoading(false);
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(pdfUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setBase64Data(base64);
      } catch (err: any) {
        console.error("Error reading PDF file:", err);
        setError("Failed to load local PDF file.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPdfFile();
  }, [pdfUri]);

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: "application/pdf",
          dialogTitle: title || "Share PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert(
          "Share Unavailable",
          "Sharing is not supported on this device."
        );
      }
    } catch (err) {
      console.error("Error sharing PDF:", err);
    }
  };

  const getHtmlTemplate = (base64Str: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      <style>
        body {
          margin: 0;
          padding: 10px;
          background-color: #525659;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-x: hidden;
        }
        .page-container {
          margin-bottom: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          background-color: white;
          width: 100%;
          max-width: 612px;
        }
        canvas {
          display: block;
          width: 100%;
          height: auto;
        }
        #loading {
          color: white;
          font-family: sans-serif;
          margin-top: 50px;
          font-size: 16px;
          text-align: center;
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    </head>
    <body>
      <div id="loading">Rendering PDF Pages...</div>
      <div id="viewer"></div>

      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        try {
          const base64Data = "${base64Str}";
          const raw = atob(base64Data);
          const rawLength = raw.length;
          const array = new Uint8Array(new ArrayBuffer(rawLength));

          for(let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
          }

          const loadingTask = pdfjsLib.getDocument({ data: array });
          loadingTask.promise.then(function(pdf) {
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.style.display = 'none';

            const viewer = document.getElementById('viewer');
            const numPages = pdf.numPages;

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
              pdf.getPage(pageNum).then(function(page) {
                const viewport = page.getViewport({ scale: 1.5 });
                const container = document.createElement('div');
                container.className = 'page-container';

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                const ratio = window.devicePixelRatio || 1;
                canvas.width = viewport.width * ratio;
                canvas.height = viewport.height * ratio;
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                
                context.scale(ratio, ratio);

                container.appendChild(canvas);
                viewer.appendChild(container);

                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };
                page.render(renderContext);
              });
            }
          }, function(reason) {
            document.getElementById('loading').textContent = 'Failed to compile document: ' + reason.message;
          });
        } catch (e) {
          document.getElementById('loading').textContent = 'Base64 decoding failed: ' + e.message;
        }
      </script>
    </body>
    </html>
    `;
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: title || "PDF Viewer",
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: 10 }}>
          <Ionicons
            name="share-social-outline"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, pdfUri, title, theme]);

  if (isLoading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[
            styles.statusText,
            { color: theme.colors.textSecondary, marginTop: 10 },
          ]}
        >
          Opening Document...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: theme.colors.background, padding: 20 },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.error || "#EF4444"}
        />
        <Text
          style={[
            styles.errorText,
            { color: theme.colors.text, marginTop: 12 },
          ]}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: theme.colors.primary, marginTop: 20 },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#525659" }]}>
      {base64Data ? (
        <WebView
          source={{ html: getHtmlTemplate(base64Data) }}
          style={styles.webView}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: "#525659",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export default PdfViewerScreen;
