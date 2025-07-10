// Screens/CaseDetailsScreen/CaseDetailsScreenStyle.ts
import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../../Providers/ThemeProvider'; // Import Theme type

const { width } = Dimensions.get('window');

// Function that returns the styles object, taking theme as an argument
export const getCaseDetailsScreenStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 90,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  centeredText: {
    color: theme.colors.text,
    marginTop: 10,
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E7EB',
  },
  mainCaseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    color: theme.colors.textSecondary || '#6B7280',
    marginBottom: 16,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E7EB',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  documentsSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  timelineSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  noItemsText: {
      textAlign: 'center',
      color: theme.colors.textSecondary || '#6B7280',
      marginTop: 10,
      marginBottom: 10,
      fontStyle: 'italic',
      paddingVertical: 10,
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border || '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bottomActionPrimary: {
    flex: 1,
    marginRight: 6,
  },
  bottomActionSecondary: {
    flex: 1,
    marginLeft: 6,
  },
});
