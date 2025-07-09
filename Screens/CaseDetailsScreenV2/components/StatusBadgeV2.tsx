// Screens/CaseDetailsScreenV2/components/StatusBadgeV2.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { StatusBadgeV2Styles as styles } from './StatusBadgeV2Style';

interface StatusBadgeV2Props {
  status: string | null | undefined;
}

const StatusBadgeV2: React.FC<StatusBadgeV2Props> = ({ status }) => {
  const normalizedStatus = (status || 'unknown').toLowerCase().replace(/\s+/g, ''); // e.g. "inprogress"

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

export default StatusBadgeV2;
