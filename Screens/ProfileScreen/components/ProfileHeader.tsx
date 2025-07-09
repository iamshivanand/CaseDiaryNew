import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LawyerProfileData } from "../../../Types/appTypes";

interface ProfileHeaderProps {
  profileData: Pick<
    LawyerProfileData,
    "avatarUrl" | "name" | "designation" | "practiceAreas"
  >;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileData }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: profileData.avatarUrl || "https://via.placeholder.com/100" }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{profileData.name}</Text>
      <Text style={styles.designation}>{profileData.designation}</Text>
      <Text style={styles.practiceAreas}>
        {profileData.practiceAreas.join(", ")}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#fff", // Assuming a white background for this component section
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  designation: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  practiceAreas: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default ProfileHeader;
