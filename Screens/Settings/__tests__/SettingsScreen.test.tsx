import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import ThemeProvider from '../../../Providers/ThemeProvider';
import LanguageProvider from '../../../Providers/LanguageProvider';
import { exportDatabaseBackup } from '../../../utils/backupManager';
import { Alert } from 'react-native';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock backup manager
jest.mock('../../../utils/backupManager', () => ({
  exportDatabaseBackup: jest.fn(() => Promise.resolve()),
}));

// Define static mock for showAdWithPreload
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
        <SettingsScreen />
      </LanguageProvider>
    </ThemeProvider>
  );
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all settings sections and buttons', () => {
    const { getByText } = renderWithProviders();
    expect(getByText('App Settings')).toBeTruthy();
    expect(getByText('Personalization')).toBeTruthy();
    expect(getByText('App Theme')).toBeTruthy();
    expect(getByText('App Language')).toBeTruthy();
    expect(getByText('Data Management & Backups')).toBeTruthy();
    expect(getByText('Backup Database')).toBeTruthy();
    expect(getByText('Categories & Lookup Tables')).toBeTruthy();
  });

  it('should open theme picker Alert when Theme menu item is pressed', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithProviders();

    fireEvent.press(getByText('App Theme'));

    expect(alertSpy).toHaveBeenCalledWith(
      'App Theme',
      'Choose your preferred theme option:',
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });

  it('should open language picker Alert when Language menu item is pressed', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithProviders();

    fireEvent.press(getByText('App Language'));

    expect(alertSpy).toHaveBeenCalledWith(
      'App Language',
      'Choose your preferred language option:',
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });

  it('should trigger ad preloading and database backup when Backup Database is pressed', async () => {
    const { getByText } = renderWithProviders();

    fireEvent.press(getByText('Backup Database'));

    await waitFor(() => {
      expect(mockShowAd).toHaveBeenCalledWith('interstitial', expect.any(Function));
      expect(exportDatabaseBackup).toHaveBeenCalled();
    });
  });

  it('should navigate to category manager screen when lookup menu item is pressed', () => {
    const { getByText } = renderWithProviders();

    fireEvent.press(getByText('Manage Case Types'));

    expect(mockNavigate).toHaveBeenCalledWith('ManageLookupCategoryScreen', {
      categoryName: 'CaseTypes',
      title: 'Manage Case Types',
    });
  });
});
