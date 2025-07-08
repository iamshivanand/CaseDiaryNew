// Screens/CommonComponents/IconOnlyButton.tsx
import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { IconOnlyButtonStyle } from "./IconOnlyButtonStyle";

interface IconOnlyButtonProps {
  onPress: () => void;
  icon: React.ReactNode; // Expects a fully formed icon component, e.g., <MaterialIcons name="edit" size={24} color="blue" />
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel: string;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number }; // For larger touch target
}

const IconOnlyButton: React.FC<IconOnlyButtonProps> = ({
  onPress,
  icon,
  style,
  disabled = false,
  accessibilityLabel,
  hitSlop = { top: 5, bottom: 5, left: 5, right: 5 }, // Default hitSlop
}) => {
  return (
    <TouchableOpacity
      style={[
        IconOnlyButtonStyle.button,
        style,
        disabled && IconOnlyButtonStyle.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={hitSlop}
    >
      {icon}
    </TouchableOpacity>
  );
};

export default IconOnlyButton;
