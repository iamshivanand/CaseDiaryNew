import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import InputTextField from "../../CommonComponents/InputTextField";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import {
  loginAdvocate,
  registerAdvocate,
} from "../../../utils/cloudSyncService";
import { emitter } from "../../../utils/event-emitter";

interface AuthType {
  name?: string;
  chamberName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

type Props = {
  navigation: any;
  route?: any;
};

const Login: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const isFromOnboarding = Boolean(route?.params?.isFromOnboarding);

  const [authDetails, setAuthDetails] = useState<AuthType>({
    name: "",
    chamberName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (name: keyof AuthType, value: string) => {
    setAuthDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const finishAuthNavigation = async () => {
    await AsyncStorage.setItem("@onboarding_complete", "true");
    emitter.emit("authChange");
    emitter.emit("onboardingComplete");

    if (isFromOnboarding) {
      // Root App.tsx will switch to MainApp automatically via emitter
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("MainApp");
    }
  };

  const handleSubmit = async () => {
    if (!authDetails.email.trim() || !authDetails.password.trim()) {
      Alert.alert("Required Fields", "Please enter your email/phone and password.");
      return;
    }

    if (!isLogin && authDetails.password !== authDetails.confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please re-enter.");
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
            `Logged in as ${res.user?.name || "Advocate"}.\nChamber: ${
              res.chamber?.name || "Advocate Chamber"
            }`,
            [
              {
                text: "Continue",
                onPress: finishAuthNavigation,
              },
            ]
          );
        } else {
          Alert.alert("Login Failed", res.error || "Invalid credentials.");
        }
      } else {
        const advocateName =
          authDetails.name?.trim() ||
          authDetails.email.split("@")[0] ||
          "Advocate";

        const chamberTitle =
          authDetails.chamberName?.trim() ||
          `${advocateName}'s Chamber`;

        const res = await registerAdvocate({
          name: advocateName,
          email: authDetails.email.trim(),
          password: authDetails.password.trim(),
          chamberName: chamberTitle,
          planTier: "solo",
        });

        if (res.success) {
          Alert.alert(
            "Chamber Created!",
            `Welcome ${advocateName}!\nYour Chamber cloud account and multi-device sync are now active.`,
            [
              {
                text: "Open Chamber",
                onPress: finishAuthNavigation,
              },
            ]
          );
        } else {
          Alert.alert("Registration Failed", res.error || "Could not register account.");
        }
      }
    } catch (e: any) {
      console.error("Auth error:", e);
      Alert.alert(
        "Network Error",
        "Could not connect to Chamber server. You can continue working in offline mode."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueOffline = async () => {
    if (isFromOnboarding) {
      await AsyncStorage.setItem("@onboarding_complete", "true");
      emitter.emit("onboardingComplete");
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("MainApp");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Executive Header Banner */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border },
              ]}
            >
              <Icon name="scale-balance" size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {isLogin ? "Advocate Chamber Sign In" : "Register Chamber Account"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {isLogin
                ? "Sign in to sync courtroom cases with your Web Command Center & Chamber team."
                : "Create a verified account to enable cloud backup, junior counsel access & web drafting."}
            </Text>
          </View>

          {/* Segmented Mode Selector */}
          <View
            style={[
              styles.tabSelector,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Pressable
              style={[
                styles.tabButton,
                isLogin && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setIsLogin(true)}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: isLogin ? "#ffffff" : theme.colors.textSecondary },
                  isLogin && { fontWeight: "700" },
                ]}
              >
                Sign In
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tabButton,
                !isLogin && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setIsLogin(false)}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: !isLogin ? "#ffffff" : theme.colors.textSecondary },
                  !isLogin && { fontWeight: "700" },
                ]}
              >
                Create Account
              </Text>
            </Pressable>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {!isLogin && (
              <>
                <InputTextField
                  value={authDetails.name || ""}
                  onChange={(value: string) => handleChange("name", value)}
                  label="Full Name"
                  placeholder="Adv. Rajesh Kumar"
                  inputType="text"
                />
                <InputTextField
                  value={authDetails.chamberName || ""}
                  onChange={(value: string) => handleChange("chamberName", value)}
                  label="Chamber / Law Firm Name"
                  placeholder="e.g. Kumar & Associates Legal"
                  inputType="text"
                />
              </>
            )}

            <InputTextField
              value={authDetails.email}
              onChange={(value: string) => handleChange("email", value)}
              label="Email or Mobile Number"
              placeholder="advocate@barcouncil.in"
              inputType="email"
              keyboardType="email-address"
            />

            <InputTextField
              value={authDetails.password}
              onChange={(value: string) => handleChange("password", value)}
              label="Password"
              placeholder="••••••••"
              inputType="password"
            />

            {!isLogin && (
              <InputTextField
                value={authDetails.confirmPassword || ""}
                onChange={(value: string) => handleChange("confirmPassword", value)}
                label="Confirm Password"
                placeholder="••••••••"
                inputType="password"
              />
            )}

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
                isLoading && { opacity: 0.7 },
              ]}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? "Sign In & Sync Chamber" : "Create Chamber Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.colors.border }]}
              />
              <Text
                style={[styles.dividerText, { color: theme.colors.textSecondary }]}
              >
                OR
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.colors.border }]}
              />
            </View>

            {/* Google OAuth Quick Sign In */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Google Sign-In",
                  "Google Sign-In uses your Chamber's verified OAuth credentials. You can also sign in instantly using email & password.",
                  [{ text: "OK" }]
                );
              }}
              style={[
                styles.googleButton,
                {
                  backgroundColor: theme.dark ? "#1e293b" : "#ffffff",
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Icon name="google" size={18} color="#ea4335" style={{ marginRight: 8 }} />
              <Text style={[styles.googleButtonText, { color: theme.colors.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toggle Helper Link */}
          <Pressable
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchModeRow}
            hitSlop={10}
          >
            <Text style={[styles.switchModeText, { color: theme.colors.textSecondary }]}>
              {isLogin
                ? "New to Advocase Chamber? "
                : "Already registered your Chamber? "}
              <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>
                {isLogin ? "Create Account" : "Sign In"}
              </Text>
            </Text>
          </Pressable>

          {/* Continue Offline Link */}
          <Pressable
            onPress={handleContinueOffline}
            style={styles.offlineLink}
            hitSlop={10}
          >
            <Text style={[styles.offlineText, { color: theme.colors.textSecondary }]}>
              Continue in Offline Mode (Without Cloud Sync) →
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  tabSelector: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "700",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  switchModeRow: {
    marginTop: 20,
    alignItems: "center",
    padding: 6,
  },
  switchModeText: {
    fontSize: 13,
  },
  offlineLink: {
    marginTop: 14,
    alignItems: "center",
    padding: 8,
  },
  offlineText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
});

export default Login;
