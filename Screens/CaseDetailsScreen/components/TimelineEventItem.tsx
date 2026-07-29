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
  onDeleteNotes?: (event: TimelineEvent) => void;
}

const TimelineEventItem: React.FC<TimelineEventItemProps> = ({ event, isLastItem = false, onEditNotes, onDeleteNotes }) => {
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

  const isDateFeePayment = event.event_type === 'date_fee_payment' || (event.description || '').includes('(Date Fee)');
  const isTotalFeePayment = event.event_type === 'total_fee_payment' || (event.description || '').includes('(Total Retainer)');
  const isDateFeeAgreed = event.event_type === 'date_fee_agreed' || (event.description || '').includes('Date Hearing Fee Agreed');
  const isPaymentEvent = isDateFeePayment || isTotalFeePayment || Boolean((event.description || '').match(/(Fee Payment Received|Recorded Payment|Fee Received)/i));

  const getBadgeDetails = () => {
    if (isDateFeeAgreed) {
      return {
        label: '🏷️ Date Fee Agreed',
        bg: theme.isDark ? '#311B92' : '#F3E8FF',
        border: theme.isDark ? '#6B21A8' : '#D8B4FE',
        text: theme.isDark ? '#D8B4FE' : '#7E22CE',
        dotColor: '#A855F7',
      };
    }
    if (isDateFeePayment) {
      return {
        label: '💰 Date Fee Payment',
        bg: theme.isDark ? '#064E3B' : '#DCFCE7',
        border: theme.isDark ? '#059669' : '#86EFAC',
        text: theme.isDark ? '#34D399' : '#15803D',
        dotColor: '#10B981',
      };
    }
    if (isTotalFeePayment) {
      return {
        label: '💵 Total Fee Payment',
        bg: theme.isDark ? '#1E1B4B' : '#EEF2FF',
        border: theme.isDark ? '#4338CA' : '#C7D2FE',
        text: theme.isDark ? '#A5B4FC' : '#4F46E5',
        dotColor: '#6366F1',
      };
    }
    if (isPaymentEvent) {
      return {
        label: '💳 Payment',
        bg: theme.isDark ? '#064E3B' : '#DCFCE7',
        border: theme.isDark ? '#059669' : '#86EFAC',
        text: theme.isDark ? '#34D399' : '#15803D',
        dotColor: '#10B981',
      };
    }
    return {
      label: '📋 Proceeding',
      bg: theme.isDark ? '#334155' : '#F1F5F9',
      border: theme.colors.border,
      text: theme.colors.textSecondary,
      dotColor: theme.colors.primary,
    };
  };

  const badge = getBadgeDetails();

  return (
    <View style={styles.rowContainer}>
      <View style={styles.indicatorContainer}>
        <View style={[styles.dot, { backgroundColor: badge.dotColor }]} />
        {!isLastItem && <View style={styles.line} />}
      </View>
      <View style={[styles.contentBox, isPaymentEvent ? { borderColor: badge.border, borderWidth: 1 } : {}]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={[styles.dateText, { marginBottom: 0 }]}>{formattedDate()}</Text>
            <View style={{ backgroundColor: badge.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: badge.border }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: badge.text }}>{badge.label}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {onEditNotes && (
              <TouchableOpacity onPress={() => onEditNotes(event)} hitSlop={{ top: 10, bottom: 10, left: 8, right: 4 }}>
                <Ionicons name="pencil-sharp" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            {onDeleteNotes && (
              <TouchableOpacity onPress={() => onDeleteNotes(event)} hitSlop={{ top: 10, bottom: 10, left: 4, right: 8 }}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.descriptionText}>{event.description || t('timeline_no_desc')}</Text>
      </View>
    </View>
  );
};

export default TimelineEventItem; // Renamed export
