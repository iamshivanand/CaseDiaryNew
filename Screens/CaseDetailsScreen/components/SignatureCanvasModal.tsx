// Screens/CaseDetailsScreen/components/SignatureCanvasModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

import { Theme } from "../../../Providers/ThemeProvider";

interface SignatureCanvasModalProps {
  visible: boolean;
  theme: Theme;
  onSelectSignature: (imageUri: string) => void;
  onClose: () => void;
}

// Pre-bundled or mock advocate signature stamps
const SAMPLE_SIGNATURE_STAMPS = [
  {
    id: "stamp_1",
    title: "Advocate Seal & Signature",
    dataUri:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='70'><rect width='200' height='70' fill='none' stroke='%231d4ed8' stroke-width='2' rx='4'/><text x='10' y='30' font-family='Arial' font-size='14' font-weight='bold' fill='%231d4ed8'>ADVOCATE ON RECORD</text><text x='10' y='50' font-family='Courier' font-size='12' fill='%231d4ed8'>[ Signed Digital Stamp ]</text></svg>",
  },
  {
    id: "stamp_2",
    title: "Notary Public Verification",
    dataUri:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='70'><rect width='200' height='70' fill='none' stroke='%23b91c1c' stroke-width='2' rx='4'/><text x='10' y='30' font-family='Arial' font-size='14' font-weight='bold' fill='%23b91c1c'>NOTARY PUBLIC SEAL</text><text x='10' y='50' font-family='Courier' font-size='12' fill='%23b91c1c'>Verified %26 Attested</text></svg>",
  },
];

export const SignatureCanvasModal: React.FC<SignatureCanvasModalProps> = ({
  visible,
  theme,
  onSelectSignature,
  onClose,
}) => {
  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons
                name="ribbon-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.title}>Attach Advocate Signature Stamp</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="close-signature-modal">
              <Ionicons name="close" size={22} color={theme.colors.subText} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select a verified advocate stamp or digital signature seal to embed
            in your draft:
          </Text>

          {SAMPLE_SIGNATURE_STAMPS.map((stamp) => (
            <TouchableOpacity
              key={stamp.id}
              style={styles.stampCard}
              onPress={() => {
                onSelectSignature(stamp.dataUri);
                onClose();
              }}
              testID={`stamp-option-${stamp.id}`}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.stampTitle}>{stamp.title}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 20,
    },
    content: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.subText,
      marginBottom: 16,
    },
    stampCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderWidth: 1,
      padding: 14,
      borderRadius: 8,
      marginBottom: 12,
    },
    stampTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: 10,
      marginTop: 8,
    },
    cancelText: {
      color: theme.colors.subText,
      fontSize: 14,
      fontWeight: "600",
    },
  });
