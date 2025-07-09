// Screens/CaseDetailsScreenV2/components/DateRowV2.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DateRowV2Styles as styles } from './DateRowV2Style';
import { format, parseISO, isValid } from 'date-fns'; // Added isValid

interface DateRowV2Props {
  label: string;
  dateString: string | null | undefined;
  iconName: string;
}

const DateRowV2: React.FC<DateRowV2Props> = ({ label, dateString, iconName }) => {
  let displayDate = 'N/A';
  let valueStyle = styles.valueNotSet;

  if (dateString && dateString.trim() !== "") {
    try {
      const dateObj = parseISO(dateString);
      if (isValid(dateObj)) { // Check if the parsed date is valid
        displayDate = format(dateObj, 'MMMM dd, yyyy');
        valueStyle = styles.value;
      } else {
        // If parseISO results in an invalid date object, but dateString itself might be a pre-formatted date
        // This case is tricky; for now, treat as invalid if not ISO.
        // Or, if you expect other common formats, add more parsing logic here.
        displayDate = dateString; // Fallback to original for now if not strictly ISO
        valueStyle = styles.value; // Assume it's a displayable string
      }
    } catch (e) {
      // This catch might not be hit if parseISO returns Invalid Date instead of throwing for all bad inputs
      displayDate = dateString; // Fallback to original string
      valueStyle = styles.value; // Assume it's a displayable string
    }
  }

  return (
    <View style={styles.rowContainer}>
      <Icon name={iconName} size={18} style={styles.icon} />
      <Text style={styles.label}>{label}:</Text>
      <Text style={valueStyle}>{displayDate}</Text>
    </View>
  );
};

export default DateRowV2;
