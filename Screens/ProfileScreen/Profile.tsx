import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import AboutMe from "./components/AboutMe";
import ContactInfo from "./components/ContactInfo";
import EditableStatItem from "./components/EditableStatItem"; // For Years of Practice
import Languages from "./components/Languages";
import ProfileHeader from "./components/ProfileHeader";
import StatCard from "./components/StatCard"; // For non-editable stats
import TabSelector from "./components/TabSelector";
import {
  getDb,
  getUserProfile,
  updateUserProfile,
  getTotalCases,
  getUpcomingHearings,
  getFinancialSummary,
} from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { SkeletonProfile } from "../CommonComponents/SkeletonLoader";

import ActionButton from "../CommonComponents/ActionButton";
import { LawyerProfileData } from "../../Types/appTypes";
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

  const [financialSummary, setFinancialSummary] = useState({
    totalCollected: 0,
    totalRemaining: 0,
    totalAgreed: 0,
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        console.log("Fetching profile data...");
        const db = await getDb();
        const userIdVal = await AsyncStorage.getItem("@user_id");
        console.log("User ID from AsyncStorage:", userIdVal);
        const parsedUserId = userIdVal ? parseInt(userIdVal, 10) : 1;
        const profile = await getUserProfile(db, parsedUserId);
        console.log("Profile data from DB:", profile);
        // getTotalCases and getUpcomingHearings call getDb() internally — no db arg
        const totalCases = await getTotalCases(parsedUserId);
        const upcomingHearings = await getUpcomingHearings(parsedUserId);
        const finSummary = await getFinancialSummary(parsedUserId);
        setFinancialSummary(finSummary);
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
      if (
        profileData.stats &&
        profileData.stats.yearsOfPractice !== undefined
      ) {
        setTempYearsOfPractice(
          Number(profileData.stats.yearsOfPractice).toString()
        );
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
    setTempYearsOfPractice(
      profileData.stats.yearsOfPractice !== undefined
        ? Number(profileData.stats.yearsOfPractice).toString()
        : "0"
    );
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
      },
    };

    const parsedYears = parseInt(tempYearsOfPractice, 10);
    if (!isNaN(parsedYears)) {
      updatedProfile.stats.yearsOfPractice = parsedYears;
      updatedProfile.stats.yearsOfPracticeLastUpdated =
        new Date().toISOString();
    }

    try {
      const dbInstance = await getDb();
      const userIdVal = await AsyncStorage.getItem("@user_id");
      const userId = userIdVal ? parseInt(userIdVal, 10) : 1;
      await updateUserProfile(dbInstance, userId, updatedProfile);

      setProfileData({ ...updatedProfile });

      // Sync temp states immediately with permanent persisted avatar and values
      setTempAvatarUri(updatedProfile.avatarUrl);
      setTempName(updatedProfile.name);
      setTempDesignation(updatedProfile.designation);
      setTempPracticeAreas(updatedProfile.practiceAreas.join(", "));
      setTempAboutMe(updatedProfile.aboutMe);
      setTempEmail(updatedProfile.contactInfo.email);
      setTempPhone(updatedProfile.contactInfo.phone);
      setTempAddress(updatedProfile.contactInfo.address);
      setTempLanguages(updatedProfile.languages.join(", "));
      if (
        updatedProfile.stats &&
        updatedProfile.stats.yearsOfPractice !== undefined
      ) {
        setTempYearsOfPractice(
          Number(updatedProfile.stats.yearsOfPractice).toString()
        );
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
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to make this work!"
        );
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
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera permissions to make this work!"
        );
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
            const result = await ImagePicker.launchImageLibraryAsync({
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
            const result = await ImagePicker.launchCameraAsync({
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
    const fields = [
      profileData.name,
      profileData.designation,
      profileData.aboutMe,
      profileData.contactInfo?.email,
      profileData.contactInfo?.phone,
      profileData.contactInfo?.address,
      profileData.avatarUrl,
    ];
    let filled = fields.filter((f) => f && f.trim() !== "").length;
    if (profileData.practiceAreas && profileData.practiceAreas.length > 0)
      filled += 1;
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
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <SkeletonProfile />
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

      <View
        style={[
          styles.statsContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <StatCard label="Total Cases" value={profileData.stats.totalCases} />
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

      {/* Financial Overview Card */}
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 12,
          padding: 16,
          backgroundColor: theme.colors.cardBackground,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Icon
            name="cash-multiple"
            size={20}
            color={theme.colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: theme.colors.text,
            }}
          >
            Financial Overview
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: theme.isDark ? "#064E3B" : "#DCFCE7",
              padding: 12,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.isDark ? "#059669" : "#BBF7D0",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: theme.isDark ? "#34D399" : "#15803D",
                marginBottom: 2,
              }}
            >
              COLLECTED
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: theme.isDark ? "#6EE7B7" : "#166534",
              }}
            >
              ₹{financialSummary.totalCollected.toLocaleString("en-IN")}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: theme.isDark ? "#78350F" : "#FEF3C7",
              padding: 12,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.isDark ? "#B45309" : "#FDE68A",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: theme.isDark ? "#FDE68A" : "#D97706",
                marginBottom: 2,
              }}
            >
              PENDING
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: theme.isDark ? "#FCD34D" : "#92400E",
              }}
            >
              ₹{financialSummary.totalRemaining.toLocaleString("en-IN")}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
              padding: 12,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                marginBottom: 2,
              }}
            >
              TOTAL FEE
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: theme.isDark ? "#C7D2FE" : "#3730A3",
              }}
            >
              ₹{financialSummary.totalAgreed.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
      </View>

      {selectedTab === "Profile" && (
        <View style={styles.completenessContainer}>
          <View style={styles.completenessRow}>
            <Text
              style={[styles.completenessLabel, { color: theme.colors.text }]}
            >
              Profile Completeness
            </Text>
            <Text
              style={[
                styles.completenessValue,
                { color: theme.colors.primary },
              ]}
            >
              {completeness}%
            </Text>
          </View>
          <View
            style={[
              styles.progressBarBackground,
              { backgroundColor: theme.colors.border || "#E5E7EB" },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${completeness}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
        </View>
      )}

      <TabSelector
        tabs={profileTabs}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
      />

      <View style={styles.tabContentContainer}>{renderTabContent()}</View>

      <View style={styles.versionContainer}>
        <Text
          style={[
            styles.versionText,
            { color: theme.colors.textSecondary || "#6B7280" },
          ]}
        >
          App Version:{" "}
          {Application.nativeApplicationVersion &&
          Application.nativeApplicationVersion !== "1.0.0"
            ? Application.nativeApplicationVersion
            : Constants.expoConfig?.version || "1.2.2"}{" "}
          ({Application.nativeBuildVersion || "12"})
        </Text>
      </View>
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
  completenessContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  completenessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  completenessLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  completenessValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
  },
  versionContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ProfileScreen;
