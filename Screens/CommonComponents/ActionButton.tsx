// Screens/CommonComponents/ActionButton.tsx
import React, { useContext } from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from "react-native";
import { getActionButtonStyles } from "./ActionButtonStyle";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider"; // Adjust path

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
  const { theme } = useContext(ThemeContext);
  const styles = getActionButtonStyles(theme); // Generate styles with theme

  let buttonStyleConfig;
  let textStyleConfig;
  let finalActivityIndicatorColor;

  switch (type) {
    case "primary":
      buttonStyleConfig = styles.primaryButton;
      textStyleConfig = styles.primaryButtonText;
      finalActivityIndicatorColor = textStyleConfig.color || theme.colors.background;
      break;
    case "secondary":
      buttonStyleConfig = styles.secondaryButton;
      textStyleConfig = styles.secondaryButtonText;
      finalActivityIndicatorColor = textStyleConfig.color || theme.colors.primary;
      break;
    case "dashed":
      buttonStyleConfig = styles.dashedButton;
      textStyleConfig = styles.dashedButtonText;
      finalActivityIndicatorColor = textStyleConfig.color || theme.colors.primary;
      break;
    default:
      buttonStyleConfig = styles.primaryButton;
      textStyleConfig = styles.primaryButtonText;
      finalActivityIndicatorColor = textStyleConfig.color || theme.colors.background;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyleConfig,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={finalActivityIndicatorColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftIcon && <View style={styles.iconWrapper}>{leftIcon}</View>}
          <Text style={[styles.buttonText, textStyleConfig, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ActionButton;
