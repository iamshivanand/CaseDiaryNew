// Screens/CaseDetailsScreen/components/__tests__/ElementContextModal.test.tsx
import { render, fireEvent } from "@testing-library/react-native";
import React from "react";

import { ElementContextModal } from "../ElementContextModal";

const mockTheme: any = {
  colors: {
    primary: "#6366F1",
    cardBackground: "#ffffff",
    inputBackground: "#f3f4f6",
    background: "#ffffff",
    border: "#e5e7eb",
    text: "#1f2937",
    subText: "#6b7280",
  },
};

describe("ElementContextModal", () => {
  it("should render table options including column alignment and cell alignment", () => {
    const { getByText, getByTestId } = render(
      <ElementContextModal
        visible
        elementType="table"
        theme={mockTheme}
        onDeleteElement={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(getByText("Court Table Options")).toBeTruthy();
    expect(getByText("Column Text Alignment")).toBeTruthy();
    expect(getByTestId("align-col-left-btn")).toBeTruthy();
    expect(getByTestId("align-col-center-btn")).toBeTruthy();
    expect(getByTestId("align-col-right-btn")).toBeTruthy();
    expect(getByTestId("align-col-justify-btn")).toBeTruthy();
  });

  it("should trigger onAlignColumn when column alignment buttons are clicked", () => {
    const onAlignColumn = jest.fn();
    const onClose = jest.fn();

    const { getByTestId } = render(
      <ElementContextModal
        visible
        elementType="table"
        theme={mockTheme}
        onDeleteElement={jest.fn()}
        onAlignColumn={onAlignColumn}
        onClose={onClose}
      />
    );

    fireEvent.press(getByTestId("align-col-center-btn"));
    expect(onAlignColumn).toHaveBeenCalledWith("center");
    expect(onClose).toHaveBeenCalled();

    fireEvent.press(getByTestId("align-col-right-btn"));
    expect(onAlignColumn).toHaveBeenCalledWith("right");
  });

  it("should trigger onAlignCell when cell alignment buttons are clicked", () => {
    const onAlignCell = jest.fn();
    const onClose = jest.fn();

    const { getByTestId } = render(
      <ElementContextModal
        visible
        elementType="table"
        theme={mockTheme}
        onDeleteElement={jest.fn()}
        onAlignCell={onAlignCell}
        onClose={onClose}
      />
    );

    fireEvent.press(getByTestId("align-cell-justify-btn"));
    expect(onAlignCell).toHaveBeenCalledWith("justify");
    expect(onClose).toHaveBeenCalled();
  });

  it("should trigger onDeleteElement when delete table button is pressed", () => {
    const onDeleteElement = jest.fn();
    const onClose = jest.fn();

    const { getByTestId } = render(
      <ElementContextModal
        visible
        elementType="table"
        theme={mockTheme}
        onDeleteElement={onDeleteElement}
        onClose={onClose}
      />
    );

    fireEvent.press(getByTestId("delete-element-btn"));
    expect(onDeleteElement).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
