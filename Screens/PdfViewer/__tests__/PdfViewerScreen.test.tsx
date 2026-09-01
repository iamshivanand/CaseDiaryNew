import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PdfViewerScreen } from "../PdfViewerScreen";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as fileShareHelper from "../../../utils/fileShareHelper";
import { ThemeContext } from "../../../Providers/ThemeProvider";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRouteParams: any = {
  pdfUri: "file:///mock/document.pdf",
  title: "Test Bail Application",
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 10, left: 0, right: 0 }),
}));

jest.mock("expo-print", () => ({
  printAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../utils/fileShareHelper", () => ({
  shareNamedPdf: jest.fn().mockResolvedValue("file:///mock/shared.pdf"),
  sanitizeFileName: jest.fn((name) => `${name}.pdf`),
}));

describe("PdfViewerScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 2048,
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoK..."
    );
  });

  const renderScreen = () => {
    return render(
      <ThemeContext.Provider
        value={{
          theme: {
            isDark: false,
            colors: {
              background: "#ffffff",
              cardBackground: "#f8f9fa",
              border: "#e2e8f0",
              text: "#000000",
              textSecondary: "#666666",
              primary: "#1E3A8A",
              danger: "#EF4444",
            },
          },
          toggleTheme: jest.fn(),
        }}
      >
        <PdfViewerScreen />
      </ThemeContext.Provider>
    );
  };

  it("renders the PDF title and header action buttons", async () => {
    const { getByText } = renderScreen();
    await waitFor(() => {
      expect(getByText("Test Bail Application")).toBeTruthy();
    });
  });

  it("triggers shareNamedPdf when share action is pressed", async () => {
    const { UNSAFE_getAllByType } = renderScreen();
    await waitFor(() => {
      expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
    });

    const { TouchableOpacity } = require("react-native");
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Header actions: [0] Back, [1] Print, [2] Share
    const shareBtn = touchables[2];
    fireEvent.press(shareBtn);

    await waitFor(() => {
      expect(fileShareHelper.shareNamedPdf).toHaveBeenCalledWith(
        "file:///mock/document.pdf",
        "Test Bail Application",
        "Share Test Bail Application"
      );
    });
  });

  it("triggers Print.printAsync via base64 data URI when print action is pressed", async () => {
    const { UNSAFE_getAllByType } = renderScreen();
    await waitFor(() => {
      expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
    });

    const { TouchableOpacity } = require("react-native");
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Header actions: [0] Back, [1] Print, [2] Share
    const printBtn = touchables[1];
    fireEvent.press(printBtn);

    await waitFor(() => {
      expect(Print.printAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: expect.stringMatching(/^data:application\/pdf;base64,/),
        })
      );
    });
  });
});
