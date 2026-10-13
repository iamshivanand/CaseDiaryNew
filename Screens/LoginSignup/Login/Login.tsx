import { NavigationProp } from "@react-navigation/native";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";

import { LoginStyles } from "./loginStyle";
import InputTextField from "../../CommonComponents/InputTextField";
import {
  loginAdvocate,
  registerAdvocate,
} from "../../../utils/cloudSyncService";

interface authType {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

type Props = {
  navigation: any;
};

const screenWidth = Dimensions.get("window").width;
const inputWidth = screenWidth * 0.9;

const Login: React.FC<Props> = ({ navigation }) => {
  const [authDetails, setAuthDetails] = useState<authType>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (name: keyof authType, value: string) => {
    setAuthDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!authDetails.email.trim() || !authDetails.password.trim()) {
      Alert.alert("Required Fields", "Please enter your email and password.");
      return;
    }

    if (!isLogin && authDetails.password !== authDetails.confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await loginAdvocate(
          authDetails.email.trim(),
          authDetails.password.trim()
        );

        if (res.success) {
          Alert.alert(
            "Welcome Back!",
            `Logged in as ${res.user?.name || "Advocate"}. Chamber: ${
              res.chamber?.name || "Solo Chamber"
            }`,
            [{ text: "Continue", onPress: () => navigation.replace("MainApp") }]
          );
        } else {
          Alert.alert("Login Failed", res.error || "Invalid credentials.");
        }
      } else {
        const advocateName =
          authDetails.name?.trim() ||
          authDetails.email.split("@")[0] ||
          "Advocate";

        const res = await registerAdvocate({
          name: advocateName,
          email: authDetails.email.trim(),
          password: authDetails.password.trim(),
          chamberName: `${advocateName}'s Chamber`,
          planTier: "solo",
        });

        if (res.success) {
          Alert.alert(
            "Account Created!",
            `Your Chamber and Cloud Sync are now active!`,
            [{ text: "Get Started", onPress: () => navigation.replace("MainApp") }]
          );
        } else {
          Alert.alert("Registration Failed", res.error || "Could not register.");
        }
      }
    } catch (e: any) {
      console.error("Auth error:", e);
      Alert.alert("Network Error", "Could not reach server. You can continue offline.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueOffline = () => {
    navigation.replace("MainApp");
  };

  return (
    <View style={LoginStyles.container}>
      {!isLogin && (
        <InputTextField
          value={authDetails.name || ""}
          onChange={(value: string) => handleChange("name", value)}
          label="Full Name"
          placeholder="Adv. Rajesh Kumar"
          inputType="text"
        />
      )}
      <InputTextField
        value={authDetails.email}
        onChange={(value: string) => handleChange("email", value)}
        label="Email or Phone"
        placeholder="advocate@bar.in"
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
          value={authDetails.confirmPassword || ""}
          onChange={(value: string) => handleChange("confirmPassword", value)}
          label="Confirm Password"
          placeholder="Confirm Password"
          inputType="password"
        />
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading}
        style={[styles.button, isLoading && { opacity: 0.6 }]}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.butttonText}>
            {isLogin ? "Sign In & Sync Chamber" : "Create Chamber Account"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 14 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: "#cbd5e1" }} />
        <Text style={{ marginHorizontal: 10, fontSize: 12, color: "#64748b", fontWeight: "600" }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: "#cbd5e1" }} />
      </View>

      {/* Google Sign-In Button */}
      <TouchableOpacity
        onPress={async () => {
          Alert.alert(
            "Sign In with Google",
            "To connect your Google account securely, your Google OAuth Client ID is verified by our backend server.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Continue with Google",
                onPress: () => {
                  Alert.alert(
                    "Google Account Verification",
                    "Please ensure your Google Web/Android Client ID is configured in the backend environment."
                  );
                },
              },
            ]
          );
        }}
        disabled={isLoading}
        style={styles.googleButton}
      >
        <Text style={styles.googleButtonText}>🔵 Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsLogin(!isLogin)}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleButtonText}>
          {isLogin ? "Need a Chamber account? Register" : "Already registered? Sign In"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleContinueOffline}
        style={styles.offlineButton}
      >
        <Text style={styles.offlineButtonText}>
          Continue Offline (Without Cloud Sync) →
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1e293b",
    padding: 14,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 15,
  },
  butttonText: {
    color: "#f59e0b",
    fontSize: 16,
    fontWeight: "700",
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 15,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  offlineButton: {
    marginTop: 25,
    alignItems: "center",
    padding: 10,
  },
  offlineButtonText: {
    color: "#94a3b8",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});

export default Login;

