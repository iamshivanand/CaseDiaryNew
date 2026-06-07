// Screens/CaseDetailsScreen/components/StatusBadge.tsx
import React, { useContext } from 'react'; // Added useContext
import { View, Text } from 'react-native';
import { getStatusBadgeStyles } from './StatusBadgeStyle'; // Import function
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path
import { useTranslation } from '../../../Providers/LanguageProvider';

interface StatusBadgeProps {
  status: string | null | undefined;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { theme } = useContext(ThemeContext); // Get theme
  const { t } = useTranslation();
  const styles = getStatusBadgeStyles(theme); // Generate styles

  const normalizedStatus = (status || 'unknown').toLowerCase().replace(/\s+/g, '');

  let badgeStyle = styles.defaultStatus;
  let textStyle = styles.defaultStatusText;

  if (normalizedStatus.includes('open')) {
    badgeStyle = styles.open;
    textStyle = styles.openText;
  } else if (normalizedStatus.includes('inprogress')) {
    badgeStyle = styles.inProgress;
    textStyle = styles.inProgressText;
  } else if (normalizedStatus.includes('closed')) {
    badgeStyle = styles.closed;
    textStyle = styles.closedText;
  } else if (normalizedStatus.includes('onhold')) {
    badgeStyle = styles.onHold;
    textStyle = styles.onHoldText;
  } else if (normalizedStatus.includes('appealed')) {
    badgeStyle = styles.appealed;
    textStyle = styles.appealedText;
  }

  const getTranslatedStatus = (st: string | null | undefined) => {
    if (!st) return 'N/A';
    const clean = st.toLowerCase().replace(/\s+/g, '');
    switch (clean) {
      case 'open': return t('option_status_open');
      case 'inprogress': return t('option_status_in_progress');
      case 'closed': return t('option_status_closed');
      case 'onhold': return t('option_status_on_hold');
      case 'appealed': return t('option_status_appealed');
      default: return st;
    }
  };

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{getTranslatedStatus(status)}</Text>
    </View>
  );
};

export default StatusBadge;
