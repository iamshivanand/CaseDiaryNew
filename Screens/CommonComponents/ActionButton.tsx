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

  switch (type) {
    case "primary":
      buttonStyleConfig = ActionButtonStyle.primaryButton;
      textStyleConfig = ActionButtonStyle.primaryButtonText;
      break;
    case "secondary":
      buttonStyleConfig = ActionButtonStyle.secondaryButton;
      textStyleConfig = ActionButtonStyle.secondaryButtonText;
      break;
    case "dashed":
      buttonStyleConfig = ActionButtonStyle.dashedButton;
      textStyleConfig = ActionButtonStyle.dashedButtonText;
      break;
    default:
      buttonStyleConfig = ActionButtonStyle.primaryButton;
      textStyleConfig = ActionButtonStyle.primaryButtonText;
  }

  const activityIndicatorColor = (type === "primary" || type === "dashed") ? "#FFFFFF" : "#1D4ED8";
   if (type === 'secondary' && ActionButtonStyle.secondaryButton.backgroundColor === 'transparent') {
    // If secondary is truly ghost, indicator should be its text color
    // activityIndicatorColor = ActionButtonStyle.secondaryButtonText.color;
    // For now, keeping it simpler, assuming secondary might have a background or primary is dominant enough.
    // Defaulting to primary color for ghost/light buttons.
     activityIndicatorColor = "#1D4ED8";
   }


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
        <ActivityIndicator color={activityIndicatorColor} />
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
