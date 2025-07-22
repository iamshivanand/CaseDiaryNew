import React, { useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { getDb, updateUserProfile, addUser } from "../../DataBase";
import { LawyerProfileData } from "../../Types/appTypes";
import ActionButton from "../CommonComponents/ActionButton";

const OnboardingScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [yearsOfPractice, setYearsOfPractice] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const viewRef = useRef<any>(null);

  const handleChooseImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    console.log("Attempting to save onboarding data...");
    if (!name || !designation || !phone || !email || !address || !yearsOfPractice) {
      Alert.alert("Error", "Please fill all the fields.");
      console.error("Validation failed: Not all fields are filled.");
      return;
    }
    try {
      const db = await getDb();
      const userId = await addUser(name, email);
      if (userId) {
        const newProfile: Omit<LawyerProfileData, 'stats'> & { stats: Omit<LawyerProfileData['stats'], 'totalCases' | 'upcomingHearings'> } = {
          avatarUrl: avatarUri,
          name,
          designation,
          practiceAreas: [],
          stats: {
            yearsOfPractice: parseInt(yearsOfPractice, 10) || 0,
            yearsOfPracticeLastUpdated: new Date().toISOString(),
          },
          aboutMe: "",
          contactInfo: {
            email,
            phone,
            address,
          },
          languages: [],
          recentActivity: [],
        };
        console.log("Saving new profile data:", newProfile);
        await updateUserProfile(db, userId, newProfile as LawyerProfileData);
        console.log("Profile data saved successfully.");
        await AsyncStorage.setItem("@onboarding_complete", "true");
        await AsyncStorage.setItem("@user_id", userId.toString());
        console.log("Onboarding status set to complete.");
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Onboarding Complete!",
            body: "Welcome to Case Diary!",
          },
          trigger: null,
        });
        viewRef.current.animate("fadeOutUp").then(() => {
          navigation.replace("MainApp");
        });
      } else {
        Alert.alert("Error", "An error occurred while creating your account.");
      }
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      Alert.alert("Error", "An error occurred while saving your data.");
    }
  };

  return (
    <Animatable.View
      ref={viewRef}
      animation="fadeIn"
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>
        Let's get your profile set up.
      </Text>
      <ActionButton
        title={avatarUri ? "Change Photo" : "Upload Photo"}
        onPress={handleChooseImage}
      />
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Designation"
        value={designation}
        onChangeText={setDesignation}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Office Address"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Years of Practice"
        value={yearsOfPractice}
        onChangeText={setYearsOfPractice}
        keyboardType="number-pad"
      />
      <ActionButton title="Save and Continue" onPress={handleSave} />
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
});

export default OnboardingScreen;
