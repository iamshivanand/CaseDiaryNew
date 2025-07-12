// Screens/CaseDetailsScreen/components/StatusBadge.tsx
import React, { useContext } from 'react'; // Added useContext
import { View, Text } from 'react-native';
import { getStatusBadgeStyles } from './StatusBadgeStyle'; // Import function
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path

interface StatusBadgeProps {
  status: string | null | undefined;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { theme } = useContext(ThemeContext); // Get theme
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

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{status || 'N/A'}</Text>
    </View>
  );
};

export default StatusBadge;
