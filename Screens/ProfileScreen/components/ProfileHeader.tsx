import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LawyerProfileData } from "../../../Types/appTypes";

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
  style?: ViewStyle;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel, style }) => (
  <View style={[styles.editControlsBase, style]}>
    <TouchableOpacity onPress={onSave} style={[styles.editButtonBase, styles.saveButton]}>
      <Icon name="check" size={20} color="#fff" />
      <Text style={styles.editButtonText}>Save</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onCancel} style={[styles.editButtonBase, styles.cancelButton]}>
      <Icon name="close" size={20} color="#fff" />
      <Text style={styles.editButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

interface ProfileHeaderProps {
  profileData: Pick<
    LawyerProfileData,
    "avatarUrl" | "name" | "designation" | "practiceAreas"
  >;

  // Avatar editing props
  isEditingAvatar: boolean;
  onEditAvatarPress: () => void; // Press on pencil icon to start editing avatar
  onSaveAvatar: () => void;    // Save action for avatar
  onCancelAvatar: () => void;   // Cancel action for avatar
  onChooseImage: () => void;    // Action to trigger image picker
  tempAvatarUri?: string | null; // URI of the new image picked by user

  // Info block (name, designation, practice areas) editing props
  isEditingInfo: boolean;
  onEditInfoPress: () => void;   // Press on pencil icon to start editing info
  onSaveInfo: () => void;      // Save action for info
  onCancelInfo: () => void;     // Cancel action for info
  tempName: string;
  onTempNameChange: (text: string) => void;
  tempDesignation: string;
  onTempDesignationChange: (text: string) => void;
  tempPracticeAreas: string; // Storing as comma-separated string for TextInput
  onTempPracticeAreasChange: (text: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileData,
  isEditingAvatar, onEditAvatarPress, onSaveAvatar, onCancelAvatar, onChooseImage, tempAvatarUri,
  isEditingInfo, onEditInfoPress, onSaveInfo, onCancelInfo,
  tempName, onTempNameChange,
  tempDesignation, onTempDesignationChange,
  tempPracticeAreas, onTempPracticeAreasChange,
}) => {
  const displayAvatarUri = tempAvatarUri || profileData.avatarUrl || "https://via.placeholder.com/100";

  return (
    <View style={styles.container}>
      {/* Avatar Section */}
      <View style={styles.avatarSectionContainer}>
        <Image
          source={{ uri: displayAvatarUri }}
          style={styles.avatar}
        />
        {isEditingAvatar ? (
          <>
            <TouchableOpacity onPress={onChooseImage} style={styles.avatarChangeButton}>
              <Icon name="camera-plus-outline" size={22} color="#3B82F6" />
              <Text style={styles.avatarChangeButtonText}>Change Photo</Text>
            </TouchableOpacity>
            <EditControls
              onSave={onSaveAvatar}
              onCancel={onCancelAvatar}
              style={styles.avatarEditControls}
            />
          </>
        ) : (
          <TouchableOpacity onPress={onEditAvatarPress} style={styles.editIconTopRight}>
            <Icon name="pencil-outline" size={22} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Section (Name, Designation, Practice Areas) */}
      <View style={styles.infoSectionContainer}>
        {isEditingInfo ? (
          <>
            <TextInput
              style={[styles.inputBase, styles.nameInput]}
              value={tempName}
              onChangeText={onTempNameChange}
              placeholder="Full Name"
            />
            <TextInput
              style={[styles.inputBase, styles.designationInput]}
              value={tempDesignation}
              onChangeText={onTempDesignationChange}
              placeholder="Designation"
            />
            <TextInput
              style={[styles.inputBase, styles.practiceAreasInput]}
              value={tempPracticeAreas}
              onChangeText={onTempPracticeAreasChange}
              placeholder="Practice Areas (comma-separated)"
              multiline
              numberOfLines={3}
            />
            <EditControls onSave={onSaveInfo} onCancel={onCancelInfo} style={styles.infoEditControls} />
          </>
        ) : (
          <>
            <Text style={styles.name}>{profileData.name}</Text>
            <Text style={styles.designation}>{profileData.designation}</Text>
            <Text style={styles.practiceAreas}>
              {Array.isArray(profileData.practiceAreas) ? profileData.practiceAreas.join(", ") : profileData.practiceAreas}
            </Text>
            <TouchableOpacity onPress={onEditInfoPress} style={styles.editIconTopRight}>
              <Icon name="pencil-outline" size={22} color="#3B82F6" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  // --- Avatar Section ---
  avatarSectionContainer: {
    alignItems: "center",
    marginBottom: 20, // Space between avatar and info sections
    position: 'relative', // For edit icon positioning
    width: '100%', // Ensure it takes full width for centering edit icon
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10, // Space for button or controls
  },
  avatarChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#E0EFFF', // Light blue background
    borderRadius: 20,
    marginBottom: 10,
  },
  avatarChangeButtonText: {
    marginLeft: 8,
    color: '#3B82F6',
    fontWeight: '500',
  },
  avatarEditControls: {
    // Controls are below the change button in edit mode
  },
  // --- Info Section ---
  infoSectionContainer: {
    alignItems: "center",
    width: '90%',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#F9FAFB', // Light background for the info box
    position: 'relative', // For edit icon positioning
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937", // Darker gray
    marginBottom: 4,
    textAlign: 'center',
  },
  designation: {
    fontSize: 16,
    color: "#4B5563", // Medium gray
    marginBottom: 6,
    textAlign: 'center',
  },
  practiceAreas: {
    fontSize: 14,
    color: "#6B7280", // Lighter gray
    textAlign: "center",
    paddingHorizontal: 10,
    marginBottom: 10, // Space before edit icon if not editing
  },
  // --- Inputs for Editing Info ---
  inputBase: {
    width: '100%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: "#D1D5DB", // Gray border
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 12,
    color: '#1F2937',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  designationInput: {
    fontSize: 15,
  },
  practiceAreasInput: {
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  infoEditControls: {
    marginTop: 5, // Add some space above info edit controls
  },
  // --- Common Edit Controls & Icons ---
  editIconTopRight: { // Placed on the top right of its container
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.8)', // Slight background for visibility
    borderRadius: 15,
  },
  editControlsBase: {
    flexDirection: "row",
    justifyContent: "space-evenly", // Evenly space save/cancel
    alignItems: 'center',
    marginTop: 15,
    width: '100%', // Take full width of their container
  },
  editButtonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25, // More rounded
    minWidth: 120, // Ensure buttons have a decent width
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: "#22C55E", // Tailwind Green 500
  },
  cancelButton: {
    backgroundColor: "#EF4444", // Tailwind Red 500
  },
  editButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ProfileHeader;
