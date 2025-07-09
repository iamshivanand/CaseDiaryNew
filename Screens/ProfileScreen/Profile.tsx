import React, { useState, useContext } from "react";
import { View, ScrollView, StyleSheet, Text } from "react-native";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { mockLawyerProfileData } from "./mockData"; // Mock data
import ProfileHeader from "./components/ProfileHeader";
import ActionButton from "../CommonComponents/ActionButton"; // Common component
import StatCard from "./components/StatCard";
import TabSelector from "./components/TabSelector";
import AboutMe from "./components/AboutMe";
import ContactInfo from "./components/ContactInfo";
import Languages from "./components/Languages";
import RecentActivity from "./components/RecentActivity";
import { LawyerProfileData } from "../../Types/appTypes";

// Icons (ensure you have react-native-vector-icons installed)
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [profileData] // Omitted: , setProfileData
    = useState<LawyerProfileData>(mockLawyerProfileData);
  const [selectedTab, setSelectedTab] = useState<string>("Profile");

  const profileTabs = ["Profile", "Clients", "Reviews", "Settings"];

  // Dummy handlers for buttons
  const handleEditProfile = () => console.log("Edit Profile Pressed");
  const handleViewSchedule = () => console.log("View Schedule Pressed");

  const renderTabContent = () => {
    if (selectedTab === "Profile") {
      return (
        <>
          <AboutMe description={profileData.aboutMe} />
          <ContactInfo contactDetails={profileData.contactInfo} />
          <Languages languages={profileData.languages} />
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
    >
      <ProfileHeader
        profileData={{
          avatarUrl: profileData.avatarUrl,
          name: profileData.name,
          designation: profileData.designation,
          practiceAreas: profileData.practiceAreas,
        }}
      />

      <View style={styles.actionButtonsContainer}>
        <ActionButton
          title="Edit Profile"
          onPress={handleEditProfile}
          type="primary"
          style={styles.actionButton}
        />
        <ActionButton
          title="View Schedule"
          onPress={handleViewSchedule}
          type="secondary"
          style={styles.actionButton}
        />
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          label="Total Cases"
          value={profileData.stats.totalCases}
        />
        <StatCard
          label="Upcoming Hearings"
          value={profileData.stats.upcomingHearings}
        />
        <StatCard
          label="Years of Practice"
          value={profileData.stats.yearsOfPractice}
          unit="yrs"
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
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff", // Or theme.colors.background if it fits
  },
  actionButton: {
    flex: 1, // Make buttons take equal width
    marginHorizontal: 8, // Add some space between buttons
    height: 44, // Standard button height
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB", // A slightly off-white background for this section
  },
  tabContentContainer: {
    padding: 15,
  },
  tabContentText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 30,
    color: "#555"
  }
});

export default ProfileScreen;
