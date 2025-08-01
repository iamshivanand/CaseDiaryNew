import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F9FAFB',
      paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    welcomeCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    welcomeSubtitle: {
      fontSize: 18,
      color: '#6B7280',
      marginTop: 4,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickAction: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 16,
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    quickActionText: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 12,
    },
    emptyMessage: {
      color: '#6B7280',
      textAlign: 'center',
      marginTop: 20,
      fontSize: 14,
    }
  });
