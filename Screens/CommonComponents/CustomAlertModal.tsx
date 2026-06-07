// Screens/CommonComponents/CustomAlertModal.tsx
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { setCustomAlertHandler, AlertPayload, AlertButton } from "../../utils/AlertManager";
import ActionButton from "./ActionButton";

export const CustomAlertModal: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [payload, setPayload] = useState<AlertPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Register this modal's state trigger with the AlertManager
    setCustomAlertHandler((newPayload) => {
      if (newPayload) {
        setPayload(newPayload);
        setInputValue(newPayload.defaultValue || "");
        setVisible(true);
      } else {
        setVisible(false);
      }
    });

    return () => {
      setCustomAlertHandler(null);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!payload) return null;

  const { title, message, buttons, options, isPrompt, promptType, keyboardType } = payload;

  // Determine Alert Type / Status based on keywords in the title or message
  const getAlertType = (): "success" | "danger" | "warning" | "info" => {
    const textToCheck = `${title} ${message || ""}`.toLowerCase();
    if (
      textToCheck.includes("success") ||
      textToCheck.includes("complete") ||
      textToCheck.includes("saved") ||
      textToCheck.includes("updated") ||
      textToCheck.includes("done") ||
      textToCheck.includes("created") ||
      textToCheck.includes("added") ||
      textToCheck.includes("deleted")
    ) {
      return "success";
    }
    if (
      textToCheck.includes("error") ||
      textToCheck.includes("failed") ||
      textToCheck.includes("invalid") ||
      textToCheck.includes("missing") ||
      textToCheck.includes("denied") ||
      textToCheck.includes("could not") ||
      textToCheck.includes("cannot")
    ) {
      return "danger";
    }
    if (
      textToCheck.includes("warning") ||
      textToCheck.includes("permission") ||
      textToCheck.includes("validation") ||
      textToCheck.includes("alert") ||
      textToCheck.includes("confirm")
    ) {
      return "warning";
    }
    return "info";
  };

  const alertType = getAlertType();

  // Map theme colors and icons
  let statusIconName: keyof typeof Ionicons.prototype.props.name = "information-circle";
  let statusColor = theme.colors.primary;
  let statusBgColor = theme.colors.dark ? "rgba(129, 140, 248, 0.15)" : "rgba(99, 102, 241, 0.15)";

  switch (alertType) {
    case "success":
      statusIconName = "checkmark-circle";
      statusColor = theme.colors.success;
      statusBgColor = theme.colors.dark ? "rgba(52, 211, 153, 0.15)" : "rgba(16, 185, 129, 0.15)";
      break;
    case "danger":
      statusIconName = "alert-circle";
      statusColor = theme.colors.danger;
      statusBgColor = theme.colors.dark ? "rgba(248, 113, 113, 0.15)" : "rgba(239, 68, 68, 0.15)";
      break;
    case "warning":
      statusIconName = "warning";
      statusColor = theme.colors.warning;
      statusBgColor = theme.colors.dark ? "rgba(251, 191, 36, 0.15)" : "rgba(245, 158, 11, 0.15)";
      break;
    case "info":
    default:
      statusIconName = "information-circle";
      statusColor = theme.colors.primary;
      statusBgColor = theme.colors.dark ? "rgba(129, 140, 248, 0.15)" : "rgba(99, 102, 241, 0.15)";
      break;
  }

  const handleDismiss = () => {
    setVisible(false);
    if (options?.onDismiss) {
      options.onDismiss();
    }
    // Set payload to null after transitions
    setTimeout(() => {
      setPayload(null);
    }, 200);
  };

  const handleButtonPress = (btn: AlertButton) => {
    setVisible(false);
    setTimeout(() => {
      setPayload(null);
      if (btn.onPress) {
        btn.onPress(isPrompt ? inputValue : undefined);
      }
    }, 200);
  };

  const handleBackdropPress = () => {
    if (options?.cancelable !== false) {
      handleDismiss();
    }
  };

  // Render Buttons
  const renderButtons = () => {
    if (!buttons || buttons.length === 0) {
      // Default OK button
      return (
        <ActionButton
          title="OK"
          type="primary"
          onPress={() => handleDismiss()}
          style={styles.fullWidthButton}
        />
      );
    }

    if (buttons.length === 1) {
      const btn = buttons[0];
      return (
        <ActionButton
          title={btn.text || "OK"}
          type="primary"
          onPress={() => handleButtonPress(btn)}
          style={styles.fullWidthButton}
        />
      );
    }

    if (buttons.length === 2) {
      // Typically Cancel and Action (Delete, Confirm, etc.)
      const isCancelFirst = buttons[0].style === "cancel";
      const cancelButton = isCancelFirst ? buttons[0] : buttons[1].style === "cancel" ? buttons[1] : null;
      const actionButton = cancelButton === buttons[0] ? buttons[1] : buttons[0];

      return (
        <View style={styles.buttonRow}>
          {cancelButton && (
            <ActionButton
              title={cancelButton.text || "Cancel"}
              type="secondary"
              onPress={() => handleButtonPress(cancelButton)}
              style={[styles.rowButton, { marginRight: 8 }]}
            />
          )}
          <ActionButton
            title={actionButton.text || "OK"}
            type="primary"
            onPress={() => handleButtonPress(actionButton)}
            style={[
              styles.rowButton,
              actionButton.style === "destructive" && { backgroundColor: theme.colors.danger },
              !cancelButton && { marginLeft: 8 },
            ]}
            textStyle={actionButton.style === "destructive" ? { color: "#FFF" } : undefined}
          />
        </View>
      );
    }

    // Stack multiple buttons (> 2)
    return (
      <View style={styles.buttonStack}>
        {buttons.map((btn, index) => (
          <ActionButton
            key={index.toString()}
            title={btn.text || "Option"}
            type={btn.style === "cancel" ? "secondary" : "primary"}
            onPress={() => handleButtonPress(btn)}
            style={[
              styles.fullWidthButton,
              btn.style === "destructive" && { backgroundColor: theme.colors.danger },
              { marginVertical: 4 },
            ]}
            textStyle={btn.style === "destructive" ? { color: "#FFF" } : undefined}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.keyboardView}
            >
              <Animated.View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {/* Status Icon */}
                <View style={[styles.iconContainer, { backgroundColor: statusBgColor }]}>
                  <Ionicons name={statusIconName as any} size={36} color={statusColor} />
                </View>

                 {/* Title */}
                <Text style={[styles.title, { fontFamily: theme.fonts.bold, color: theme.colors.text }]}>{title}</Text>

                {/* Message */}
                {message ? (
                  <Text style={[styles.message, { fontFamily: theme.fonts.regular, color: theme.colors.textSecondary }]}>
                    {message}
                  </Text>
                ) : null}

                {/* Prompt Text Input */}
                {isPrompt && (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        fontFamily: theme.fonts.regular,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder="Enter details..."
                    placeholderTextColor={theme.colors.textSecondary}
                    autoFocus
                    secureTextEntry={promptType === "secure-text"}
                    keyboardType={keyboardType as any}
                  />
                )}

                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>{renderButtons()}</View>
              </Animated.View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  keyboardView: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  buttonsContainer: {
    width: "100%",
    marginTop: 4,
  },
  fullWidthButton: {
    width: "100%",
    marginVertical: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  rowButton: {
    flex: 1,
    marginVertical: 0,
  },
  buttonStack: {
    width: "100%",
  },
});

export default CustomAlertModal;
