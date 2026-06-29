// Screens/CommonComponents/ActionButton.tsx
import React, { useContext } from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from "react-native";
import { getActionButtonStyles } from "./ActionButtonStyle";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider"; // Adjust path

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "dashed" | "danger";
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

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 10, stiffness: 200 });
  };

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
    case "danger":
      buttonStyleConfig = styles.dangerButton;
      textStyleConfig = styles.dangerButtonText;
      finalActivityIndicatorColor = "#FFFFFF";
      break;
    default:
      buttonStyleConfig = styles.primaryButton;
      textStyleConfig = styles.primaryButtonText;
      finalActivityIndicatorColor = textStyleConfig.color || theme.colors.background;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={style ? { width: style.width, flex: style.flex } : undefined}
    >
      <Animated.View
        style={[
          styles.button,
          buttonStyleConfig,
          (disabled || loading) && styles.disabledButton,
          style,
          animatedStyle,
        ]}
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
      </Animated.View>
    </TouchableOpacity>
  );
};

export default ActionButton;
