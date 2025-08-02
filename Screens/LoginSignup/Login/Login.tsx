import { NavigationProp } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

import { LoginStyles } from "./loginStyle";
import InputTextField from "../../CommonComponents/InputTextField";
// interface Props {
//   setIsSignUp: (value: boolean) => void;
//   // navigation: NavigationProp<any>;
// }
interface authType {
  email: string;
  password: string;
  confirmPassword?: string;
}

type Props = {
  navigation: any;
};
const screenWidth = Dimensions.get("window").width;
const inputWidth = screenWidth * 0.9;

// interface DashboardScreenProps {
//   navigation: NavigationProp<any>;
// }
const Login: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    console.log("Login screen rendered");
  }, []);
  const [authDetails, setAuthDetails] = useState<authType>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLogin, setIsLogin] = useState<boolean>(false);

  const handleChange = (name: keyof authType, value: string) => {
    setAuthDetails({
      ...authDetails,
      [name]: value,
    });
  };
  const handleSubmit = () => {
    console.log("The form is Submitted", authDetails);
    navigation.replace("MainApp");
  };
  return (
    <View style={LoginStyles.container}>
      <InputTextField
        value={authDetails.email}
        onChange={(value: string) => handleChange("email", value)}
        label="Email"
        placeholder="Email"
        inputType="email"
        keyboardType="email-address"
      />
      <InputTextField
        value={authDetails.password}
        onChange={(value: string) => handleChange("password", value)}
        label="Password"
        placeholder="Password"
        inputType="password"
      />
      {!isLogin && (
        <InputTextField
          value={authDetails.confirmPassword}
          onChange={(value: string) => handleChange("confirmPassword", value)}
          label="Confirm Password"
          placeholder="Confirm Password"
          inputType="password"
        />
      )}
      {/* <TouchableOpacity
        style={LoginStyles.button}
        activeOpacity={0.8}
        onPress={() => navigateToScreen("DashboardScreen")}
      >
        <Text style={LoginStyles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={LoginStyles.Signupstatement}>
        Don't have account please{" "}
        <TouchableOpacity onPress={() => setIsSignUp(true)}>
          <Text style={LoginStyles.linkText}>Signup</Text>
        </TouchableOpacity>
      </Text> */}
      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        <Text style={styles.butttonText}>{isLogin ? "Login" : "Register"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setIsLogin(!isLogin)}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleButtonText}>
          {isLogin ? "Need an account? Register" : "Have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    width: inputWidth,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    fontSize: 18,
    borderRadius: 6,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#6200ee",
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
  },
  butttonText: {
    color: "#ffffff",
    fontSize: 16,
  },
  toggleButton: {
    marginTop: 15,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#6200ee",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});

export default Login;
