// Screens/EditCase/components/DocumentItemStyle.ts
import { StyleSheet } from 'react-native';

export const DocumentItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16, // Increased horizontal padding
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10, // Space between items
    // Shadow for a card-like effect
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, // Softer shadow
    shadowRadius: 3,
    elevation: 2, // For Android
  },
  fileIconContainer: {
    marginRight: 16, // Increased spacing
    width: 40, // Fixed size for the icon background
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF', // Lighter blue background for icon (Tailwind blue-50)
    borderRadius: 20, // Circular background
  },
  textContainer: {
    flex: 1, // Take remaining space
    justifyContent: 'center',
    marginRight: 8, // Space before action icons
  },
  fileName: {
    fontSize: 15, // Slightly smaller for balance
    fontWeight: '600',
    color: '#1F2937', // Tailwind gray-800
    marginBottom: 2,
  },
  uploadDate: {
    fontSize: 13, // Slightly larger for readability
    color: '#6B7280', // Tailwind gray-500
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    // IconOnlyButton already has padding, so marginLeft might not be needed
    // or can be adjusted if more space is desired.
    // Example: marginLeft: 4 if IconOnlyButton padding is small
  },
});
