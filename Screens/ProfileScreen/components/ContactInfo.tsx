import React, { useContext } from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity } from "react-native";
import ContactItem from "./ContactItem";
import { LawyerProfileData } from "../../../Types/appTypes";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface ContactInfoProps {
  contactDetails: LawyerProfileData["contactInfo"];
  isEditing: boolean;
  tempEmail: string;
  onTempEmailChange: (text: string) => void;
  tempPhone: string;
  onTempPhoneChange: (text: string) => void;
  tempAddress: string;
  onTempAddressChange: (text: string) => void;
}

const ContactInfo: React.FC<ContactInfoProps> = ({
  contactDetails,
  isEditing,
  tempEmail, onTempEmailChange,
  tempPhone, onTempPhoneChange,
  tempAddress, onTempAddressChange,
}) => {
  const { theme } = useContext(ThemeContext);
  const handleEmailPress = () => Linking.openURL(`mailto:${contactDetails.email}`);
  const handlePhonePress = () => Linking.openURL(`tel:${contactDetails.phone}`);

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.border,
          borderWidth: 1,
        }
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Contact Information</Text>
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
        isEditing={isEditing}
        editText={tempAddress}
        onEditTextChange={onTempAddressChange}
        placeholder="Office Address"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
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
  },
  editIcon: {
    padding: 5,
  },
  editControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 20,
    paddingBottom: 5,
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
