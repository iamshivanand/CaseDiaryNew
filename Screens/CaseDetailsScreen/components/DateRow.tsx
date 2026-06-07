// Screens/CaseDetailsScreen/components/DateRow.tsx
import React, { useContext } from 'react'; // Added useContext
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDateRowStyles } from './DateRowStyle'; // Import function
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path
import { parseISO, isValid } from 'date-fns';
import { useTranslation } from '../../../Providers/LanguageProvider';

interface DateRowProps {
  label: string;
  dateString: string | null | undefined;
  iconName: string;
}

const DateRow: React.FC<DateRowProps> = ({ label, dateString, iconName }) => {
  const { theme } = useContext(ThemeContext); // Get theme
  const { locale } = useTranslation();
  const styles = getDateRowStyles(theme); // Generate styles

  let displayDate = 'N/A';
  let valueStyle = styles.valueNotSet;

  if (dateString && dateString.trim() !== "") {
    try {
      const dateObj = parseISO(dateString);
      if (isValid(dateObj)) {
        displayDate = dateObj.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
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
