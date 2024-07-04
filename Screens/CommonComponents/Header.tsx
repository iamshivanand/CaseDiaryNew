import { FontAwesome } from "@expo/vector-icons";
import React, { useContext } from "react";
import {
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native";

import { ThemeContext } from "../../Providers/ThemeProvider";

interface CustomHeaderProps {
  //title: string;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

const Header: React.FC<CustomHeaderProps> = ({
  //title,
  onPress,
  containerStyle,
}) => {
  const { theme } = useContext(ThemeContext);
  const { height } = useWindowDimensions();
  const statusBarHeight = StatusBar.currentHeight || 0;
  const headerHeight = Platform.OS === "android" ? height * 0.08 : 60;

  return (
    <SafeAreaView
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 10,
          marginTop: 5,
          //marginTop: statusBarHeight - 20,
          height: headerHeight,
          backgroundColor: theme.colors.background,
        },
        containerStyle,
      ]}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Welcome Back</Text>
      {onPress && (
        <TouchableOpacity onPress={onPress}>
          <FontAwesome name="user" size={34} color="green" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default Header;
