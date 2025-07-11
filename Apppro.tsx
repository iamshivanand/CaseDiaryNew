import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useContext } from "react";
import { View } from "react-native"; // Removed ScrollView, Text
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { ThemeContext } from "./Providers/ThemeProvider";

// Import Screens for Stacks
import HomeScreen from "./Screens/HomeScreen/HomeScreen";
import CasesList from "./Screens/CasesList/CasesList";
import CaseDetail from "./Screens/CaseDetailsScreen/CaseDetailsScreen";
import EditCaseScreen from "./Screens/EditCase/EditCaseScreen"; // Import your new screen
import AddCase from "./Screens/Addcase/AddCase"; // Assuming this is the main AddCase screen
import AddCaseDetails from "./Screens/Addcase/AddCaseDetails"; // If used within a stack
import DocumentCaptureScreen from "./Screens/DocumentCapture/DocumentCaptureScreen"; // Import the new screen

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
  <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
    <HomeStackNav.Screen name="HomeScreen" component={HomeScreen} />
    <HomeStackNav.Screen name="AllCases" component={CasesList} options={{ headerShown: true, title: "All Cases" }} />
    <HomeStackNav.Screen name="CaseDetail" component={CaseDetail} options={{ headerShown: true, title: "Case Details" }} />
    <HomeStackNav.Screen name="EditCase" component={EditCaseScreen} options={{ headerShown: true, title: "Edit Case" }} />
    <HomeStackNav.Screen name="AddCase" component={AddCase} options={{ headerShown: true, title: "Add New Case" }} />
    <HomeStackNav.Screen name="AddCaseDetails" component={AddCaseDetails} options={{ headerShown: true, title: "Add Case Details" }} />
    <HomeStackNav.Screen name="DocumentCaptureScreen" component={DocumentCaptureScreen} options={{ headerShown: true, title: "Import Document" }} />
    {/* Documents and Fees screens can be added here as needed */}
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
