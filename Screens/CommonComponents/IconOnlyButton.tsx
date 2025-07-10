// Screens/CommonComponents/IconOnlyButton.tsx
import React, { useContext } from "react"; // Added useContext
import { TouchableOpacity, ViewStyle } from "react-native";
import { getIconOnlyButtonStyles } from "./IconOnlyButtonStyle"; // Import function
import { ThemeContext } from "../../Providers/ThemeProvider"; // Adjust path

interface IconOnlyButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel: string;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
}

const IconOnlyButton: React.FC<IconOnlyButtonProps> = ({
  onPress,
  icon,
  style,
  disabled = false,
  accessibilityLabel,
  hitSlop = { top: 5, bottom: 5, left: 5, right: 5 },
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getIconOnlyButtonStyles(theme); // Generate styles

  return (
    <TouchableOpacity
      style={[
        styles.button, // Use themed base style
        style,
        disabled && styles.disabled, // Use themed disabled style
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
