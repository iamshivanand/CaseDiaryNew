import React, { useContext } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../Providers/ThemeProvider";
import ActionButton from "./ActionButton";

interface UpdateCheckModalProps {
  visible: boolean;
  onClose?: () => void;
  forceUpdate: boolean;
  playStoreUrl: string;
  appStoreUrl: string;
  releaseNotes?: string;
  latestVersion: string;
}

const UpdateCheckModal: React.FC<UpdateCheckModalProps> = ({
  visible,
  onClose,
  forceUpdate,
  playStoreUrl,
  appStoreUrl,
  releaseNotes = "We have added security patches and compatibility fixes for the latest OS versions.",
  latestVersion,
}) => {
  const { theme } = useContext(ThemeContext);

  const handleUpdatePress = () => {
    const storeUrl = Platform.OS === "ios" ? appStoreUrl : playStoreUrl;
    if (storeUrl) {
      Linking.openURL(storeUrl).catch((err) =>
        console.error("Failed to open store URL:", err)
      );
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        if (!forceUpdate && onClose) {
          onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface || "#FFFFFF" },
          ]}
        >
          {/* Header Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primaryLight || "#DBEAFE" },
            ]}
          >
            <Icon
              name={forceUpdate ? "alert-decagram-outline" : "rocket-launch-outline"}
              size={44}
              color={theme.colors.primary || "#1E40AF"}
            />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: theme.colors.text || "#111827" },
            ]}
          >
            {forceUpdate ? "Update Required" : "Update Available"}
          </Text>

          {/* Subtitle */}
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textSecondary || "#4B5563" },
            ]}
          >
            {forceUpdate
              ? "A critical version of CaseDiary is available. You need to update the application to maintain compatibility and continue using it."
              : `A new version (${latestVersion}) of CaseDiary is available on the store. Update now to access the latest features!`}
          </Text>

          {/* Release Notes */}
          <View
            style={[
              styles.notesContainer,
              { backgroundColor: theme.colors.background || "#F3F4F6" },
            ]}
          >
            <Text
              style={[
                styles.notesTitle,
                { color: theme.colors.text || "#111827" },
              ]}
            >
              What's New:
            </Text>
            <ScrollView
              style={styles.notesScroll}
              contentContainerStyle={styles.notesScrollContent}
              showsVerticalScrollIndicator
            >
              <Text
                style={[
                  styles.notesText,
                  { color: theme.colors.textSecondary || "#4B5563" },
                ]}
              >
                {releaseNotes}
              </Text>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!forceUpdate && onClose && (
              <ActionButton
                title="Later"
                type="secondary"
                onPress={onClose}
                style={styles.actionButton}
              />
            )}
            <ActionButton
              title="Update Now"
              type="primary"
              onPress={handleUpdatePress}
              style={[
                styles.actionButton,
                forceUpdate ? { flex: 1, width: "100%" } : {},
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    maxHeight: "80%",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  notesContainer: {
    width: "100%",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    maxHeight: 120,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  notesScroll: {
    maxHeight: 80,
  },
  notesScrollContent: {
    paddingBottom: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
  },
});

export default UpdateCheckModal;
