import React, { useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../../../Providers/ThemeProvider';
import { getEditableStatItemStyles } from './EditableStatItemStyle';

interface EditControlsProps {
  onSave: () => void;
  onCancel: () => void;
}

const EditControls: React.FC<EditControlsProps> = ({ onSave, onCancel }) => {
  const { theme } = useContext(ThemeContext);
  const styles = getEditableStatItemStyles(theme);

  return (
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
};

interface EditableStatItemProps {
  label: string;
  value: number;
  unit?: string;
  isEditing: boolean;
  tempValue: string;
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
  const { theme } = useContext(ThemeContext);
  const styles = getEditableStatItemStyles(theme);

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
            placeholderTextColor={theme.colors.placeholderText}
            keyboardType="number-pad"
          />
          <EditControls onSave={onSave} onCancel={onCancel} />
        </>
      ) : (
        <>
          <TouchableOpacity onPress={onEditPress} style={styles.editIcon}>
            <Icon name="pencil-outline" size={18} color={theme.colors.primary} />
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

export default EditableStatItem;
