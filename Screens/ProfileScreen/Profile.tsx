import React, { useState, useContext, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { mockLawyerProfileData } from "./mockData";
import ProfileHeader from "./components/ProfileHeader";
import ActionButton from "../CommonComponents/ActionButton";
import StatCard from "./components/StatCard"; // For non-editable stats
import EditableStatItem from "./components/EditableStatItem"; // For Years of Practice
import TabSelector from "./components/TabSelector";
import AboutMe from "./components/AboutMe";
import ContactInfo from "./components/ContactInfo";
import Languages from "./components/Languages";
import RecentActivity from "./components/RecentActivity"; // Remains non-editable
import { LawyerProfileData } from "../../Types/appTypes";

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
  const [profileData, setProfileData] =
    useState<LawyerProfileData>(mockLawyerProfileData);
  const [selectedTab, setSelectedTab] = useState<string>("Profile");
  const [editingSection, setEditingSection] = useState<EditableSection>(null);

  // Temporary state for editable fields
  const [tempAvatarUri, setTempAvatarUri] = useState<string | null>(null);
  const [tempName, setTempName] = useState(profileData.name);
  const [tempDesignation, setTempDesignation] = useState(profileData.designation);
  const [tempPracticeAreas, setTempPracticeAreas] = useState(profileData.practiceAreas.join(", "));
  const [tempAboutMe, setTempAboutMe] = useState(profileData.aboutMe);
  const [tempEmail, setTempEmail] = useState(profileData.contactInfo.email);
  const [tempPhone, setTempPhone] = useState(profileData.contactInfo.phone);
  const [tempAddress, setTempAddress] = useState(profileData.contactInfo.address);
  const [tempLanguages, setTempLanguages] = useState(profileData.languages.join(", "));
  const [tempYearsOfPractice, setTempYearsOfPractice] = useState(profileData.stats.yearsOfPractice.toString());

  // Effect to reset temp states if actual data changes from elsewhere (e.g. future API refresh)
  // or when exiting an edit mode.
  useEffect(() => {
    if (!editingSection) {
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
    }
  }, [profileData, editingSection]);


  const handleEditPress = (section: EditableSection) => {
    // Reset temp fields to current profile data before starting to edit a new section
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
    setEditingSection(null); // Resets temp fields via useEffect
  };

  const handleSave = (section: EditableSection) => {
    setProfileData((prev) => {
      let newPracticeAreas = prev.practiceAreas;
      if (section === "info") {
         newPracticeAreas = tempPracticeAreas.split(",").map(s => s.trim()).filter(s => s);
      }
      let newLanguages = prev.languages;
      if (section === "languages") {
        newLanguages = tempLanguages.split(",").map(s => s.trim()).filter(s => s);
      }
      let newYears = prev.stats.yearsOfPractice;
      let newYearsLastUpdated = prev.stats.yearsOfPracticeLastUpdated;
      if (section === "yearsOfPractice") {
        const parsedYears = parseInt(tempYearsOfPractice, 10);
        if (!isNaN(parsedYears)) {
            newYears = parsedYears;
            newYearsLastUpdated = new Date().toISOString().split('T')[0];
        }
      }

      return {
        ...prev,
        avatarUrl: section === "avatar" ? tempAvatarUri : prev.avatarUrl,
        name: section === "info" ? tempName : prev.name,
        designation: section === "info" ? tempDesignation : prev.designation,
        practiceAreas: section === "info" ? newPracticeAreas : prev.practiceAreas,
        aboutMe: section === "about" ? tempAboutMe : prev.aboutMe,
        contactInfo: section === "contact" ? {
          email: tempEmail,
          phone: tempPhone,
          address: tempAddress,
        } : prev.contactInfo,
        languages: section === "languages" ? newLanguages : prev.languages,
        stats: {
            ...prev.stats,
            yearsOfPractice: newYears,
            yearsOfPracticeLastUpdated: newYearsLastUpdated,
        }
      };
    });
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
    const { yearsOfPractice, yearsOfPracticeLastUpdated } = profileData.stats;
    if (!yearsOfPracticeLastUpdated) {
      return yearsOfPractice;
    }
    const lastUpdatedYear = new Date(yearsOfPracticeLastUpdated).getFullYear();
    const currentYear = new Date().getFullYear();
    const diff = currentYear - lastUpdatedYear;
    return yearsOfPractice + (diff > 0 ? diff : 0) ;
  };


  const profileTabs = ["Profile", "Clients", "Reviews", "Settings"];
  // Dummy handlers for old buttons - these are now replaced by edit icons
  // const handleEditProfile = () => console.log("Edit Profile Pressed");
  // const handleViewSchedule = () => console.log("View Schedule Pressed");

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
          <RecentActivity activities={profileData.recentActivity} />
        </>
      );
    } else if (selectedTab === "Clients") {
      return <Text style={styles.tabContentText}>Clients Content Coming Soon</Text>;
    } else if (selectedTab === "Reviews") {
      return <Text style={styles.tabContentText}>Reviews Content Coming Soon</Text>;
    } else if (selectedTab === "Settings") {
      return <Text style={styles.tabContentText}>Settings Content Coming Soon</Text>;
    }
    return null;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" // Important for inputs within ScrollView
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

      {/* Old Action Buttons - can be removed or repurposed if needed */}
      {/* <View style={styles.actionButtonsContainer}> ... </View> */}

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
});

export default ProfileScreen;
