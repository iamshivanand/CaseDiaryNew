import { NavigationContainer, useRoute } from "@react-navigation/native";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import React from "react";

import { ThemeContext } from "../../../Providers/ThemeProvider";
import CasesList from "../CasesList";

// Mocking the database functions
jest.mock("../../../DataBase", () => ({
  getCases: jest.fn(() =>
    Promise.resolve([
      {
        id: 1,
        CaseTitle: "Test Case 1",
        ClientName: "Test Client 1",
        CaseStatus: "Active",
        NextDate: new Date(
          new Date().getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: "2024-01-01",
        PreviousDate: "2023-12-01",
      },
    ])
  ),
  addCaseTimelineEvent: jest.fn(() => Promise.resolve(1)),
  updateCase: jest.fn(() => Promise.resolve(true)),
  getCaseById: jest.fn(() => Promise.resolve({ id: 1 })),
}));

// Mocking the NewCaseCard component
jest.mock("../components/NewCaseCard", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  const MockNewCaseCard = ({ caseDetails, onUpdateHearingPress }: any) => (
    <View>
      <Text>{caseDetails.title}</Text>
      <TouchableOpacity onPress={() => onUpdateHearingPress(caseDetails)}>
        <Text>Update Hearing</Text>
      </TouchableOpacity>
    </View>
  );
  return {
    __esModule: true,
    default: MockNewCaseCard,
  };
});

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useRoute: () => ({
      params: {},
    }),
  };
});

const theme = {
  colors: {
    background: "#fff",
    text: "#000",
    primary: "#007AFF",
    card: "#f0f0f0",
    textSecondary: "#8E8E93",
    cardDeep: "#E0E0E0",
  },
};

import { SafeAreaProvider } from "react-native-safe-area-context";
import LanguageProvider from "../../../Providers/LanguageProvider";
import ThemeProvider from "../../../Providers/ThemeProvider";
import { ToastProvider } from "../../../Providers/ToastContext";

const renderComponent = () =>
  render(
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NavigationContainer>
            <ToastProvider>
              <CasesList />
            </ToastProvider>
          </NavigationContainer>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe("CasesList", () => {
  it("shows the UpdateHearingPopup when 'Update Hearing' is pressed", async () => {
    const { findByText } = renderComponent();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    const updateHearingButton = await findByText("Update Hearing");
    fireEvent.press(updateHearingButton);

    const popupTitle = await findByText("Update Hearing & Fee Details");
    expect(popupTitle).toBeTruthy();
  });

  it("triggers getCases with proper smartFilter when a filter chip is tapped", async () => {
    const { getCases } = require("../../../DataBase");
    const { findByText } = renderComponent();

    const overdueChip = await findByText("Overdue");
    fireEvent.press(overdueChip);

    expect(getCases).toHaveBeenCalledWith(
      null,
      20,
      0,
      expect.objectContaining({
        smartFilter: "overdue",
      })
    );

    const feePendingChip = await findByText("Fee Pending");
    fireEvent.press(feePendingChip);

    expect(getCases).toHaveBeenCalledWith(
      null,
      20,
      0,
      expect.objectContaining({
        smartFilter: "feePending",
      })
    );
  });
});
