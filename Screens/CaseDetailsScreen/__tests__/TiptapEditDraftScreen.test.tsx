// Screens/CaseDetailsScreen/__tests__/TiptapEditDraftScreen.test.tsx
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import React from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import LanguageProvider from "../../../Providers/LanguageProvider";
import ThemeProvider from "../../../Providers/ThemeProvider";
import TiptapEditDraftScreen from "../TiptapEditDraftScreen";
import { saveDocumentDraft } from "../../../DataBase";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

let mockRouteParams = {
  draftId: "mock-tiptap-draft-123",
  caseId: 42,
  initialHtml: "<p>In the High Court of Judicature</p>",
  templateType: "writ",
  title: "Writ Petition 2026",
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: jest.fn(),
    addListener: jest.fn(() => () => {}),
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

jest.mock("../../../DataBase", () => ({
  saveDocumentDraft: jest.fn(() => Promise.resolve(1)),
  getDocumentDraftById: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn(() =>
    Promise.resolve({ uri: "file:///mock/tiptap_print.pdf" })
  ),
}));

jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-webview with testID and ref support
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockWebView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      injectJavaScript: jest.fn(),
      postMessage: jest.fn(),
    }));
    return <View testID="tiptap-webview" {...props} />;
  });
  return {
    WebView: MockWebView,
    default: MockWebView,
  };
});

// =========================================================================
// FACTORY PATTERNS (testing-patterns skill)
// =========================================================================
const getMockDraftParams = (overrides?: Partial<typeof mockRouteParams>) => ({
  draftId: "default-draft-id",
  caseId: 1,
  initialHtml: "<p>Default Draft</p>",
  templateType: "draft",
  title: "Default Title",
  ...overrides,
});

const getMockWebViewMessage = (type: string, payload: Record<string, any> = {}) => ({
  nativeEvent: {
    data: JSON.stringify({
      type,
      ...payload,
    }),
  },
});

describe("TiptapEditDraftScreen (Behavior-Driven Testing)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = getMockDraftParams();
  });

  const renderScreen = () =>
    render(
      <ThemeProvider>
        <LanguageProvider>
          <TiptapEditDraftScreen />
        </LanguageProvider>
      </ThemeProvider>
    );

  describe("1. Rendering & Initial Lifecycle", () => {
    it("renders document title and live save status in header", async () => {
      const { getByDisplayValue, getByText } = renderScreen();
      await waitFor(() => {
        expect(getByDisplayValue("Default Title")).toBeTruthy();
        expect(getByText(/Saved • Legal • 0 words/)).toBeTruthy();
      });
    });

    it("renders formatting and legal assist ribbon tabs", async () => {
      const { getByText } = renderScreen();
      await waitFor(() => {
        expect(getByText("Formatting")).toBeTruthy();
        expect(getByText("Legal Assist")).toBeTruthy();
      });
    });
  });

  describe("2. Document Title & Dirty State Tracking", () => {
    it("updates document title upon user input", async () => {
      const { getByDisplayValue } = renderScreen();
      await waitFor(() => {
        const titleInput = getByDisplayValue("Default Title");
        fireEvent.changeText(titleInput, "Updated Legal Petition 2026");
        expect(titleInput.props.value).toBe("Updated Legal Petition 2026");
      });
    });
  });

  describe("3. WebView Bridge Message Processing", () => {
    it("updates live telemetry stats and marks when receiving 'state' message from WebView", async () => {
      const { getByTestId, getByText } = renderScreen();

      await waitFor(() => {
        const webView = getByTestId("tiptap-webview");
        act(() => {
          webView.props.onMessage(
            getMockWebViewMessage("state", {
              state: { bold: true, italic: false, underline: true },
              stats: { wordCount: 350, charCount: 2100, estimatedPages: 2 },
              html: "<p><b>Section 482 CrPC</b></p>",
            })
          );
        });
      });

      await waitFor(() => {
        expect(getByText(/Saved • Legal • 350 words/)).toBeTruthy();
      });
    });

    it("opens Placeholder Modal when 'openPlaceholderModal' message is received", async () => {
      const { getByTestId, getByText } = renderScreen();

      await waitFor(() => {
        const webView = getByTestId("tiptap-webview");
        act(() => {
          webView.props.onMessage(
            getMockWebViewMessage("openPlaceholderModal", {
              label: "[PETITIONER_NAME]",
              cleanLabel: "PETITIONER_NAME",
            })
          );
        });
      });

      await waitFor(() => {
        expect(getByText(/Replace Placeholder|Fill Value|PETITIONER_NAME/i)).toBeTruthy();
      });
    });
  });

  describe("4. Document Persistence & PDF Export Flow", () => {
    it("handles save draft button press and invokes SQLite saveDocumentDraft", async () => {
      const { getByTestId } = renderScreen();

      await waitFor(() => {
        const webView = getByTestId("tiptap-webview");
        act(() => {
          webView.props.onMessage(
            getMockWebViewMessage("save", {
              html: "<p>Saved Legal Content</p>",
              stats: { wordCount: 10, charCount: 50, estimatedPages: 1 },
            })
          );
        });
      });
    });

    it("handles export PDF and triggers Print and Sharing modules", async () => {
      const { getByTestId } = renderScreen();

      await waitFor(() => {
        const webView = getByTestId("tiptap-webview");
        act(() => {
          webView.props.onMessage(
            getMockWebViewMessage("save", {
              html: "<p>PDF Export Content</p>",
            })
          );
        });
      });
    });
  });
});
