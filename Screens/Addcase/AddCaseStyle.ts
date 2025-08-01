// Screens/Addcase/AddCaseStyle.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  scrollViewStyle: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formScreenContainer: {
    padding: 20,
    margin: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#007AFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButtonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
