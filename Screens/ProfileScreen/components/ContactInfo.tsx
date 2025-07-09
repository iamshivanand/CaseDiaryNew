import React from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import ContactItem from "./ContactItem";
import { LawyerProfileData } from "../../../Types/appTypes";

interface ContactInfoProps {
  contactDetails: LawyerProfileData["contactInfo"];
}

const ContactInfo: React.FC<ContactInfoProps> = ({ contactDetails }) => {
  const handleEmailPress = () => {
    Linking.openURL(`mailto:${contactDetails.email}`);
  };

  const handlePhonePress = () => {
    Linking.openURL(`tel:${contactDetails.phone}`);
  };

  // For address, you might want to open a map if you have lat/long
  // For now, it will just display the address.
  // const handleAddressPress = () => {
  //   // Example: Linking.openURL(`geo:0,0?q=${contactDetails.address}`);
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Contact Information</Text>
      <ContactItem
        iconName="email-outline"
        text={contactDetails.email}
        onPress={handleEmailPress}
      />
      <ContactItem
        iconName="phone-outline"
        text={contactDetails.phone}
        onPress={handlePhonePress}
      />
      <ContactItem
        iconName="map-marker-outline"
        text={contactDetails.address}
        // onPress={handleAddressPress} // Uncomment if you implement map linking
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10, // Adjusted padding
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10, // Spacing after heading
  },
});

export default ContactInfo;
