// Screens/EditCase/components/TimelineItemStyle.ts
import { StyleSheet } from 'react-native';

export const TimelineItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 0, // No margin here, list will handle spacing
    paddingHorizontal: 0, // No padding here, list will handle spacing
  },
  lineAndDotContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 20, // Fixed width for the dot and line column
  },
  dot: {
    width: 12, // Slightly smaller dot
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6', // Tailwind blue-500
    zIndex: 1,
    // Ensure dot is vertically centered with the first line of text in content
    // This might need adjustment based on font sizes and line heights in content
    // marginTop: 4, // Example adjustment
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB', // Tailwind gray-200
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Tailwind gray-50
    borderRadius: 8,
    padding: 12,
    marginBottom: 16, // Space between timeline items cards
    // Shadow for a card-like effect
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to the top
    marginBottom: 6,
  },
  date: {
    fontSize: 14, // Slightly smaller date
    fontWeight: 'bold',
    color: '#1F2937', // Tailwind gray-800
    flexShrink: 1, // Allow date to shrink if actions take space
    marginRight: 8, // Space between date and actions
  },
  actionsContainer: {
    flexDirection: 'row',
    // alignItems: 'center', // Already handled by IconOnlyButton
  },
  actionIcon: {
    // Styles for the IconOnlyButton itself, if needed beyond its internal padding
    // e.g. marginLeft: 4
  },
  description: {
    fontSize: 14,
    color: '#4B5563', // Tailwind gray-600
    lineHeight: 20,
  },
});
