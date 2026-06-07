import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Linking, Platform } from "react-native";
import UpdateCheckModal from "../UpdateCheckModal";
import ThemeProvider from "../../../Providers/ThemeProvider";

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

  it("renders 'Update Available' and 'Later' button for optional updates", () => {
    const mockOnClose = jest.fn();
    const { getByText, queryByText } = renderWithTheme(
      <UpdateCheckModal
        visible={true}
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
    expect(getByText("Later")).toBeTruthy();

    fireEvent.press(getByText("Later"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders 'Update Required' and hides 'Later' button for forced updates", () => {
    const { getByText, queryByText } = renderWithTheme(
      <UpdateCheckModal
        visible={true}
        forceUpdate={true}
        playStoreUrl="https://play.google.com/store/details?id=com.casediary"
        appStoreUrl="https://apps.apple.com/app/casediary"
        latestVersion="1.1.0"
      />
    );

    expect(getByText("Update Required")).toBeTruthy();
    expect(queryByText("Later")).toBeNull();
  });

  it("opens store link when 'Update Now' is pressed", () => {
    const { getByText } = renderWithTheme(
      <UpdateCheckModal
        visible={true}
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
