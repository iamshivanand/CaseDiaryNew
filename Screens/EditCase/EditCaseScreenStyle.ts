// Screens/EditCase/EditCaseScreenStyle.ts
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const EditCaseScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background (Tailwind gray-100)
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20, // For space before bottom buttons if not fixed
  },
  listContainer: {
    // This container wraps the list of items (documents or timeline events)
    // No specific card style here, items themselves are cards.
    // marginBottom: 10, // Add some space before the "Add New" button if it's outside this container
  },
  addNewButtonContainer: {
    marginTop: 8, // Space after list items, before button
    // marginBottom: 16, // Space after button, now handled by formContainer's paddingBottom or list item margin
  },
  fullWidthDashedButton: {
    // ActionButtonStyle.dashedButton properties are base
    // This is for layout within its container
    width: '100%',
  },
  // Bottom fixed buttons container
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', // White background for button bar
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light gray border (Tailwind gray-200)
  },
  buttonWrapper: {
    flex: 1, // Each button takes roughly half the space
    marginHorizontal: 6, // Space between buttons
  },
  // Placeholder for Bottom Navigation Bar (if any, usually part of a navigator)
  // bottomNavPlaceholder: {
  //   height: 60,
  //   backgroundColor: '#E5E7EB',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   borderTopWidth: 1,
  //   borderTopColor: '#D1D5DB',
  // },
  // bottomNavText: {
  //   color: '#6B7280',
  //   fontSize: 12,
  // },
});
