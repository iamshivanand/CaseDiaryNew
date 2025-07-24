// Screens/Addcase/AddCaseStyle.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../../Providers/ThemeProvider';

export const getAddCaseStyles = (theme: Theme) => StyleSheet.create({
  scrollViewStyle: {
    flex: 1,
    backgroundColor: theme.colors.screenBackground || theme.colors.background,
  },
  scrollContentContainerStyle: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formScreenContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: theme.colors.text,
    textAlign: 'center',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
});
