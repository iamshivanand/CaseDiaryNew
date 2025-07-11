import { NavigatorScreenParams } from '@react-navigation/native'; // Needed for nested navigators
import { CaseDetails } from "../Screens/CaseDetailsScreen/CaseDetailsScreen"; // Summary type
import { CaseData, Document, TimelineEvent } from "./appTypes"; // Comprehensive types

// Stack for the "Home" or "Cases" Tab
export type HomeStackParamList = {
  HomeScreen: undefined; // Main screen for this tab
  AllCases: undefined;   // List of all cases
  CaseDetail: { caseDetails: CaseDetails }; // Shows details of a single case
  EditCase: { // Screen to edit an existing case
    initialCaseData?: Partial<CaseData> & {
      documents?: Document[],
      timelineEvents?: TimelineEvent[]
    }
  };
  // Assuming AddCase.tsx is the main entry for adding a new case flow
  AddCase: { uniqueId?: string }; // uniqueId might be generated before starting
  // AddCaseDetails, Documents, Fees would be part of the AddCase stack if it's multi-step
  // For simplicity, AddCaseDetails might be a screen within this HomeStack too,
  // or AddCase itself is a stack. Let's keep AddCaseDetails here for now.
  AddCaseDetails: {
    update?: boolean;
    initialValues?: CaseDetails;
    uniqueId?: string;
    recognizedText?: string; // For returning OCR text
    fieldName?: keyof CaseData; // For returning OCR text field target
  };
  AddCase: { // Also needs to accept these params if DocumentCaptureScreen returns to it
    uniqueId?: string;
    recognizedText?: string;
    fieldName?: keyof CaseData;
  };
  DocumentCaptureScreen: {
    fieldName: keyof CaseData;
    currentText: string;
    returnScreen: keyof HomeStackParamList; // e.g., 'AddCase' or 'AddCaseDetails'
  };
  // Documents: { update?: boolean; uniqueId: string }; // Documents route removed from this stack
  // Fees: { update?: boolean; uniqueId: string }; // Fees route removed
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
