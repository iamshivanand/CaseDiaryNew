// Screens/CaseDetailsScreen/components/TimelineEventItem.tsx
import React, { useContext } from 'react'; // Added useContext
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTimelineEventItemStyles } from './TimelineEventItemStyle'; // Import function
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path
import { TimelineEvent } from '../../../Types/appTypes';
import { parseISO, isValid } from 'date-fns';
import { useTranslation } from '../../../Providers/LanguageProvider';

interface TimelineEventItemProps {
  event: TimelineEvent;
  isLastItem?: boolean;
  onEditNotes?: (event: TimelineEvent) => void;
}

const TimelineEventItem: React.FC<TimelineEventItemProps> = ({ event, isLastItem = false, onEditNotes }) => {
  const { theme } = useContext(ThemeContext); // Get theme
  const { t, locale } = useTranslation();
  const styles = getTimelineEventItemStyles(theme); // Generate styles
  const formattedDate = () => {
    if (typeof event.date !== 'string' || !event.date) {
      return t('timeline_date_na');
    }
    try {
      const dateObj = parseISO(event.date);
      return isValid(dateObj)
        ? dateObj.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : event.date;
    } catch (e) {
      return event.date;
    }
  };

  return (
    <View style={styles.rowContainer}>
      <View style={styles.indicatorContainer}>
        <View style={styles.dot} />
        {!isLastItem && <View style={styles.line} />}
      </View>
      <View style={styles.contentBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={[styles.dateText, { marginBottom: 0 }]}>{formattedDate()}</Text>
          {onEditNotes && (
            <TouchableOpacity onPress={() => onEditNotes(event)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="pencil-sharp" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.descriptionText}>{event.description || t('timeline_no_desc')}</Text>
      </View>
    </View>
  );
};

export default TimelineEventItem; // Renamed export
