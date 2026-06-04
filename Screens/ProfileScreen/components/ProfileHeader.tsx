import React, { useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LawyerProfileData } from "../../../Types/appTypes";
import { ThemeContext } from "../../../Providers/ThemeProvider";

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
  isEditing: boolean;
  onChooseImage: () => void;
  tempAvatarUri?: string | null;
  tempName: string;
  onTempNameChange: (text: string) => void;
  tempDesignation: string;
  onTempDesignationChange: (text: string) => void;
  tempPracticeAreas: string;
  onTempPracticeAreasChange: (text: string) => void;
  onEditPress: () => void;
  onSavePress: () => void;
  onCancelPress: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileData,
  isEditing,
  onChooseImage,
  tempAvatarUri,
  tempName,
  onTempNameChange,
  tempDesignation,
  onTempDesignationChange,
  tempPracticeAreas,
  onTempPracticeAreasChange,
  onEditPress,
  onSavePress,
  onCancelPress,
}) => {
  const { theme } = useContext(ThemeContext);
  
  const getInitials = (name?: string) => {
    if (!name) return "CD";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const hasImage = !!(tempAvatarUri || (profileData.avatarUrl && !profileData.avatarUrl.includes("placeholder")));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.cardBackground }]}>
      {/* Header Edit/Controls Icon Actions */}
      <View style={styles.headerActionsContainer}>
        {!isEditing ? (
          <TouchableOpacity 
            onPress={onEditPress} 
            style={[styles.smallActionButton, { backgroundColor: theme.colors.inputBackground }]}
            activeOpacity={0.85}
          >
            <Icon name="pencil" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity 
              onPress={onCancelPress} 
              style={[styles.smallActionButton, styles.cancelIconBtn, { marginRight: 8 }]}
              activeOpacity={0.85}
            >
              <Icon name="close" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onSavePress} 
              style={[styles.smallActionButton, styles.saveIconBtn]}
              activeOpacity={0.85}
            >
              <Icon name="check" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSectionContainer}>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarContainer, { borderColor: theme.colors.primary, backgroundColor: theme.colors.cardBackground }]}>
            {hasImage ? (
              <Image
                source={{ uri: tempAvatarUri || profileData.avatarUrl || "" }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.initialsContainer, { backgroundColor: theme.colors.primary + "12" }]}>
                <Text style={[styles.initialsText, { color: theme.colors.primary }]}>
                  {getInitials(profileData.name)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity 
            onPress={onChooseImage} 
            style={[
              styles.avatarChangeButton, 
              { backgroundColor: theme.colors.primary + "15" }
            ]}
          >
            <Icon name="camera-plus-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.avatarChangeButtonText, { color: theme.colors.primary }]}>Change Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info Section */}
      <View style={[styles.infoSectionContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: 1 }]}>
        {isEditing ? (
          <>
            <TextInput
              style={[
                styles.inputBase, 
                styles.nameInput, 
                { 
                  backgroundColor: theme.colors.inputBackground, 
                  color: theme.colors.text, 
                  borderColor: theme.colors.border 
                }
              ]}
              value={tempName}
              onChangeText={onTempNameChange}
              placeholder="Full Name"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={[
                styles.inputBase, 
                styles.designationInput, 
                { 
                  backgroundColor: theme.colors.inputBackground, 
                  color: theme.colors.text, 
                  borderColor: theme.colors.border 
                }
              ]}
              value={tempDesignation}
              onChangeText={onTempDesignationChange}
              placeholder="Designation"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={[
                styles.inputBase, 
                styles.practiceAreasInput, 
                { 
                  backgroundColor: theme.colors.inputBackground, 
                  color: theme.colors.text, 
                  borderColor: theme.colors.border 
                }
              ]}
              value={tempPracticeAreas}
              onChangeText={onTempPracticeAreasChange}
              placeholder="Practice Areas (comma-separated)"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </>
        ) : (
          <>
            <Text style={[styles.name, { color: theme.colors.text }]}>{profileData.name}</Text>
            <Text style={[styles.designation, { color: theme.colors.textSecondary }]}>{profileData.designation}</Text>
            <Text style={[styles.practiceAreas, { color: theme.colors.textSecondary }]}>
              {Array.isArray(profileData.practiceAreas) ? profileData.practiceAreas.join(", ") : profileData.practiceAreas}
            </Text>
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
    position: "relative",
  },
  headerActionsContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  smallActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveIconBtn: {
    backgroundColor: "#22C55E",
  },
  cancelIconBtn: {
    backgroundColor: "#EF4444",
  },
  avatarSectionContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: '100%',
  },
  avatarWrapper: {
    position: "relative",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
  },
  initialsContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 38,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  avatarChangeButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  avatarEditControls: {
  },
  infoSectionContainer: {
    alignItems: "center",
    width: '90%',
    padding: 15,
    borderRadius: 12,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: 'center',
  },
  designation: {
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: "500",
  },
  practiceAreas: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 10,
    marginBottom: 10,
    lineHeight: 18,
  },
  inputBase: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 12,
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
    marginTop: 5,
  },
  editIconTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    borderRadius: 15,
  },
  editControlsBase: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: 'center',
    marginTop: 15,
    width: '100%',
  },
  editButtonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: "#22C55E",
  },
  cancelButton: {
    backgroundColor: "#EF4444",
  },
  editButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ProfileHeader;
