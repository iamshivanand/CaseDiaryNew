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
  },
  formScreenContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  groupCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
