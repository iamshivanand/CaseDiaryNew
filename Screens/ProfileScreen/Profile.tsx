import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from "../../Providers/ThemeProvider";
import {
  getDb,
  getUserProfile,
  updateUserProfile,
  getTotalCases,
  getUpcomingHearings,
} from "../../DataBase";
import { useFocusEffect } from "@react-navigation/native";
import ProfileHeader from "./components/ProfileHeader";
import ActionButton from "../CommonComponents/ActionButton";
import StatCard from "./components/StatCard"; // For non-editable stats
import EditableStatItem from "./components/EditableStatItem"; // For Years of Practice
import TabSelector from "./components/TabSelector";
import AboutMe from "./components/AboutMe";
import ContactInfo from "./components/ContactInfo";
import Languages from "./components/Languages";
import { LawyerProfileData } from "../../Types/appTypes";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import SettingsScreen from "../Settings/SettingsScreen";

const ProfileScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [profileData, setProfileData] = useState<LawyerProfileData | null>(
    null
  );
  const [selectedTab, setSelectedTab] = useState<string>("Profile");
  const [isEditing, setIsEditing] = useState(false);

  // Temporary state for editable fields
  const [tempAvatarUri, setTempAvatarUri] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempDesignation, setTempDesignation] = useState("");
  const [tempPracticeAreas, setTempPracticeAreas] = useState("");
  const [tempAboutMe, setTempAboutMe] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempLanguages, setTempLanguages] = useState("");
  const [tempYearsOfPractice, setTempYearsOfPractice] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        console.log("Fetching profile data...");
        const db = await getDb();
        const userId = await AsyncStorage.getItem("@user_id");
        console.log("User ID from AsyncStorage:", userId);
        if (userId) {
          const parsedUserId = parseInt(userId, 10);
          const profile = await getUserProfile(db, parsedUserId);
          console.log("Profile data from DB:", profile);
          // getTotalCases and getUpcomingHearings call getDb() internally — no db arg
          const totalCases = await getTotalCases(parsedUserId);
          const upcomingHearings = await getUpcomingHearings(parsedUserId);
          if (profile) {
            setProfileData({
              ...profile,
              stats: {
                ...profile.stats,
                totalCases,
                upcomingHearings,
              },
            });
          }
        }
      };
      fetchProfile();
    }, [])
  );

  // Effect to reset temp states if actual data changes from elsewhere (e.g. future API refresh)
  // or when exiting an edit mode.
  useEffect(() => {
    if (profileData && !isEditing) {
      setTempAvatarUri(profileData.avatarUrl);
      setTempName(profileData.name);
      setTempDesignation(profileData.designation);
      setTempPracticeAreas(profileData.practiceAreas.join(", "));
      setTempAboutMe(profileData.aboutMe);
      setTempEmail(profileData.contactInfo.email);
      setTempPhone(profileData.contactInfo.phone);
      setTempAddress(profileData.contactInfo.address);
      setTempLanguages(profileData.languages.join(", "));
      if (profileData.stats && profileData.stats.yearsOfPractice !== undefined) {
        setTempYearsOfPractice(Number(profileData.stats.yearsOfPractice).toString());
      }
    }
  }, [profileData, isEditing]);


  const handleStartEdit = () => {
    if (!profileData) return;
    setTempAvatarUri(profileData.avatarUrl);
    setTempName(profileData.name);
    setTempDesignation(profileData.designation);
    setTempPracticeAreas(profileData.practiceAreas.join(", "));
    setTempAboutMe(profileData.aboutMe);
    setTempEmail(profileData.contactInfo.email);
    setTempPhone(profileData.contactInfo.phone);
    setTempAddress(profileData.contactInfo.address);
    setTempLanguages(profileData.languages.join(", "));
    setTempYearsOfPractice(profileData.stats.yearsOfPractice !== undefined ? Number(profileData.stats.yearsOfPractice).toString() : "0");
    setIsEditing(true);
  };

  const handleCancelAll = () => {
    setIsEditing(false);
  };

  const handleSaveAll = async () => {
    if (!profileData) return;

    const updatedProfile = {
      ...profileData,
      avatarUrl: tempAvatarUri,
      name: tempName,
      designation: tempDesignation,
      practiceAreas: tempPracticeAreas
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      aboutMe: tempAboutMe,
      contactInfo: {
        email: tempEmail,
        phone: tempPhone,
        address: tempAddress,
      },
      languages: tempLanguages
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      stats: {
        ...profileData.stats,
      }
    };

    const parsedYears = parseInt(tempYearsOfPractice, 10);
    if (!isNaN(parsedYears)) {
      updatedProfile.stats.yearsOfPractice = parsedYears;
      updatedProfile.stats.yearsOfPracticeLastUpdated = new Date().toISOString();
    }

    setProfileData(updatedProfile);
    
    try {
      const dbInstance = await getDb();
      const userId = await AsyncStorage.getItem("@user_id");
      if (userId) {
        await updateUserProfile(dbInstance, parseInt(userId, 10), updatedProfile);
      }
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
        return false;
      }
      return true;
    }
    return true; // Assume granted on web or handle differently
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need camera permissions to make this work!");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleChooseImage = async () => {
    Alert.alert(
      "Select Image",
      "Choose an image from the library or take a new one.",
      [
        {
          text: "From Library",
          onPress: async () => {
            const hasPermission = await requestMediaLibraryPermissions();
            if (!hasPermission) return;
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setTempAvatarUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Take Photo",
          onPress: async () => {
            const hasPermission = await requestCameraPermissions();
            if (!hasPermission) return;
            let result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setTempAvatarUri(result.assets[0].uri);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // Calculate displayed years of practice
  const getDisplayedYearsOfPractice = () => {
    if (!profileData) return 0;
    const { yearsOfPractice, yearsOfPracticeLastUpdated } = profileData.stats;
    const baseYears = Number(yearsOfPractice) || 0;
    if (!yearsOfPracticeLastUpdated) {
      return baseYears;
    }
    const lastUpdatedYear = new Date(yearsOfPracticeLastUpdated).getFullYear();
    const currentYear = new Date().getFullYear();
    const diff = currentYear - lastUpdatedYear;
    return baseYears + (diff > 0 ? diff : 0);
  };

  const getProfileCompleteness = () => {
    if (!profileData) return 0;
    let fields = [
      profileData.name,
      profileData.designation,
      profileData.aboutMe,
      profileData.contactInfo?.email,
      profileData.contactInfo?.phone,
      profileData.contactInfo?.address,
      profileData.avatarUrl,
    ];
    let filled = fields.filter(f => f && f.trim() !== "").length;
    if (profileData.practiceAreas && profileData.practiceAreas.length > 0) filled += 1;
    if (profileData.languages && profileData.languages.length > 0) filled += 1;
    if (profileData.stats && profileData.stats.yearsOfPractice > 0) filled += 1;
    
    const totalFields = fields.length + 3; // 7 + 3 = 10
    return Math.round((filled / totalFields) * 100);
  };

  const profileTabs = ["Profile", "Settings"];

  const renderTabContent = () => {
    if (selectedTab === "Profile") {
      return (
        <>
          <AboutMe
            description={profileData.aboutMe}
            isEditing={isEditing}
            tempDescription={tempAboutMe}
            onTempDescriptionChange={setTempAboutMe}
          />
          <ContactInfo
            contactDetails={profileData.contactInfo}
            isEditing={isEditing}
            tempEmail={tempEmail}
            onTempEmailChange={setTempEmail}
            tempPhone={tempPhone}
            onTempPhoneChange={setTempPhone}
            tempAddress={tempAddress}
            onTempAddressChange={setTempAddress}
          />
          <Languages
            languages={profileData.languages}
            isEditing={isEditing}
            tempLanguages={tempLanguages}
            onTempLanguagesChange={setTempLanguages}
          />
        </>
      );
    } else if (selectedTab === "Settings") {
      return <SettingsScreen />;
    }
    return null;
  };

  if (!profileData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const completeness = getProfileCompleteness();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" // Important for inputs within ScrollView
    >
      <ProfileHeader
        profileData={profileData}
        isEditing={isEditing}
        onChooseImage={handleChooseImage}
        tempAvatarUri={tempAvatarUri}
        tempName={tempName}
        onTempNameChange={setTempName}
        tempDesignation={tempDesignation}
        onTempDesignationChange={setTempDesignation}
        tempPracticeAreas={tempPracticeAreas}
        onTempPracticeAreasChange={setTempPracticeAreas}
        onEditPress={handleStartEdit}
        onSavePress={handleSaveAll}
        onCancelPress={handleCancelAll}
      />

      {/* Old Action Buttons - can be removed or repurposed if needed */}
      {/* <View style={styles.actionButtonsContainer}> ... </View> */}

      <View style={[styles.statsContainer, { backgroundColor: theme.colors.background }]}>
        <StatCard
          label="Total Cases"
          value={profileData.stats.totalCases}
        />
        <StatCard
          label="Upcoming Hearings"
          value={profileData.stats.upcomingHearings}
        />
        <EditableStatItem
          label="Years of Practice"
          value={getDisplayedYearsOfPractice()}
          unit="yrs"
          isEditing={isEditing}
          tempValue={tempYearsOfPractice}
          onTempValueChange={setTempYearsOfPractice}
        />
      </View>

      {selectedTab === "Profile" && (
        <View style={{ paddingHorizontal: 16, marginVertical: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}>Profile Completeness</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: theme.colors.primary }}>{completeness}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: theme.colors.border || "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
            <View style={{ width: `${completeness}%`, height: "100%", backgroundColor: theme.colors.primary }} />
          </View>

        </View>
      )}

      <TabSelector
        tabs={profileTabs}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
      />

      <View style={styles.tabContentContainer}>{renderTabContent()}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // actionButtonsContainer: { // Kept for reference if needed later
  //   flexDirection: "row",
  //   justifyContent: "space-around",
  //   paddingVertical: 15,
  //   paddingHorizontal: 10,
  //   backgroundColor: "#fff",
  // },
  // actionButton: {
  //   flex: 1,
  //   marginHorizontal: 8,
  //   height: 44,
  // },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
  },
  tabContentContainer: {
    padding: 15,
  },
  tabContentText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 30,
    color: "#555",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfileScreen;
