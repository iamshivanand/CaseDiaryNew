import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel }) => (
  <View style={styles.editControlsContainer}>
    <TouchableOpacity onPress={onSave} style={[styles.button, styles.saveButton]}>
      <Icon name="check" size={18} color="#fff" />
      <Text style={styles.buttonText}>Save</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelButton]}>
      <Icon name="close" size={18} color="#fff" />
      <Text style={styles.buttonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

interface EditableStatItemProps {
  label: string;
  value: number; // The calculated display value
  unit?: string;
  isEditing: boolean;
  tempValue: string; // Stored as string for TextInput
  onTempValueChange: (text: string) => void;
  onEditPress: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditableStatItem: React.FC<EditableStatItemProps> = ({
  label,
  value,
  unit,
  isEditing,
  tempValue,
  onTempValueChange,
  onEditPress,
  onSave,
  onCancel,
}) => {
  return (
    <View style={[styles.card, isEditing && styles.editingCard]}>
      {isEditing ? (
        <>
          <Text style={styles.labelEditing}>{label}</Text>
          <TextInput
            style={styles.textInput}
            value={tempValue}
            onChangeText={onTempValueChange}
            placeholder="Years"
            keyboardType="number-pad"
          />
          <EditControls onSave={onSave} onCancel={onCancel} />
        </>
      ) : (
        <>
          <TouchableOpacity onPress={onEditPress} style={styles.editIcon}>
            <Icon name="pencil-outline" size={18} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.valueText}>
            {value}
            {unit && <Text style={styles.unitText}> {unit}</Text>}
          </Text>
          <Text style={styles.labelText}>{label}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    position: 'relative', // For edit icon
  },
  editingCard: {
    paddingVertical: 20, // More space when editing
  },
  editIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  valueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 5,
  },
  unitText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#3B82F6',
  },
  labelText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  labelEditing: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    fontSize: 18,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '80%', // Adjust width as needed
    textAlign: 'center',
    marginBottom: 15,
  },
  editControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%', // Take full width for controls
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    minWidth: 90, // Smaller buttons for stat item
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#22C55E',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
    fontSize: 13,
  },
});

export default EditableStatItem;
