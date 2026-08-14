import { render, fireEvent } from "@testing-library/react-native";
import React from "react";
import { Linking, Platform } from "react-native";

import ThemeProvider from "../../../Providers/ThemeProvider";
import UpdateCheckModal from "../UpdateCheckModal";

// Mock Linking
jest.spyOn(Linking, "openURL").mockImplementation(() => Promise.resolve(true));

const mockThemeContext = {
  theme: {
    colors: {
      background: "#FFFFFF",
      surface: "#FFFFFF",
      primary: "#1E40AF",
      primaryLight: "#DBEAFE",
      text: "#111827",
      textSecondary: "#4B5563",
    },
  },
};

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe("UpdateCheckModal Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when visible is false", () => {
    const { queryByText } = renderWithTheme(
      <UpdateCheckModal
        visible={false}
        forceUpdate={false}
        playStoreUrl="https://play.google.com/store/details?id=com.casediary"
        appStoreUrl="https://apps.apple.com/app/casediary"
        latestVersion="1.1.0"
      />
    );
    expect(queryByText("Update Available")).toBeNull();
    expect(queryByText("Update Required")).toBeNull();
  });

  it("renders 'Update Available' and 'Close' button for optional updates", () => {
    const mockOnClose = jest.fn();
    const { getByText } = renderWithTheme(
      <UpdateCheckModal
        visible
        forceUpdate={false}
        onClose={mockOnClose}
        playStoreUrl="https://play.google.com/store/details?id=com.casediary"
        appStoreUrl="https://apps.apple.com/app/casediary"
        latestVersion="1.1.0"
        releaseNotes="New features and fixes."
      />
    );

    expect(getByText("Update Available")).toBeTruthy();
    expect(getByText("New features and fixes.")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();

    fireEvent.press(getByText("Close"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders 'Update Required' and shows 'Close' button when onClose handler is passed", () => {
    const mockOnClose = jest.fn();
    const { getByText } = renderWithTheme(
      <UpdateCheckModal
        visible
        forceUpdate
        onClose={mockOnClose}
        playStoreUrl="https://play.google.com/store/details?id=com.casediary"
        appStoreUrl="https://apps.apple.com/app/casediary"
        latestVersion="1.1.0"
      />
    );

    expect(getByText("Update Required")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();

    fireEvent.press(getByText("Close"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("opens store link when 'Update Now' is pressed", () => {
    const { getByText } = renderWithTheme(
      <UpdateCheckModal
        visible
        forceUpdate={false}
        playStoreUrl="https://play.google.com/store/details?id=com.casediary"
        appStoreUrl="https://apps.apple.com/app/casediary"
        latestVersion="1.1.0"
      />
    );

    const updateButton = getByText("Update Now");
    fireEvent.press(updateButton);

    const expectedUrl =
      Platform.OS === "ios"
        ? "https://apps.apple.com/app/casediary"
        : "https://play.google.com/store/details?id=com.casediary";

    expect(Linking.openURL).toHaveBeenCalledWith(expectedUrl);
  });
});
