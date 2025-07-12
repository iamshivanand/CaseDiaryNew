import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // Removed useRoute, RouteProp
import React, { useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from "react-native"; // Removed Dimensions, ScrollView

// import {
//   getCases,
//   searchCases,
// } from "../../DataBase"; // DB functions will be adapted or replaced by sample data initially
import { ThemeContext } from "../../Providers/ThemeProvider";
// import { formatDate } from "../../utils/commonFunctions"; // May not be needed with new data structure
import NewCaseCard from "./components/NewCaseCard"; // Import the new case card
import { CaseDataScreen } from "../../Types/appTypes"; // Import the new data type

// const windowWidth = Dimensions.get("window").width; // Removed as not used in current styles

// Sample Data based on requirements
const sampleCases: CaseDataScreen[] = [
  {
    id: "1",
    title: "Estate of Johnson",
    client: "Sarah Johnson",
    status: "Active",
    nextHearing: "Dec 15, 2023",
    lastUpdate: "Nov 20, 2023",
    previousHearing: "Oct 25, 2023",
  },
  {
    id: "2",
    title: "Smith vs. Jones",
    client: "Michael Smith",
    status: "Pending",
    nextHearing: "Jan 10, 2024",
    lastUpdate: "Nov 18, 2023",
    previousHearing: "Sep 30, 2023",
  },
  {
    id: "3",
    title: "Alpha Corp Litigation",
    client: "Alpha Corp",
    status: "Active",
    nextHearing: "Feb 22, 2024",
    lastUpdate: "Jan 05, 2024",
    previousHearing: "Dec 01, 2023",
  },
  {
    id: "4",
    title: "Property Dispute - Williams",
    client: "Robert Williams",
    status: "Closed",
    nextHearing: "N/A",
    lastUpdate: "Oct 10, 2023",
    previousHearing: "Sep 15, 2023",
  },
  {
    id: "5",
    title: "Commercial Contract - Davis",
    client: "Linda Davis",
    status: "Pending",
    nextHearing: "Mar 05, 2024",
    lastUpdate: "Jan 15, 2024",
    previousHearing: "Nov 25, 2023",
  },
   {
    id: "6",
    title: "Another Active Case",
    client: "Active Client",
    status: "Active",
    nextHearing: "Mar 01, 2024",
    lastUpdate: "Jan 20, 2024",
    previousHearing: "Dec 10, 2023",
  },
  {
    id: "7",
    title: "A Closed Case",
    client: "Closed Client Inc.",
    status: "Closed",
    nextHearing: "N/A",
    lastUpdate: "Sep 01, 2023",
    previousHearing: "Aug 01, 2023",
  },
];

type FilterStatus = "Active" | "Closed";

const CasesList = (/*{ navigation, routes }*/) => { // Removed navigation, routes from props as useNavigation is used
  // const route = useRoute<CasesListRouteProp>(); // Not using route params for now
  // const { params } = route;
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext); // Keep theme for styling

  const [allCases, setAllCases] = useState<CaseDataScreen[]>(sampleCases); // Initialize with sample data
  const [filteredCases, setFilteredCases] = useState<CaseDataScreen[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("Active");

  // Initial data load and filtering
  useEffect(() => {
    // fetchData(); // Replace with actual data fetching if needed
    filterAndSearchCases();
  }, [activeFilter, searchText, allCases]); // Re-filter when filter, search text, or allCases change

  // const fetchData = async () => {
  //   try {
  //     // Replace with actual DB call if using getCases
  //     // const results = await getCases(/* userId */);
  //     // setAllCases(results ? results.map(transformApiCaseToCaseDataScreen) : []); // Transform if necessary
  //     setAllCases(sampleCases); // Using sample data
  //   } catch (error) {
  //     console.error("Error fetching cases:", error);
  //     setAllCases([]);
  //   }
  // };

  const filterAndSearchCases = () => {
    let tempCases = allCases;

    // Filter by status
    if (activeFilter === "Active") {
      tempCases = tempCases.filter(c => c.status === "Active" || c.status === "Pending");
    } else if (activeFilter === "Closed") {
      tempCases = tempCases.filter(c => c.status === "Closed");
    }

    // Filter by search text (searches title and client)
    if (searchText.trim() !== "") {
      const lowerSearchText = searchText.toLowerCase();
      tempCases = tempCases.filter(
        (c) =>
          c.title.toLowerCase().includes(lowerSearchText) ||
          c.client.toLowerCase().includes(lowerSearchText)
      );
    }
    setFilteredCases(tempCases);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleUpdateHearing = (caseId: string | number | undefined) => {
    console.log("Update Hearing pressed for case ID from list:", caseId);
    // Navigate to update hearing screen or show modal
  };

  const navigateToAddCase = () => {
    // @ts-ignore
    navigation.navigate("AddCase"); // Assuming 'AddCase' is the name of the route for adding a new case
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Cases</Text>
        <TouchableOpacity onPress={navigateToAddCase} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={32} color={theme.colors.primary || "#007AFF"} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.inputWrapper, {backgroundColor: theme.colors.card}]}>
          <AntDesign
            name="search1"
            size={20}
            color={theme.colors.textSecondary || "#8E8E93"}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Search cases..."
            placeholderTextColor={theme.colors.textSecondary || "#8E8E93"}
            onChangeText={handleSearchChange}
            value={searchText}
          />
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeFilter === "Active" ? styles.activeButton : styles.inactiveButton,
            activeFilter === "Active" ? { backgroundColor: theme.colors.primary || '#007AFF' } : { backgroundColor: theme.colors.cardDeep ||'#E0E0E0'}
          ]}
          onPress={() => setActiveFilter("Active")}
        >
          <Text style={activeFilter === "Active" ? styles.activeButtonText : [styles.inactiveButtonText, {color: theme.colors.text}]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeFilter === "Closed" ? styles.activeButton : styles.inactiveButton,
            activeFilter === "Closed" ? { backgroundColor: theme.colors.primary || '#007AFF' } : { backgroundColor: theme.colors.cardDeep ||'#E0E0E0'}
          ]}
          onPress={() => setActiveFilter("Closed")}
        >
          <Text style={activeFilter === "Closed" ? styles.activeButtonText : [styles.inactiveButtonText, {color: theme.colors.text}]}>
            Closed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCases}
        renderItem={({ item }) => (
          <NewCaseCard
            caseDetails={item}
            onUpdateHearingPress={handleUpdateHearing}
          />
        )}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()} // Ensure key is a string
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={[styles.emptyListText, {color: theme.colors.textSecondary}]}>No cases found.</Text>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
};

export default CasesList;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    // borderBottomWidth: 1, // Optional: if you want a separator
    // borderBottomColor: '#E0E0E0', // Optional
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    padding: 6, // Make it easier to tap
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    // backgroundColor: '#F0F0F0', // Light grey background for search bar
    borderWidth: 1, // Optional: if you prefer a border
    borderColor: '#D1D1D6', // Optional
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44, // Standard iOS height
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Or 'center' with margin on buttons
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1, // Make buttons take equal width
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 5, // Add some space between buttons
  },
  activeButton: {
    // backgroundColor: "#007AFF", // Blue for active
  },
  inactiveButton: {
    // backgroundColor: "#E0E0E0", // Grey for inactive
  },
  activeButtonText: {
    color: "#FFFFFF", // White text for active
    fontSize: 15,
    fontWeight: "600",
  },
  inactiveButtonText: {
    // color: "#000000", // Black text for inactive
    fontSize: 15,
    fontWeight: "600",
  },
  listContentContainer: {
    paddingBottom: 16, // Add some padding at the bottom of the list
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50, // Adjust as needed
  },
  emptyListText: {
    fontSize: 16,
    // color: "#8E8E93", // Grey color for empty message
  },
});
