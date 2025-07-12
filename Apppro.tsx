import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useContext } from "react";
import { View } from "react-native"; // Removed ScrollView, Text
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { ThemeContext } from "./Providers/ThemeProvider";

// Import Screens for Stacks
import HomeScreen from "./Screens/HomeScreen/HomeScreen";
import CasesList from "./Screens/CasesList/CasesList";
import CaseDetailsScreen from "./Screens/CaseDetailsScreen/CaseDetailsScreen"; // This is now the new, refactored screen
// import CaseDetailsScreenV2 from "./Screens/CaseDetailsScreenV2/CaseDetailsScreenV2"; // V2 Import removed
import EditCaseScreen from "./Screens/EditCase/EditCaseScreen";
import AddCase from "./Screens/Addcase/AddCase";
import AddCaseDetails from "./Screens/Addcase/AddCaseDetails";
import AddDocumentScreen from "./Screens/Addcase/AddDocument";

import SearchScreen from "./Screens/SearchScreen/SearchScreen";
import CalendarScreen from "./Screens/Calendar/Calendar";
import ProfileScreen from "./Screens/ProfileScreen/Profile"; // Renamed import for clarity
import SettingsScreen from "./Screens/Settings/SettingsScreen";
import ManageLookupCategoryScreen from "./Screens/Settings/ManageLookupCategoryScreen";

// Import ParamList types
import {
  MainAppTabParamList,
  HomeStackParamList,
  SearchStackParamList,
  CalendarStackParamList,
  ProfileStackParamList,
} from "./Types/navigationtypes";

const Tab = createBottomTabNavigator<MainAppTabParamList>();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const SearchStackNav = createNativeStackNavigator<SearchStackParamList>();
const CalendarStackNav = createNativeStackNavigator<CalendarStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

// Define Stack Navigators for each tab

const HomeStack = () => (
  <HomeStackNav.Navigator screenOptions={{ headerShown: true }}>
    {/* Default to true for this stack */}
    <HomeStackNav.Screen
      name="HomeScreen"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    {/* HomeScreen has custom header */}
    <HomeStackNav.Screen
      name="AllCases"
      component={CasesList}
      options={{ title: "All Cases" }}
    />
    {/* CaseDetail now points to the new CaseDetailsScreen (which was CaseDetailsScreenV2) */}
    <HomeStackNav.Screen
      name="CaseDetails"
      component={CaseDetailsScreen} // This should be the new one, as CaseDetailsScreenV2 was renamed to this.
      options={{ title: "Case Details" }} // Title is set dynamically within the screen
    />
    {/* CaseDetailsV2 screen entry removed */}
    <HomeStackNav.Screen
      name="EditCase"
      component={EditCaseScreen}
      options={{ title: "Edit Case" }}
    />
    <HomeStackNav.Screen
      name="AddCase"
      component={AddCase}
      options={{ title: "Add New Case" }}
    />
    <HomeStackNav.Screen
      name="AddCaseDetails"
      component={AddCaseDetails}
      options={{ title: "Case Form" }}
    />
    <HomeStackNav.Screen
      name="AddDocument"
      component={AddDocumentScreen}
      options={{ title: "Add Document" }}
    />
  </HomeStackNav.Navigator>
);

const SearchStack = () => (
  <SearchStackNav.Navigator screenOptions={{ headerShown: false }}>
    <SearchStackNav.Screen name="SearchScreen" component={SearchScreen} />
    {/* Add SearchResults, SearchCaseDetail screens here */}
  </SearchStackNav.Navigator>
);

const CalendarStack = () => (
  <CalendarStackNav.Navigator screenOptions={{ headerShown: false }}>
    <CalendarStackNav.Screen name="CalendarScreen" component={CalendarScreen} />
    {/* Add EventDetail screens here */}
  </CalendarStackNav.Navigator>
);

const ProfileStack = () => (
  <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStackNav.Screen name="ProfileScreen" component={ProfileScreen} />
    <ProfileStackNav.Screen name="SettingsScreen" component={SettingsScreen} options={{ headerShown: true, title: "Settings" }}/>
    <ProfileStackNav.Screen
      name="ManageLookupCategoryScreen"
      component={ManageLookupCategoryScreen}
      options={({ route }) => ({ title: route.params.title || "Manage Category", headerShown: true })}
    />
    {/* Add AccountDetails screens here */}
  </ProfileStackNav.Navigator>
);


const Appro: React.FC = () => { // Props interface removed as it was empty
  const { theme } = useContext(ThemeContext);
  return (
    // View style={{ flex: 1 }} is important for the navigator to fill the space
    // Removed the ScrollView that was wrapping Tab.Navigator
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Headers are managed by inner stacks
          tabBarStyle: {
            paddingBottom: 5, // Consider adjusting for safe areas on some devices
            height: 55,      // Slightly increased height for better touchability
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border, // Use theme color for border
            borderTopWidth: 0.5, // A subtle top border
          },
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: keyof typeof MaterialIcons.glyphMap = "home"; // Default, ensure type safety

            if (route.name === "HomeTab") {
              iconName = focused ? "home" : "home-outline"; // Example: use outline for inactive
            } else if (route.name === "SearchTab") {
              iconName = focused ? "search" : "search-outline";
            } else if (route.name === "CalendarTab") {
              iconName = focused ? "calendar" : "calendar-outline";
            } else if (route.name === "ProfileTab") {
              iconName = focused ? "account-circle" : "account-circle-outline";
            }
            // For outline icons, you might need a different icon set like MaterialCommunityIcons or Ionicons
            // Sticking to MaterialIcons for now, so using filled versions.
            if (route.name === "HomeTab") iconName = "home";
            else if (route.name === "SearchTab") iconName = "search";
            else if (route.name === "CalendarTab") iconName = "date-range";
            else if (route.name === "ProfileTab") iconName = "account-circle";

            return (
              <MaterialIcons name={iconName} size={focused ? size + 2 : size} color={color} />
            );
          },
          tabBarActiveTintColor: theme.colors.primary || "#020748",
          tabBarInactiveTintColor: theme.colors.textSecondary || "grey", // Use theme color or a sensible default
          tabBarLabelStyle: {
            fontSize: 11, // Adjust font size for labels
            marginBottom: 3, // Space between icon and label
          }
        })}
      >
        {/* Tab.Screen names now refer to routes in MainAppTabParamList */}
        <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: "Home" }} />
        <Tab.Screen name="SearchTab" component={SearchStack} options={{ tabBarLabel: "Search" }} />
        <Tab.Screen name="CalendarTab" component={CalendarStack} options={{ tabBarLabel: "Calendar" }} />
        <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
      </Tab.Navigator>
    </View>
  );
};

export default Appro;
