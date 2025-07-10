// Screens/CaseDetailsScreen/components/DateRow.tsx
import React, { useContext } from 'react'; // Added useContext
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDateRowStyles } from './DateRowStyle'; // Import function
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path
import { format, parseISO, isValid } from 'date-fns';

interface DateRowProps {
  label: string;
  dateString: string | null | undefined;
  iconName: string;
}

const DateRow: React.FC<DateRowProps> = ({ label, dateString, iconName }) => {
  const { theme } = useContext(ThemeContext); // Get theme
  const styles = getDateRowStyles(theme); // Generate styles

  let displayDate = 'N/A';
  let valueStyle = styles.valueNotSet;

  if (dateString && dateString.trim() !== "") {
    try {
      const dateObj = parseISO(dateString);
      if (isValid(dateObj)) {
        displayDate = format(dateObj, 'MMMM dd, yyyy');
        valueStyle = styles.value;
      } else {
        displayDate = dateString;
        valueStyle = styles.value;
      }
    } catch (e) {
      displayDate = dateString;
      valueStyle = styles.value;
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

export default DateRow; // Renamed export
