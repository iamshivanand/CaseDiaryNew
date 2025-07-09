// Screens/CaseDetailsScreenV2/components/TimelineEventItemV2.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { TimelineEventItemV2Styles as styles } from './TimelineEventItemV2Style';
import { TimelineEvent } from '../../../Types/appTypes';
import { format, parseISO, isValid } from 'date-fns';

interface TimelineEventItemV2Props {
  event: TimelineEvent;
  isLastItem?: boolean;
}

const TimelineEventItemV2: React.FC<TimelineEventItemV2Props> = ({ event, isLastItem = false }) => {
  const formattedDate = () => {
    if (typeof event.date !== 'string' || !event.date) {
      return 'Date N/A';
    }
    try {
      const dateObj = parseISO(event.date);
      // Example format: "October 20, 2023"
      return isValid(dateObj) ? format(dateObj, "MMMM dd, yyyy") : event.date;
    } catch (e) {
      return event.date; // Fallback if not ISO or parseISO fails for other reasons
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

export default TimelineEventItemV2;
