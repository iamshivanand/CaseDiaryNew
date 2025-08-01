// Screens/Addcase/AddCaseStyle.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../../Providers/ThemeProvider';

export const getAddCaseStyles = (theme: Theme) => StyleSheet.create({
  scrollViewStyle: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formScreenContainer: {
    padding: 20,
    margin: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButtonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
