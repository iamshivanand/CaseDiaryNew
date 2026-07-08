import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import UndatedCasesScreen from '../UndatedCasesScreen';
import ThemeProvider from '../../../Providers/ThemeProvider';
import LanguageProvider from '../../../Providers/LanguageProvider';
import * as db from '../../../DataBase';
import { exportUndatedCasesToPdf } from '../../../utils/pdfExporter';

// Mock stable navigation and route
const mockNavigate = jest.fn();
const mockNavigationObj = {
  navigate: mockNavigate,
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigationObj,
  useFocusEffect: (callback: any) => {
    const React = require('react');
    React.useEffect(() => {
      callback();
    }, []);
  },
}));

// Mock Database methods
const mockCases = [
  {
    id: 1,
    uniqueId: 'case-1',
    CaseTitle: 'State vs John (Undated)',
    ClientName: 'John',
    NextDate: null, // Undated case
    CaseStatus: 'Pending',
    Priority: 'High',
  },
];

jest.mock('../../../DataBase', () => ({
  ...jest.requireActual('../../../DataBase'),
  getCases: jest.fn(() => Promise.resolve(mockCases)),
  getCaseById: jest.fn((id) => Promise.resolve(mockCases.find(c => c.id === id))),
}));

// Mock PDF Exporter
jest.mock('../../../utils/pdfExporter', () => ({
  exportUndatedCasesToPdf: jest.fn(() => Promise.resolve()),
}));

// Mock AdManager statically
const mockShowAd = jest.fn((adType, onComplete) => {
  onComplete(true);
});

jest.mock('../../CommonComponents/AdManager', () => ({
  AdProvider: ({ children }: any) => children,
  useAdTrigger: () => ({
    showAdWithPreload: mockShowAd,
  }),
}));

const renderWithProviders = () => {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <UndatedCasesScreen />
      </LanguageProvider>
    </ThemeProvider>
  );
};

describe('UndatedCasesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the undated cases header and lists correctly', async () => {
    const { findByText } = renderWithProviders();
    const headerTitle = await findByText('Undated Cases');
    const caseTitle = await findByText('State vs John (Undated)');
    expect(headerTitle).toBeTruthy();
    expect(caseTitle).toBeTruthy();
  });

  it('should trigger ad preloading and undated cause list PDF export on Share List press', async () => {
    const { findByText } = renderWithProviders();
    const shareButton = await findByText('Share List');
    expect(shareButton).toBeTruthy();

    fireEvent.press(shareButton);

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith('rewarded', expect.any(Function));
      expect(exportUndatedCasesToPdf).toHaveBeenCalled();
    });
  });
});
