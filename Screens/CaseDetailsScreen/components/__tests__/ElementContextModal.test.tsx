// Screens/CaseDetailsScreen/components/__tests__/ElementContextModal.test.tsx
import { render, fireEvent } from "@testing-library/react-native";
import React from "react";

import { ElementContextModal } from "../ElementContextModal";

const mockTheme: any = {
  colors: {
    primary: "#2563eb",
    cardBackground: "#ffffff",
    inputBackground: "#f3f4f6",
    border: "#e5e7eb",
    text: "#1f2937",
    subText: "#6b7280",
  },
};

describe("ElementContextModal", () => {
  it("should render table options when elementType is table", () => {
    const { getByText } = render(
      <ElementContextModal
        visible
        elementType="table"
        theme={mockTheme}
        onDeleteElement={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(getByText("Court Table Options")).toBeTruthy();
    expect(getByText("Toggle Borders (Visible ↔ Borderless Columns)")).toBeTruthy();
  });

  it("should trigger onToggleBorders when toggle button is pressed", () => {
    const onToggleBorders = jest.fn();
    const onClose = jest.fn();

    const { getByText } = render(
      <ElementContextModal
        visible
        elementType="table"
        theme={mockTheme}
        onDeleteElement={jest.fn()}
        onToggleBorders={onToggleBorders}
        onClose={onClose}
      />
    );

    fireEvent.press(getByText("Toggle Borders (Visible ↔ Borderless Columns)"));
    expect(onToggleBorders).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
