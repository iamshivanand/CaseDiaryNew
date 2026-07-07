import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useContext, useEffect } from "react";
import { View, Platform } from "react-native"; // Removed ScrollView, Text
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Ionicons from "react-native-vector-icons/Ionicons";

import { useTranslation } from "./Providers/LanguageProvider";
import { ThemeContext } from "./Providers/ThemeProvider";

// Import Screens for Stacks
import AddCase from "./Screens/Addcase/AddCase";
import AddCaseDetails from "./Screens/Addcase/AddCaseDetails";
import AddDocumentScreen from "./Screens/Addcase/AddDocument";
import CalendarScreen from "./Screens/Calendar/Calendar";
import CaseDetailsScreen from "./Screens/CaseDetailsScreen/CaseDetailsScreen"; // This is now the new, refactored screen
import EditDraftScreen from "./Screens/CaseDetailsScreen/EditDraftScreen";
import GenerateDocumentScreen from "./Screens/CaseDetailsScreen/GenerateDocumentScreen";
import CasesList from "./Screens/CasesList/CasesList";
import DashboardScreen from "./Screens/Dashboard/Dashboard";
// import CaseDetailsScreenV2 from "./Screens/CaseDetailsScreenV2/CaseDetailsScreenV2"; // V2 Import removed
import EditCaseScreen from "./Screens/EditCase/EditCaseScreen";
import DuplicateReviewScreen from "./Screens/Onboarding/DuplicateReviewScreen";
import ImportMigrationScreen from "./Screens/Onboarding/ImportMigrationScreen";
import PdfViewerScreen from "./Screens/PdfViewer/PdfViewerScreen";
import ProfileScreen from "./Screens/ProfileScreen/Profile"; // Renamed import for clarity
import SearchScreen from "./Screens/SearchScreen/SearchScreen";
import DatabaseImportScreen from "./Screens/Settings/DatabaseImportScreen";
import DraftsHubScreen from "./Screens/Settings/DraftsHubScreen";
import ECourtsAppImportScreen from "./Screens/Settings/ECourtsAppImportScreen";
import ManageLookupCategoryScreen from "./Screens/Settings/ManageLookupCategoryScreen";
import SettingsScreen from "./Screens/Settings/SettingsScreen";
import UndatedCasesScreen from "./Screens/UndatedCases/UndatedCasesScreen";
import YesterdaysCasesScreen from "./Screens/YesterdaysCases/YesterdaysCasesScreen";

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

const HomeStack = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <HomeStackNav.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: theme.colors.cardBackground,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
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
      <HomeStackNav.Screen
        name="CaseDetails"
        component={CaseDetailsScreen} // This should be the new one, as CaseDetailsScreenV2 was renamed to this.
        options={{
          title: "Case Details",
        }}
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
      <HomeStackNav.Screen
        name="GenerateDocument"
        component={GenerateDocumentScreen}
        options={{ title: "Draft Legal Document" }}
      />
      <HomeStackNav.Screen
        name="DraftsHub"
        component={DraftsHubScreen}
        options={{ title: "Drafts Hub" }}
      />
      <HomeStackNav.Screen
        name="EditDraft"
        component={EditDraftScreen}
        options={{ headerShown: false }}
      />
      <HomeStackNav.Screen
        name="ImportMigration"
        component={ImportMigrationScreen}
        options={{ title: "Import Data" }}
      />
      <HomeStackNav.Screen
        name="DuplicateReview"
        component={DuplicateReviewScreen}
        options={{ title: "Resolve Duplicates" }}
      />
      <HomeStackNav.Screen
        name="PdfViewer"
        component={PdfViewerScreen}
        options={{ title: "PDF Viewer" }}
      />
    </HomeStackNav.Navigator>
  );
};

const SearchStack = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <SearchStackNav.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: theme.colors.cardBackground,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <SearchStackNav.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <SearchStackNav.Screen
        name="CaseDetails"
        component={CaseDetailsScreen}
        options={{
          title: "Case Details",
        }}
      />
      <SearchStackNav.Screen
        name="EditCase"
        component={EditCaseScreen}
        options={{ title: "Edit Case" }}
      />
    </SearchStackNav.Navigator>
  );
};

const CalendarStack = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <CalendarStackNav.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: theme.colors.cardBackground,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <CalendarStackNav.Screen
        name="CalendarScreen"
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <CalendarStackNav.Screen
        name="CaseDetails"
        component={CaseDetailsScreen}
        options={{
          title: "Case Details",
        }}
      />
      <CalendarStackNav.Screen
        name="EditCase"
        component={EditCaseScreen}
        options={{ title: "Edit Case" }}
      />
    </CalendarStackNav.Navigator>
  );
};

const ProfileStack = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <ProfileStackNav.Navigator
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: theme.colors.cardBackground,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <ProfileStackNav.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStackNav.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ headerShown: true, title: "Settings" }}
      />
      <ProfileStackNav.Screen
        name="ManageLookupCategoryScreen"
        component={ManageLookupCategoryScreen}
        options={({ route }) => ({
          title: route.params.title || "Manage Category",
          headerShown: true,
        })}
      />
      <ProfileStackNav.Screen
        name="ImportMigration"
        component={ImportMigrationScreen}
        options={{ headerShown: true, title: "Import Data" }}
      />
      <ProfileStackNav.Screen
        name="DuplicateReview"
        component={DuplicateReviewScreen}
        options={{ headerShown: true, title: "Resolve Duplicates" }}
      />
      <ProfileStackNav.Screen
        name="DatabaseImportScreen"
        component={DatabaseImportScreen}
        options={{ headerShown: true, title: "Restore Backup" }}
      />
      <ProfileStackNav.Screen
        name="ECourtsAppImport"
        component={ECourtsAppImportScreen}
        options={{ headerShown: true, title: "Import from eCourts App" }}
      />
      {/* Add AccountDetails screens here */}
    </ProfileStackNav.Navigator>
  );
};

const TabIcon = ({
  name,
  color,
  size,
  focused,
}: {
  name: string;
  color: string;
  size: number;
  focused: boolean;
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.25 : 1.0, {
      damping: 15,
      stiffness: 150,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name as any} size={size} color={color} />
    </Animated.View>
  );
};

const Appro: React.FC = () => {
  // Props interface removed as it was empty
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  return (
    // View style={{ flex: 1 }} is important for the navigator to fill the space
    // Removed the ScrollView that was wrapping Tab.Navigator
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? "";
          const hideTabsOn = [
            "CaseDetails",
            "EditCase",
            "AddCase",
            "AddCaseDetails",
            "AddDocument",
            "UndatedCases",
            "YesterdaysCases",
            "AllCases",
            "SettingsScreen",
            "ManageLookupCategoryScreen",
            "GenerateDocument",
            "DraftsHub",
            "DatabaseImportScreen",
          ];
          const shouldHide = hideTabsOn.includes(routeName);

          return {
            headerShown: false, // Headers are managed by inner stacks
            tabBarStyle: {
              position: "absolute",
              bottom: Platform.OS === "ios" ? 24 : 16,
              left: 16,
              right: 16,
              borderRadius: 24,
              height: 65, // Slightly increased height for better touchability and spacing
              backgroundColor: theme.dark ? "#1E293B" : "#FFFFFF",
              borderTopColor: theme.dark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
              borderTopWidth: 1,
              borderWidth: 1,
              borderColor: theme.dark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 8,
              paddingBottom: 8,
              paddingTop: 4,
              ...(shouldHide && { display: "none" }),
            },
            tabBarIcon: ({ color, size, focused }) => {
              let iconName: string = "home"; // Default, ensure type safety

              if (route.name === "HomeTab") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "SearchTab") {
                iconName = focused ? "search" : "search-outline";
              } else if (route.name === "CalendarTab") {
                iconName = focused ? "calendar" : "calendar-outline";
              } else if (route.name === "ProfileTab") {
                iconName = focused ? "person-circle" : "person-circle-outline";
              }

              return (
                <TabIcon
                  name={iconName}
                  color={color}
                  size={focused ? size + 2 : size}
                  focused={focused}
                />
              );
            },
            tabBarActiveTintColor: theme.colors.primary || "#020748",
            tabBarInactiveTintColor: theme.colors.textSecondary || "grey", // Use theme color or a sensible default
            tabBarLabelStyle: {
              fontSize: 11, // Adjust font size for labels
              marginBottom: 3, // Space between icon and label
            },
          };
        }}
      >
        {/* Tab.Screen names now refer to routes in MainAppTabParamList */}
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{ tabBarLabel: t("nav_home") }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchStack}
          options={{ tabBarLabel: t("nav_search") }}
        />
        <Tab.Screen
          name="CalendarTab"
          component={CalendarStack}
          options={{ tabBarLabel: t("nav_calendar") }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
          options={{ tabBarLabel: t("nav_profile") }}
        />
      </Tab.Navigator>
    </View>
  );
};

export default Appro;
