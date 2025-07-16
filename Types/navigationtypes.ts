import { NavigatorScreenParams } from '@react-navigation/native'; // Needed for nested navigators
import { CaseDetails } from "../Screens/CaseDetailsScreen/CaseDetailsScreen"; // Summary type
import { CaseData, Document, TimelineEvent } from "./appTypes"; // Comprehensive types

// Stack for the "Home" or "Cases" Tab
export type HomeStackParamList = {
  HomeScreen: undefined;
  AllCases: undefined;
  CaseDetails: { caseDetails: CaseDataScreen };
  CaseDetail: { caseId: number; caseTitleHeader?: string }; // Updated params for the now-new CaseDetail screen
  // CaseDetailsV2 route removed
  EditCase: {
    initialCaseData?: Partial<CaseData> & {
      documents?: Document[],
      timelineEvents?: TimelineEvent[]
    }
  };
  AddCase: { uniqueId?: string };
  AddCaseDetails: { update?: boolean; initialValues?: CaseDetails; uniqueId?: string };
  AddDocument: { caseId: string | number };
  UndatedCases: undefined;
  ViewClients: undefined;
};

// Stack for the "Search" Tab
export type SearchStackParamList = {
  SearchScreen: undefined;
  // Example: SearchResults: { query: string };
  // Example: SearchCaseDetail: { caseDetails: CaseDetails }; // If search results navigate to a detail view
};

// Stack for the "Calendar" Tab
export type CalendarStackParamList = {
  CalendarScreen: undefined;
  // Example: EventDetail: { eventId: string };
};

// Stack for the "Profile" Tab (can include Settings)
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  SettingsScreen: undefined;
  ManageLookupCategoryScreen: {
    categoryName: 'CaseTypes' | 'Courts' | 'Districts' | 'PoliceStations';
    title: string;
  };
  // Example: AccountDetails: undefined;
};

// This defines the routes for the BottomTabNavigator itself
export type MainAppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>; // "HomeTab" is the route name for the tab
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  CalendarTab: NavigatorScreenParams<CalendarStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  // The names "HomeTab", "SearchTab" etc. will be used in Apppro.tsx for Tab.Screen names
};

// RootStackParamList now primarily contains the MainApp (Tab Navigator)
// and any other screens presented outside or modally above the tab structure.
export type RootStackParamList = {
  MainApp: NavigatorScreenParams<MainAppTabParamList>; // MainApp now refers to the entire tab navigator structure
  // Example of a modal screen that would cover tabs:
  // GlobalModalScreen: { message: string };
  // AuthStack: undefined; // If you have a separate authentication flow
};

// Note: The original RootStackParamList had Dashboard, Calendar, Search, Profile, HomeScreen directly.
// These are now integrated into their respective stacks within the MainAppTabParamList.
// AllCases, CaseDetail, AddCaseDetails, SettingsScreen, ManageLookupCategoryScreen were also top-level,
// they are now moved into appropriate stacks (mostly HomeStack or ProfileStack).
