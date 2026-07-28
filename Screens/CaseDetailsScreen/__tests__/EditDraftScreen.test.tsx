// Screens/CaseDetailsScreen/__tests__/EditDraftScreen.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import EditDraftScreen from "../EditDraftScreen";
import ThemeProvider from "../../../Providers/ThemeProvider";
import LanguageProvider from "../../../Providers/LanguageProvider";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: jest.fn(),
    addListener: jest.fn(() => () => {}),
  }),
  useRoute: () => ({
    params: {
      draftId: "mock-draft-1",
      caseId: 1,
      initialHtml: "<p>Sample Bail Application</p>",
      templateType: "bail",
      title: "Bail Draft",
    },
  }),
}));

jest.mock("../../../DataBase", () => ({
  saveDocumentDraft: jest.fn(() => Promise.resolve(1)),
  getDocumentDraftById: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("expo-file-system", () => ({
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true })),
}));

jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: "file:///mock/print.pdf" })),
}));

jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn(() => Promise.resolve()),
}));

describe("EditDraftScreen", () => {
  const renderScreen = () =>
    render(
      <ThemeProvider>
        <LanguageProvider>
          <EditDraftScreen />
        </LanguageProvider>
      </ThemeProvider>
    );

  it("should render editor top bar title and action buttons", async () => {
    const { getByTestId, getByText } = renderScreen();

    await waitFor(() => {
      expect(getByTestId("scan-to-editor-btn")).toBeTruthy();
      expect(getByTestId("voice-dictation-btn")).toBeTruthy();
      expect(getByTestId("insert-table-btn")).toBeTruthy();
      expect(getByTestId("attach-signature-btn")).toBeTruthy();
    });
  });

  it("should render formatting toolbar and allow switching to legal assist ribbon", async () => {
    const { getByTestId } = renderScreen();

    await waitFor(() => {
      const legalAssistTab = getByTestId("tab-legal-assist-btn");
      expect(legalAssistTab).toBeTruthy();
      fireEvent.press(legalAssistTab);
    });
  });

  it("should collapse and expand ribbon toolbar when re-tapping active tab", async () => {
    const { getByTestId, queryByTestId } = renderScreen();

    await waitFor(() => {
      const formattingTab = getByTestId("tab-formatting-btn");
      expect(getByTestId("scan-to-editor-btn")).toBeTruthy();

      // Tap active tab to collapse ribbon
      fireEvent.press(formattingTab);
      expect(queryByTestId("scan-to-editor-btn")).toBeNull();

      // Tap active tab again to expand ribbon
      fireEvent.press(formattingTab);
      expect(getByTestId("scan-to-editor-btn")).toBeTruthy();
    });
  });
});
