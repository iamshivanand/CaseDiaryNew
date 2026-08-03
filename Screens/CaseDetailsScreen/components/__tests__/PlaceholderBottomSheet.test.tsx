// Screens/CaseDetailsScreen/components/__tests__/PlaceholderBottomSheet.test.tsx
import { render, fireEvent } from "@testing-library/react-native";
import React from "react";

import { PlaceholderBottomSheet } from "../PlaceholderBottomSheet";

const mockTheme: any = {
  colors: {
    primary: "#ca8a04",
    cardBackground: "#ffffff",
    inputBackground: "#f3f4f6",
    border: "#e5e7eb",
    text: "#1f2937",
    subText: "#6b7280",
  },
};

describe("PlaceholderBottomSheet", () => {
  it("should render placeholder label and clean label when visible", () => {
    const { getByText } = render(
      <PlaceholderBottomSheet
        visible
        placeholderLabel="[Petitioner Name]"
        cleanLabel="Petitioner Name"
        theme={mockTheme}
        onApply={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(getByText("Fill Placeholder Details")).toBeTruthy();
    expect(getByText("Petitioner Name")).toBeTruthy();
  });

  it("should call onApply with original label and new value when submitted", () => {
    const onApply = jest.fn();
    const onClose = jest.fn();

    const { getByTestId } = render(
      <PlaceholderBottomSheet
        visible
        placeholderLabel="[Petitioner Name]"
        cleanLabel="Petitioner Name"
        theme={mockTheme}
        onApply={onApply}
        onClose={onClose}
      />
    );

    const input = getByTestId("placeholder-value-input");
    fireEvent.changeText(input, "John Doe");

    const applyBtn = getByTestId("apply-placeholder-btn");
    fireEvent.press(applyBtn);

    expect(onApply).toHaveBeenCalledWith("[Petitioner Name]", "John Doe");
    expect(onClose).toHaveBeenCalled();
  });
});
