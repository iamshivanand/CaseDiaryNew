// Screens/CaseDetailsScreen/components/TimelineEventItemStyle.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider'; // Adjust path as needed

export const getTimelineEventItemStyles = (theme: Theme) => StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary, // Use theme primary
    zIndex: 1,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border || '#E5E7EB', // Use theme border or fallback
  },
  contentBox: {
    flex: 1,
    padding: 14,
    backgroundColor: theme.colors.cardBackground || theme.colors.background, // Use theme card/background
    borderRadius: 8,
    elevation: 1,
    shadowColor: theme.colors.shadow || '#4B5563', // Assuming theme might have a shadow color
    shadowOffset: {width:0, height:1},
    shadowOpacity:0.06,
    shadowRadius:2,
  },
  dateText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary || '#6B7280',
  },
});
