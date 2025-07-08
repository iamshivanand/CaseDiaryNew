// Screens/CommonComponents/ActionButton.tsx
import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from "react-native";
import { ActionButtonStyle } from "./ActionButtonStyle";

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "dashed";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  type = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
}) => {
  let buttonStyleConfig;
  let textStyleConfig;
  let finalActivityIndicatorColor;

  switch (type) {
    case "primary":
      buttonStyleConfig = ActionButtonStyle.primaryButton;
      textStyleConfig = ActionButtonStyle.primaryButtonText;
      finalActivityIndicatorColor = ActionButtonStyle.primaryButtonText.color || "#FFFFFF";
      break;
    case "secondary":
      buttonStyleConfig = ActionButtonStyle.secondaryButton;
      textStyleConfig = ActionButtonStyle.secondaryButtonText;
      // For secondary (ghost/text buttons), use the text color for the indicator, or a default if not specified
      finalActivityIndicatorColor = ActionButtonStyle.secondaryButtonText.color || "#1D4ED8";
      break;
    case "dashed":
      buttonStyleConfig = ActionButtonStyle.dashedButton;
      textStyleConfig = ActionButtonStyle.dashedButtonText;
      // Dashed buttons are often similar to primary in terms of text on transparent/light bg, but icon might be primary color
      finalActivityIndicatorColor = ActionButtonStyle.dashedButtonText.color || "#1D4ED8";
      break;
    default:
      buttonStyleConfig = ActionButtonStyle.primaryButton;
      textStyleConfig = ActionButtonStyle.primaryButtonText;
      finalActivityIndicatorColor = ActionButtonStyle.primaryButtonText.color || "#FFFFFF";
  }

  // If the button text color for primary is not white (e.g. dark theme with light primary button), this ensures contrast.
  // However, usually primary buttons have light text on dark bg or vice-versa.
  // The logic above tries to infer from textStyleConfig.color.

  return (
    <TouchableOpacity
      style={[
        ActionButtonStyle.button,
        buttonStyleConfig,
        (disabled || loading) && ActionButtonStyle.disabledButton,
        style, // Allow custom style overrides
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={finalActivityIndicatorColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftIcon && <View style={ActionButtonStyle.iconWrapper}>{leftIcon}</View>}
          <Text style={[ActionButtonStyle.buttonText, textStyleConfig, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ActionButton;
