import React, { useState, useContext, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
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
import ProfileHeader from "./components/ProfileHeader";
import StatCard from "./components/StatCard";
import EditableStatItem from "./components/EditableStatItem";
import TabSelector from "./components/TabSelector";
import AboutMe from "./components/AboutMe";
import ContactInfo from "./components/ContactInfo";
import Languages from "./components/Languages";
import { LawyerProfileData } from "../../Types/appTypes";
import { getProfileScreenStyles } from "./ProfileStyle";

type EditableSection =
  | "avatar"
  | "info"
  | "about"
  | "contact"
  | "languages"
  | "yearsOfPractice"
  | null;

const ProfileScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = getProfileScreenStyles(theme);
  const navigation = useNavigation();

  const [profileData, setProfileData] = useState<LawyerProfileData | null>(
    null
  );
  const [selectedTab, setSelectedTab] = useState<string>("Profile");
  const [editingSection, setEditingSection] = useState<EditableSection>(null);

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

  useEffect(() => {
    const fetchProfile = async () => {
      console.log("Fetching profile data...");
      const db = await getDb();
      const userId = await AsyncStorage.getItem("@user_id");
      console.log("User ID from AsyncStorage:", userId);
      if (userId) {
        const profile = await getUserProfile(db, parseInt(userId, 10));
        console.log("Profile data from DB:", profile);
        const totalCases = await getTotalCases(db, parseInt(userId, 10));
        const upcomingHearings = await getUpcomingHearings(
          db,
          parseInt(userId, 10)
        );
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
  }, []);

  useEffect(() => {
    if (profileData && !editingSection) {
      setTempAvatarUri(profileData.avatarUrl);
      setTempName(profileData.name);
      setTempDesignation(profileData.designation);
      setTempPracticeAreas(profileData.practiceAreas.join(", "));
      setTempAboutMe(profileData.aboutMe);
      setTempEmail(profileData.contactInfo.email);
      setTempPhone(profileData.contactInfo.phone);
      setTempAddress(profileData.contactInfo.address);
      setTempLanguages(profileData.languages.join(", "));
      if (profileData.stats && profileData.stats.yearsOfPractice) {
        setTempYearsOfPractice(profileData.stats.yearsOfPractice.toString());
      }
    }
  }, [profileData, editingSection]);


  const handleEditPress = (section: EditableSection) => {
    setTempAvatarUri(profileData.avatarUrl);
    setTempName(profileData.name);
    setTempDesignation(profileData.designation);
    setTempPracticeAreas(profileData.practiceAreas.join(", "));
    setTempAboutMe(profileData.aboutMe);
    setTempEmail(profileData.contactInfo.email);
    setTempPhone(profileData.contactInfo.phone);
    setTempAddress(profileData.contactInfo.address);
    setTempLanguages(profileData.languages.join(", "));
    setTempYearsOfPractice(profileData.stats.yearsOfPractice.toString());
    setEditingSection(section);
  };

  const handleCancel = () => {
    setEditingSection(null);
  };

  const handleSave = async (section: EditableSection) => {
    if (!profileData) return;

    const updatedProfile = { ...profileData };

    if (section === "info") {
      updatedProfile.name = tempName;
      updatedProfile.designation = tempDesignation;
      updatedProfile.practiceAreas = tempPracticeAreas
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    } else if (section === "about") {
      updatedProfile.aboutMe = tempAboutMe;
    } else if (section === "contact") {
      updatedProfile.contactInfo = {
        email: tempEmail,
        phone: tempPhone,
        address: tempAddress,
      };
    } else if (section === "languages") {
      updatedProfile.languages = tempLanguages
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    } else if (section === "yearsOfPractice") {
      const parsedYears = parseInt(tempYearsOfPractice, 10);
      if (!isNaN(parsedYears)) {
        updatedProfile.stats.yearsOfPractice = parsedYears;
        updatedProfile.stats.yearsOfPracticeLastUpdated = new Date().toISOString();
      }
    } else if (section === "avatar") {
      updatedProfile.avatarUrl = tempAvatarUri;
    }

    setProfileData(updatedProfile);
    const db = await getDb();
    const userId = await AsyncStorage.getItem("@user_id");
    if (userId) {
      await updateUserProfile(db, parseInt(userId, 10), updatedProfile);
    }
    setEditingSection(null);
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
    return true;
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

  const getDisplayedYearsOfPractice = () => {
    if (!profileData) return 0;
    const { yearsOfPractice, yearsOfPracticeLastUpdated } = profileData.stats;
    if (!yearsOfPracticeLastUpdated) {
      return yearsOfPractice;
    }
    const lastUpdatedYear = new Date(yearsOfPracticeLastUpdated).getFullYear();
    const currentYear = new Date().getFullYear();
    const diff = currentYear - lastUpdatedYear;
    return yearsOfPractice + (diff > 0 ? diff : 0);
  };

  const profileTabs = ["Profile", "Settings"];

  const renderTabContent = () => {
    if (selectedTab === "Profile") {
      return (
        <>
          <AboutMe
            description={profileData.aboutMe}
            isEditing={editingSection === "about"}
            tempDescription={tempAboutMe}
            onTempDescriptionChange={setTempAboutMe}
            onEditPress={() => handleEditPress("about")}
            onSave={() => handleSave("about")}
            onCancel={handleCancel}
          />
          <ContactInfo
            contactDetails={profileData.contactInfo}
            isEditing={editingSection === "contact"}
            tempEmail={tempEmail}
            onTempEmailChange={setTempEmail}
            tempPhone={tempPhone}
            onTempPhoneChange={setTempPhone}
            tempAddress={tempAddress}
            onTempAddressChange={setTempAddress}
            onEditPress={() => handleEditPress("contact")}
            onSave={() => handleSave("contact")}
            onCancel={handleCancel}
          />
          <Languages
            languages={profileData.languages}
            isEditing={editingSection === "languages"}
            tempLanguages={tempLanguages}
            onTempLanguagesChange={setTempLanguages}
            onEditPress={() => handleEditPress("languages")}
            onSave={() => handleSave("languages")}
            onCancel={handleCancel}
          />
        </>
      );
    } else if (selectedTab === "Settings") {
      return (
        <View>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.surface,
              padding: 15,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
            onPress={() => navigation.navigate("ThemeSettingsScreen")}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>
              Theme Settings
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  if (!profileData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ProfileHeader
        profileData={profileData}
        isEditingAvatar={editingSection === "avatar"}
        onEditAvatarPress={() => handleEditPress("avatar")}
        onSaveAvatar={() => handleSave("avatar")}
        onCancelAvatar={handleCancel}
        onChooseImage={handleChooseImage}
        tempAvatarUri={tempAvatarUri}
        isEditingInfo={editingSection === "info"}
        onEditInfoPress={() => handleEditPress("info")}
        onSaveInfo={() => handleSave("info")}
        onCancelInfo={handleCancel}
        tempName={tempName}
        onTempNameChange={setTempName}
        tempDesignation={tempDesignation}
        onTempDesignationChange={setTempDesignation}
        tempPracticeAreas={tempPracticeAreas}
        onTempPracticeAreasChange={setTempPracticeAreas}
      />

      <View style={styles.statsContainer}>
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
          isEditing={editingSection === "yearsOfPractice"}
          tempValue={tempYearsOfPractice}
          onTempValueChange={setTempYearsOfPractice}
          onEditPress={() => handleEditPress("yearsOfPractice")}
          onSave={() => handleSave("yearsOfPractice")}
          onCancel={handleCancel}
        />
      </View>

      <TabSelector
        tabs={profileTabs}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
      />

      <View style={styles.tabContentContainer}>{renderTabContent()}</View>
    </ScrollView>
  );
};

export default ProfileScreen;
