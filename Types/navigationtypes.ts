import { CaseDetails } from "../Screens/CaseDetailsScreen/CaseDetailsScreen";

export type RootStackParamList = {
  AddCase: { update?: boolean; initialValues?: CaseDetails; uniqueId: string };
  CaseDetail: { caseDetails: CaseDetails }; // Consider passing caseId (number) instead of full object
  Documents: { update?: boolean; uniqueId: string }; // Consider caseId here too
  Fees: { update?: boolean; uniqueId: string }; // Consider caseId here too
  AddCaseDetails: { update?: boolean; initialValues?: CaseDetails }; // This might be the main add/edit case screen

  // Main App Structure (from Routes.tsx and Apppro.tsx)
  MainApp: undefined; // Represents the tab navigator or main app container
  AllCases: undefined; // Screen to list all cases

  // Settings & Lookup Management
  SettingsScreen: undefined;
  ManageLookupCategoryScreen: {
    categoryName: 'CaseTypes' | 'Courts' | 'Districts' | 'PoliceStations'; // Add more as created
    title: string;
  };

  // Potentially other screens from Apppro.tsx if it's a navigator
  // e.g., Dashboard, Calendar, Search might be part of a BottomTabNavigator
  Dashboard: undefined;
  Calendar: undefined;
  Search: undefined;
  Profile: undefined;
  HomeScreen: undefined; // if it's a distinct screen
};
