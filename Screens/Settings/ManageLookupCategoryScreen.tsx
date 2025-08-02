import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import {
  TextInput,
  Button,
  List,
  Text,
  useTheme,
  Divider,
  IconButton,
  ActivityIndicator,
  Dialog,
  Portal,
  Provider as PaperProvider, // To use Dialog
} from 'react-native-paper';
import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native';
import * as db from '../../DataBase'; // Assuming all DB functions are exported
import { CaseType, Court, District, PoliceStation } from '../../DataBase/schema'; // Import types
import { RootStackParamList } from '../../Types/navigationtypes'; // Adjust path

// Define the types for lookup items. Could be a union type.
type LookupItem = CaseType | Court | District | PoliceStation;

type ManageLookupCategoryScreenRouteProp = RouteProp<
  RootStackParamList,
  'ManageLookupCategoryScreen'
>;

// A mock user ID. In a real app, this would come from an auth context.
const MOCK_USER_ID = 1; // Replace with actual user ID when auth is implemented

const ManageLookupCategoryScreen = () => {
  const theme = useTheme();
  const route = useRoute<ManageLookupCategoryScreenRouteProp>();
  const { categoryName, title } = route.params;

  const [items, setItems] = useState<LookupItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // For editing (optional, can be expanded later)
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [editedName, setEditedName] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedItems: LookupItem[] = [];
      // TODO: Get current logged-in user ID when auth is implemented
      const currentUserId = MOCK_USER_ID;

      switch (categoryName) {
        case 'CaseTypes':
          fetchedItems = await db.getCaseTypes(currentUserId);
          break;
        case 'Courts':
          fetchedItems = await db.getCourts(currentUserId);
          break;
        case 'Districts':
          // Districts might have 'state' as well, handle accordingly if adding/editing
          fetchedItems = await db.getDistricts(currentUserId);
          break;
        case 'PoliceStations':
          // PoliceStations might need districtId if showing contextually, or show all
          fetchedItems = await db.getPoliceStations(undefined, currentUserId);
          break;
        default:
          console.warn('Unknown category:', categoryName);
      }
      setItems(fetchedItems);
    } catch (error) {
      console.error(`Error fetching ${categoryName}:`, error);
      Alert.alert('Error', `Failed to fetch ${title}.`);
    } finally {
      setLoading(false);
    }
  }, [categoryName, title]);

  useFocusEffect(
    useCallback(() => {
      console.log("ManageLookupCategoryScreen rendered");
      fetchData();
    }, [fetchData])
  );

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    setIsAdding(true);
    try {
      // TODO: Get current logged-in user ID
      const currentUserId = MOCK_USER_ID;
      let success = false;
      let newId: number | null = null;

      switch (categoryName) {
        case 'CaseTypes':
          newId = await db.addCaseType(newItemName.trim(), currentUserId);
          break;
        case 'Courts':
          newId = await db.addCourt(newItemName.trim(), currentUserId);
          break;
        case 'Districts':
          // For districts, you might need a state field as well.
          // This simplified version only adds name.
          newId = await db.addDistrict(newItemName.trim(), undefined, currentUserId);
          break;
        case 'PoliceStations':
          // For police stations, you might need a district_id.
          // This simplified version only adds name.
          newId = await db.addPoliceStation(newItemName.trim(), undefined, currentUserId);
          break;
        default:
          Alert.alert('Error', 'Cannot add item for unknown category.');
          setIsAdding(false);
          return;
      }
      success = newId !== null;

      if (success) {
        setNewItemName('');
        fetchData(); // Refresh list
        Alert.alert('Success', `${categoryName.slice(0, -1)} added successfully.`);
      } else {
        Alert.alert('Error', `Failed to add ${categoryName.slice(0, -1)}.`);
      }
    } catch (error: any) {
      console.error(`Error adding ${categoryName}:`, error);
      Alert.alert('Error', error.message || `An error occurred while adding ${title}.`);
    } finally {
      setIsAdding(false);
    }
  };

  const openEditDialog = (item: LookupItem) => {
    if (item.user_id !== MOCK_USER_ID) { // Only allow editing user's own items
        Alert.alert("Permission Denied", "You can only edit items you created.");
        return;
    }
    setEditingItem(item);
    setEditedName(item.name);
    setDialogVisible(true);
  };

  const handleEditItem = async () => {
    if (!editingItem || !editedName.trim()) return;

    // Ensure it's a user-specific item
    if (editingItem.user_id !== MOCK_USER_ID) {
        Alert.alert("Error", "Cannot edit global items or items not created by you.");
        setDialogVisible(false);
        return;
    }

    setLoading(true); // Use general loading or a specific editing loader
    try {
        let success = false;
        switch (categoryName) {
            case 'CaseTypes':
                success = await db.updateCaseType(editingItem.id, editedName.trim(), MOCK_USER_ID);
                break;
            case 'Courts':
                success = await db.updateCourt(editingItem.id, editedName.trim(), MOCK_USER_ID);
                break;
            // Add cases for Districts, PoliceStations if they support editing
            // Remember to handle fields like 'state' for Districts or 'district_id' for PoliceStations
            default:
                Alert.alert("Error", "Editing not supported for this category yet.");
        }
        if (success) {
            Alert.alert("Success", `${categoryName.slice(0, -1)} updated.`);
            fetchData();
        } else {
            Alert.alert("Error", `Failed to update ${categoryName.slice(0, -1)}.`);
        }
    } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to update item.");
    } finally {
        setLoading(false);
        setDialogVisible(false);
        setEditingItem(null);
    }
  };


  const confirmDeleteItem = (item: LookupItem) => {
     if (item.user_id !== MOCK_USER_ID) { // Only allow deleting user's own items
        Alert.alert("Permission Denied", "You can only delete items you created.");
        return;
    }
    Alert.alert(
        "Confirm Delete",
        `Are you sure you want to delete "${item.name}"? This might affect existing cases using this item.`,
        [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => handleDeleteItem(item.id) }
        ]
    );
  };

  const handleDeleteItem = async (itemId: number) => {
    setLoading(true);
    try {
        let success = false;
         switch (categoryName) {
            case 'CaseTypes':
                success = await db.deleteCaseType(itemId, MOCK_USER_ID);
                break;
            case 'Courts':
                success = await db.deleteCourt(itemId, MOCK_USER_ID);
                break;
            // Add cases for Districts, PoliceStations
            default:
                Alert.alert("Error", "Deletion not supported for this category yet.");
        }
        if (success) {
            Alert.alert("Success", `${categoryName.slice(0, -1)} deleted.`);
            fetchData();
        } else {
            Alert.alert("Error", `Failed to delete ${categoryName.slice(0, -1)}. It might be in use or you don't have permission.`);
        }
    } catch (error: any) {
         Alert.alert("Error", error.message || "Failed to delete item.");
    } finally {
        setLoading(false);
    }
  };


  const renderItem = ({ item }: { item: LookupItem }) => {
    const isUserSpecific = item.user_id === MOCK_USER_ID; // Adjust with real user ID
    const isGlobal = item.user_id === null || item.user_id === undefined;

    let subtitle = '';
    if (isGlobal) subtitle = 'Global';
    else if (isUserSpecific) subtitle = 'Custom (You)';
    else subtitle = 'Custom (Other User)'; // Should ideally not happen if DB queries are correct

    if (categoryName === 'Districts' && 'state' in item && item.state) {
        subtitle += ` - ${item.state}`;
    }
    // Add more specific subtitles if needed, e.g., for PoliceStations showing district name

    return (
      <List.Item
        title={item.name}
        description={subtitle}
        titleStyle={{ color: theme.colors.onSurface }}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        right={(props) => (
            isUserSpecific ? (
                <View style={{ flexDirection: 'row'}}>
                    <IconButton {...props} icon="pencil" onPress={() => openEditDialog(item)} />
                    <IconButton {...props} icon="delete" onPress={() => confirmDeleteItem(item)} iconColor={theme.colors.error} />
                </View>
            ) : null
        )}
      />
    );
  };

  if (loading && items.length === 0) { // Show full screen loader only on initial load
    return <ActivityIndicator animating={true} size="large" style={styles.loader} />;
  }

  return (
    <PaperProvider>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.inputContainer}>
          <TextInput
            label={`New ${categoryName.slice(0, -1)} Name`}
            value={newItemName}
            onChangeText={setNewItemName}
            mode="outlined"
            style={styles.input}
            dense
          />
          <Button
            mode="contained"
            onPress={handleAddItem}
            loading={isAdding}
            disabled={isAdding || loading}
            style={styles.addButton}
            icon="plus"
          >
            Add
          </Button>
        </View>

        {loading && items.length > 0 && <ActivityIndicator animating={true} style={{ marginVertical: 10}}/>}

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No {title} found.</Text> : null}
          contentContainerStyle={styles.listContent}
        />
         <Portal>
            <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                <Dialog.Title>Edit {editingItem?.name}</Dialog.Title>
                <Dialog.Content>
                    <TextInput
                        label="New Name"
                        value={editedName}
                        onChangeText={setEditedName}
                        mode="outlined"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                    <Button onPress={handleEditItem} disabled={loading}>Save</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    justifyContent: 'center', // Align icon and text vertically
    height: 50, // Match TextInput outlined dense height approx
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default ManageLookupCategoryScreen;
