// Screens/CaseDetailsScreen/components/TimelineEventItem.tsx
import React, { useContext } from 'react'; // Added useContext
import { View, Text } from 'react-native';
import { getTimelineEventItemStyles } from './TimelineEventItemStyle'; // Import function
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path
import { TimelineEvent } from '../../../Types/appTypes';
import { format, parseISO, isValid } from 'date-fns';

interface TimelineEventItemProps {
  event: TimelineEvent;
  isLastItem?: boolean;
}

const TimelineEventItem: React.FC<TimelineEventItemProps> = ({ event, isLastItem = false }) => {
  const { theme } = useContext(ThemeContext); // Get theme
  const styles = getTimelineEventItemStyles(theme); // Generate styles
  const formattedDate = () => {
    if (typeof event.date !== 'string' || !event.date) {
      return 'Date N/A';
    }
    try {
      const dateObj = parseISO(event.date);
      return isValid(dateObj) ? format(dateObj, "MMMM dd, yyyy") : event.date;
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
        <Text style={styles.descriptionText}>{event.description || 'No description provided.'}</Text>
      </View>
    </View>
  );
};

export default TimelineEventItem; // Renamed export
