import React, { useContext } from "react";
import { View, Text, Linking, TouchableOpacity } from "react-native";
import ContactItem from "./ContactItem";
import { LawyerProfileData } from "../../../Types/appTypes";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { getContactInfoStyles } from "./ContactInfoStyle";

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel }) => {
  const { theme } = useContext(ThemeContext);
  const styles = getContactInfoStyles(theme);

  return (
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
};

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
  const { theme } = useContext(ThemeContext);
  const styles = getContactInfoStyles(theme);

  const handleEmailPress = () => Linking.openURL(`mailto:${contactDetails.email}`);
  const handlePhonePress = () => Linking.openURL(`tel:${contactDetails.phone}`);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>Contact Information</Text>
        {!isEditing && (
          <TouchableOpacity onPress={onEditPress} style={styles.editIcon}>
            <Icon name="pencil-outline" size={22} color={theme.colors.primary} />
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
        isEditing={isEditing}
        editText={tempAddress}
        onEditTextChange={onTempAddressChange}
        placeholder="Office Address"
      />

      {isEditing && <EditControls onSave={onSave} onCancel={onCancel} />}
    </View>
  );
};

export default ContactInfo;
