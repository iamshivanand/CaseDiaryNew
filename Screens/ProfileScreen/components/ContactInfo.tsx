import React from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity } from "react-native";
import ContactItem from "./ContactItem";
import { LawyerProfileData } from "../../../Types/appTypes";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel }) => (
  <View style={styles.editControlsContainer}>
    <TouchableOpacity onPress={onSave} style={[styles.button, styles.saveButton]}>
      <Icon name="check" size={20} color="#fff" />
      <Text style={styles.buttonText}>Save</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelButton]}>
      <Icon name="close" size={20} color="#fff" />
      <Text style={styles.buttonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

interface ContactInfoProps {
  contactDetails: LawyerProfileData["contactInfo"];
  isEditing: boolean;
  tempEmail: string;
  onTempEmailChange: (text: string) => void;
  tempPhone: string;
  onTempPhoneChange: (text: string) => void;
  tempAddress: string;
  onTempAddressChange: (text: string) => void;
  onEditPress: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const ContactInfo: React.FC<ContactInfoProps> = ({
  contactDetails,
  isEditing,
  tempEmail, onTempEmailChange,
  tempPhone, onTempPhoneChange,
  tempAddress, onTempAddressChange,
  onEditPress, onSave, onCancel,
}) => {
  const handleEmailPress = () => Linking.openURL(`mailto:${contactDetails.email}`);
  const handlePhonePress = () => Linking.openURL(`tel:${contactDetails.phone}`);
  // const handleAddressPress = () => Linking.openURL(`geo:0,0?q=${contactDetails.address}`);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>Contact Information</Text>
        {!isEditing && (
          <TouchableOpacity onPress={onEditPress} style={styles.editIcon}>
            <Icon name="pencil-outline" size={22} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      <ContactItem
        iconName="email-outline"
        text={contactDetails.email}
        onPress={handleEmailPress}
        isEditing={isEditing}
        editText={tempEmail}
        onEditTextChange={onTempEmailChange}
        placeholder="Email Address"
        keyboardType="email-address"
      />
      <ContactItem
        iconName="phone-outline"
        text={contactDetails.phone}
        onPress={handlePhonePress}
        isEditing={isEditing}
        editText={tempPhone}
        onEditTextChange={onTempPhoneChange}
        placeholder="Phone Number"
        keyboardType="phone-pad"
      />
      <ContactItem
        iconName="map-marker-outline"
        text={contactDetails.address}
        // onPress={handleAddressPress} // No press action for address when not editing for now
        isEditing={isEditing}
        editText={tempAddress}
        onEditTextChange={onTempAddressChange}
        placeholder="Office Address"
      />

      {isEditing && <EditControls onSave={onSave} onCancel={onCancel} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  editIcon: {
    padding: 5,
  },
  editControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 20, // Add more space before controls in this component
    paddingBottom: 5, // Ensure controls don't touch bottom edge if container has padding
  },
  button: {
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
  buttonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ContactInfo;
