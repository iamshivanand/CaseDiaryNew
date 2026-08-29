import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  BackHandler,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { ThemeContext } from "../../Providers/ThemeProvider";
import { shareNamedPdf } from "../../utils/fileShareHelper";

export const PdfViewerScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  const { pdfUri, title, returnToDraftsHub, draftsHubParams, returnToCaseId } =
    route.params || {};
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = title || "PDF Document";

  const handleNavigateBack = useCallback(() => {
    if (returnToCaseId) {
      navigation.navigate("CaseDetails", {
        caseId: Number(returnToCaseId),
        scrollToDocs: true,
      });
    } else if (returnToDraftsHub) {
      navigation.navigate("DraftsHub", draftsHubParams || {});
    } else {
      navigation.goBack();
    }
  }, [navigation, returnToCaseId, returnToDraftsHub, draftsHubParams]);

  useEffect(() => {
    const backAction = () => {
      handleNavigateBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [handleNavigateBack]);

  const handleShare = async () => {
    try {
      if (pdfUri) {
        await shareNamedPdf(pdfUri, displayTitle, `Share ${displayTitle}`);
      } else {
        Alert.alert("Share Unavailable", "No PDF file available to share.");
      }
    } catch (err) {
      console.error("Error sharing PDF:", err);
    }
  };

  const handlePrint = async () => {
    try {
      if (pdfUri) {
        await Print.printAsync({ uri: pdfUri });
      } else {
        Alert.alert("Print Unavailable", "No PDF file available to print.");
      }
    } catch (err) {
      console.error("Error printing PDF:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadPdfFile = async () => {
      try {
        if (!pdfUri) {
          if (isMounted) setError("No PDF file provided.");
          return;
        }

        let fileUri = pdfUri;
        if (!fileUri.startsWith("file://") && !fileUri.startsWith("content://")) {
          fileUri = `file://${fileUri}`;
        }

        // On Android content URIs, copy to cache to ensure read access
        if (Platform.OS === "android" && fileUri.startsWith("content://")) {
          const cacheDest = `${FileSystem.cacheDirectory}view_temp_${Date.now()}.pdf`;
          await FileSystem.copyAsync({ from: fileUri, to: cacheDest });
          fileUri = cacheDest;
        }

        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (isMounted) {
          setBase64Data(base64);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Error loading PDF base64:", err);
        if (isMounted) {
          setError(
            `Could not open PDF. The file may be missing or corrupt.\n\nDetails: ${err.message}`
          );
          setIsLoading(false);
        }
      }
    };

    loadPdfFile();
    return () => {
      isMounted = false;
    };
  }, [pdfUri]);

  const getHtmlTemplate = (base64: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
      <style>
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          padding: 8px 0 24px 0; 
          background-color: #383a3c; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .page-container {
          margin-bottom: 12px;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border-radius: 4px;
          overflow: hidden;
          max-width: 100%;
        }
        canvas { 
          display: block; 
          width: 100% !important; 
          height: auto !important; 
        }
        #loading { 
          color: #f1f5f9; 
          text-align: center; 
          margin-top: 50px; 
          font-size: 15px; 
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div id="loading">Rendering document...</div>
      <div id="viewer"></div>

      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        
        try {
          var pdfData = atob("${base64}");
          var loadingTask = pdfjsLib.getDocument({ data: pdfData });
          
          loadingTask.promise.then(function(pdf) {
            document.getElementById('loading').style.display = 'none';
            var viewer = document.getElementById('viewer');
            
            for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              (function(num) {
                pdf.getPage(num).then(function(page) {
                  var viewport = page.getViewport({ scale: 1.5 });
                  var container = document.createElement('div');
                  container.className = 'page-container';
                  
                  var canvas = document.createElement('canvas');
                  var context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  
                  container.appendChild(canvas);
                  viewer.appendChild(container);
                  
                  var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                  };
                  page.render(renderContext);
                });
              })(pageNum);
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

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.colors.background }]}>
      {/* Unified In-Screen Header with Safe Area Insets */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.cardBackground,
            borderBottomColor: theme.colors.border,
            paddingTop: Math.max(insets.top, Platform.OS === "android" ? 10 : 0),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={handleNavigateBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            style={[styles.headerTitleText, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayTitle}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handlePrint}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="print-outline" size={21} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="share-social-outline"
              size={21}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.statusText,
              { color: theme.colors.textSecondary, marginTop: 12 },
            ]}
          >
            Opening Document...
          </Text>
        </View>
      ) : error ? (
        <View style={[styles.centered, { backgroundColor: theme.colors.background, padding: 24 }]}>
          <Ionicons
            name="alert-circle-outline"
            size={52}
            color={theme.colors.danger || "#EF4444"}
          />
          <Text
            style={[
              styles.errorText,
              { color: theme.colors.text, marginTop: 14 },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: theme.colors.primary, marginTop: 24 },
            ]}
            onPress={handleNavigateBack}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : base64Data ? (
        <WebView
          source={{ html: getHtmlTemplate(base64Data) }}
          style={styles.webView}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit
        />
      ) : null}
    </View>
  );
};

export default PdfViewerScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  headerBackBtn: {
    padding: 6,
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 8,
    justifyContent: "center",
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerActionBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  webView: {
    flex: 1,
    backgroundColor: "#383a3c",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 8,
    elevation: 2,
  },
  backBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
