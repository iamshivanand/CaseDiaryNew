// Screens/EditCase/components/TimelineItem.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TimelineItemStyles } from './TimelineItemStyle';
import IconOnlyButton from '../../CommonComponents/IconOnlyButton'; // Adjusted path
import { TimelineEvent } from '../../../Types/appTypes'; // Adjusted path
import { format, parseISO } from 'date-fns';

interface TimelineItemProps {
  item: TimelineEvent;
  onEdit: (item: TimelineEvent) => void;
  onDelete: (item: TimelineEvent) => void;
  isLastItem?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ item, onEdit, onDelete, isLastItem = false }) => {
  const formattedDate = () => {
    try {
      const date = parseISO(item.date);
      return format(date, "MMM dd, yyyy");
    } catch {
      return item.date;
    }
  };

  return (
    <View style={TimelineItemStyles.container}>
      <View style={TimelineItemStyles.lineAndDotContainer}>
        <View style={TimelineItemStyles.dot} />
        {!isLastItem && <View style={TimelineItemStyles.line} />}
      </View>
      <View style={TimelineItemStyles.contentContainer}>
        <View style={TimelineItemStyles.header}>
          <Text style={TimelineItemStyles.date}>{formattedDate()}</Text>
          <View style={TimelineItemStyles.actionsContainer}>
            <IconOnlyButton
              icon={<MaterialIcons name="edit" size={20} color="#6B7280" />}
              onPress={() => onEdit(item)}
              accessibilityLabel="Edit timeline event"
              style={TimelineItemStyles.actionIcon}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
            />
            <IconOnlyButton
              icon={<MaterialIcons name="delete" size={20} color="#EF4444" />}
              onPress={() => onDelete(item)}
              accessibilityLabel="Delete timeline event"
              style={TimelineItemStyles.actionIcon}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            />
          </View>
        </View>
        <Text style={TimelineItemStyles.description}>{item.description}</Text>
      </View>
    </View>
  );
};

export default TimelineItem;
