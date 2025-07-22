import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { getDb, updateUserProfile } from "../../DataBase";
import { LawyerProfileData } from "../../Types/appTypes";
import ActionButton from "../CommonComponents/ActionButton";

const OnboardingScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

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
    if (!name || !designation || !phone || !email || !address) {
      Alert.alert("Error", "Please fill all the fields.");
      return;
    }
    const db = await getDb();
    const newProfile: LawyerProfileData = {
      avatarUrl: avatarUri,
      name,
      designation,
      practiceAreas: [],
      stats: {
        totalCases: 0,
        upcomingHearings: 0,
        yearsOfPractice: 0,
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
    await updateUserProfile(db, 1, newProfile); // Assuming user id 1
    await AsyncStorage.setItem("@onboarding_complete", "true");
    navigation.replace("App");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
      <ActionButton title="Save and Continue" onPress={handleSave} />
    </View>
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
