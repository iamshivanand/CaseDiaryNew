// Screens/CaseDetailsScreen/components/TimelineEventItem.tsx
import React, { useContext } from 'react'; // Added useContext
import { View, Text } from 'react-native';
import { getTimelineEventItemStyles } from './TimelineEventItemStyle'; // Import function
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path
import { TimelineEvent } from '../../../Types/appTypes';
import { parseISO, isValid } from 'date-fns';
import { useTranslation } from '../../../Providers/LanguageProvider';

interface TimelineEventItemProps {
  event: TimelineEvent;
  isLastItem?: boolean;
}

const TimelineEventItem: React.FC<TimelineEventItemProps> = ({ event, isLastItem = false }) => {
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
        <Text style={styles.dateText}>{formattedDate()}</Text>
        <Text style={styles.descriptionText}>{event.description || t('timeline_no_desc')}</Text>
      </View>
    </View>
  );
};

export default TimelineEventItem; // Renamed export
