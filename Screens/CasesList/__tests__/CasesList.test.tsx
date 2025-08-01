import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CasesList from "../CasesList";
import { ThemeContext } from "../../../Providers/ThemeProvider";
import { NavigationContainer, useRoute } from "@react-navigation/native";

// Mocking the database functions
jest.mock("../../../DataBase", () => ({
  getCases: jest.fn(() =>
    Promise.resolve([
      {
        id: 1,
        CaseTitle: "Test Case 1",
        ClientName: "Test Client 1",
        CaseStatus: "Active",
        NextDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
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
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ caseDetails, onUpdateHearingPress }) => (
    <View>
      <Text>{caseDetails.title}</Text>
      <TouchableOpacity onPress={onUpdateHearingPress}>
        <Text>Update Hearing</Text>
      </TouchableOpacity>
    </View>
  );
});

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
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

describe("CasesList", () => {
  it("shows the UpdateHearingPopup when 'Update Hearing' is pressed", async () => {
    const { findByText, findAllByText } = render(
      <NavigationContainer>
        <ThemeContext.Provider value={{ theme }}>
          <CasesList />
        </ThemeContext.Provider>
      </NavigationContainer>
    );

    const updateHearingButton = await findByText("Update Hearing");
    fireEvent.press(updateHearingButton);

    const updateHearingElements = await findAllByText("Update Hearing");
    expect(updateHearingElements.length).toBe(2);
  });
});
