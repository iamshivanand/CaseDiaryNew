import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'; // Removed Dimensions
import { CaseDataScreen } from '../../../Types/appTypes'; // Adjust path as necessary

interface NewCaseCardProps {
  caseDetails: CaseDataScreen;
  onUpdateHearingPress?: (caseId: string | number | undefined) => void; // Optional: If you want to handle press in parent
}

const statusColors = {
  Active: '#4CAF50', // Green
  Pending: '#FF9800', // Orange
  Closed: '#9E9E9E',   // Grey
};

const NewCaseCard: React.FC<NewCaseCardProps> = ({ caseDetails, onUpdateHearingPress }) => {
  const { title, client, status, nextHearing, lastUpdate, previousHearing, id } = caseDetails;

  const handleUpdatePress = () => {
    if (onUpdateHearingPress) {
      onUpdateHearingPress(id);
    } else {
      // Default action or navigation if not handled by parent
      console.log('Update Hearing pressed for case ID:', id);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[status] }]}>
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.clientInfo}>Client: {client}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Next Hearing:</Text>
          <Text style={styles.detailValue}>{nextHearing}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Update:</Text>
          <Text style={styles.detailValue}>{lastUpdate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Previous Hearing:</Text>
          <Text style={styles.detailValue}>{previousHearing}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePress}>
        <Text style={styles.updateButtonText}>Update Hearing</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16, // Or use Dimensions to make it more responsive
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android shadow
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flexShrink: 1, // Allows text to shrink and wrap if too long
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12, // Make it more pill-shaped
    marginLeft: 8, // Add some space between title and badge
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  clientInfo: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#777777',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#444444',
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#007AFF', // Blue color
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NewCaseCard;
