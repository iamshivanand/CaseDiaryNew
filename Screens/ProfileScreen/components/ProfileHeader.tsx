import React, { useContext } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LawyerProfileData } from "../../../Types/appTypes";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { getProfileHeaderStyles } from "./ProfileHeaderStyle";

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
  style?: ViewStyle;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel, style }) => {
  const { theme } = useContext(ThemeContext);
  const styles = getProfileHeaderStyles(theme);

  return (
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
};

interface ProfileHeaderProps {
  profileData: Pick<
    LawyerProfileData,
    "avatarUrl" | "name" | "designation" | "practiceAreas"
  >;
  isEditingAvatar: boolean;
  onEditAvatarPress: () => void;
  onSaveAvatar: () => void;
  onCancelAvatar: () => void;
  onChooseImage: () => void;
  tempAvatarUri?: string | null;
  isEditingInfo: boolean;
  onEditInfoPress: () => void;
  onSaveInfo: () => void;
  onCancelInfo: () => void;
  tempName: string;
  onTempNameChange: (text: string) => void;
  tempDesignation: string;
  onTempDesignationChange: (text: string) => void;
  tempPracticeAreas: string;
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
  const { theme } = useContext(ThemeContext);
  const styles = getProfileHeaderStyles(theme);
  const displayAvatarUri = tempAvatarUri || profileData.avatarUrl || "https://via.placeholder.com/100";

  return (
    <View style={styles.container}>
      <View style={styles.avatarSectionContainer}>
        <Image
          source={{ uri: displayAvatarUri }}
          style={styles.avatar}
        />
        {isEditingAvatar ? (
          <>
            <TouchableOpacity onPress={onChooseImage} style={styles.avatarChangeButton}>
              <Icon name="camera-plus-outline" size={22} color={theme.colors.primary} />
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
            <Icon name="pencil-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSectionContainer}>
        {isEditingInfo ? (
          <>
            <TextInput
              style={[styles.inputBase, styles.nameInput]}
              value={tempName}
              onChangeText={onTempNameChange}
              placeholder="Full Name"
              placeholderTextColor={theme.colors.placeholderText}
            />
            <TextInput
              style={[styles.inputBase, styles.designationInput]}
              value={tempDesignation}
              onChangeText={onTempDesignationChange}
              placeholder="Designation"
              placeholderTextColor={theme.colors.placeholderText}
            />
            <TextInput
              style={[styles.inputBase, styles.practiceAreasInput]}
              value={tempPracticeAreas}
              onChangeText={onTempPracticeAreasChange}
              placeholder="Practice Areas (comma-separated)"
              multiline
              numberOfLines={3}
              placeholderTextColor={theme.colors.placeholderText}
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
              <Icon name="pencil-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default ProfileHeader;
