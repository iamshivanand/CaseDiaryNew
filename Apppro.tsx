import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useContext } from "react";
import { View } from "react-native"; // Removed ScrollView, Text
import Ionicons from "react-native-vector-icons/Ionicons";

import { ThemeContext } from "./Providers/ThemeProvider";

// Import Screens for Stacks
import DashboardScreen from "./Screens/Dashboard/Dashboard";
import CasesList from "./Screens/CasesList/CasesList";
import CaseDetailsScreen from "./Screens/CaseDetailsScreen/CaseDetailsScreen"; // This is now the new, refactored screen
// import CaseDetailsScreenV2 from "./Screens/CaseDetailsScreenV2/CaseDetailsScreenV2"; // V2 Import removed
import EditCaseScreen from "./Screens/EditCase/EditCaseScreen";
import AddCase from "./Screens/Addcase/AddCase";
import AddCaseDetails from "./Screens/Addcase/AddCaseDetails";
import AddDocumentScreen from "./Screens/Addcase/AddDocument";
import UndatedCasesScreen from "./Screens/UndatedCases/UndatedCasesScreen";
import YesterdaysCasesScreen from "./Screens/YesterdaysCases/YesterdaysCasesScreen";

import SearchScreen from "./Screens/SearchScreen/SearchScreen";
import CalendarScreen from "./Screens/Calendar/Calendar";
import ProfileScreen from "./Screens/ProfileScreen/Profile"; // Renamed import for clarity
import SettingsScreen from "./Screens/Settings/SettingsScreen";
import ManageLookupCategoryScreen from "./Screens/Settings/ManageLookupCategoryScreen";
import LegalTemplatesScreen from "./Screens/LegalTemplates/LegalTemplatesScreen";

// Import ParamList types
import {
  MainAppTabParamList,
  HomeStackParamList,
  SearchStackParamList,
  CalendarStackParamList,
  ProfileStackParamList,
  TemplatesStackParamList,
} from "./Types/navigationtypes";

const Tab = createBottomTabNavigator<MainAppTabParamList>();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const SearchStackNav = createNativeStackNavigator<SearchStackParamList>();
const CalendarStackNav = createNativeStackNavigator<CalendarStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const TemplatesStackNav = createNativeStackNavigator<TemplatesStackParamList>();

// Define Stack Navigators for each tab

const HomeStack = () => (
  <HomeStackNav.Navigator screenOptions={{ headerShown: true }}>
    {/* Default to true for this stack */}
    <HomeStackNav.Screen
      name="HomeScreen"
      component={DashboardScreen}
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
    <HomeStackNav.Screen
      name="UndatedCases"
      component={UndatedCasesScreen}
      options={{ title: "Undated Cases" }}
    />
    <HomeStackNav.Screen
      name="YesterdaysCases"
      component={YesterdaysCasesScreen}
      options={{ title: "Yesterday's Cases" }}
    />
  </HomeStackNav.Navigator>
);

const SearchStack = () => (
  <SearchStackNav.Navigator screenOptions={{ headerShown: true }}>
    <SearchStackNav.Screen name="SearchScreen" component={SearchScreen} options={{ headerShown: false }} />
    <SearchStackNav.Screen name="CaseDetails" component={CaseDetailsScreen} options={{ title: "Case Details" }} />
    <SearchStackNav.Screen name="EditCase" component={EditCaseScreen} options={{ title: "Edit Case" }} />
  </SearchStackNav.Navigator>
);

const CalendarStack = () => (
  <CalendarStackNav.Navigator screenOptions={{ headerShown: true }}>
    <CalendarStackNav.Screen name="CalendarScreen" component={CalendarScreen} options={{ headerShown: false }} />
    <CalendarStackNav.Screen name="CaseDetails" component={CaseDetailsScreen} options={{ title: "Case Details" }} />
    <CalendarStackNav.Screen name="EditCase" component={EditCaseScreen} options={{ title: "Edit Case" }} />
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

const TemplatesStack = () => (
  <TemplatesStackNav.Navigator screenOptions={{ headerShown: true }}>
    <TemplatesStackNav.Screen name="LegalTemplatesScreen" component={LegalTemplatesScreen} options={{ headerShown: false }} />
  </TemplatesStackNav.Navigator>
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
            let iconName: keyof typeof Ionicons.glyphMap = "home"; // Default, ensure type safety

            if (route.name === "HomeTab") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "SearchTab") {
              iconName = focused ? "search" : "search-outline";
            } else if (route.name === "TemplatesTab") {
              iconName = focused ? "document-text" : "document-text-outline";
            } else if (route.name === "CalendarTab") {
              iconName = focused ? "calendar" : "calendar-outline";
            } else if (route.name === "ProfileTab") {
              iconName = focused ? "person-circle" : "person-circle-outline";
            }

            return (
              <Ionicons name={iconName} size={focused ? size + 2 : size} color={color} />
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
        <Tab.Screen name="TemplatesTab" component={TemplatesStack} options={{ tabBarLabel: "Templates" }} />
        <Tab.Screen name="CalendarTab" component={CalendarStack} options={{ tabBarLabel: "Calendar" }} />
        <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
      </Tab.Navigator>
    </View>
  );
};

export default Appro;
