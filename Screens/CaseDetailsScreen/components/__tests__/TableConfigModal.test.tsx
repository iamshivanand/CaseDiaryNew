// Screens/CaseDetailsScreen/components/__tests__/TableConfigModal.test.tsx
import { render, fireEvent } from "@testing-library/react-native";
import React from "react";

import { TableConfigModal } from "../TableConfigModal";

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

describe("TableConfigModal", () => {
  it("should render table configuration modal with rows and columns controls", () => {
    const { getByText } = render(
      <TableConfigModal
        visible
        theme={mockTheme}
        onInsertTable={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(getByText("Configure Court Table")).toBeTruthy();
    expect(getByText("Will insert a 3 x 3 table with headers")).toBeTruthy();
  });

  it("should increment rows and call onInsertTable with custom dimensions", () => {
    const onInsertTable = jest.fn();
    const onClose = jest.fn();

    const { getByTestId, getByText } = render(
      <TableConfigModal
        visible
        theme={mockTheme}
        onInsertTable={onInsertTable}
        onClose={onClose}
      />
    );

    const incRowsBtn = getByTestId("increment-rows-btn");
    fireEvent.press(incRowsBtn);

    expect(getByText("Will insert a 4 x 3 table with headers")).toBeTruthy();

    const confirmBtn = getByTestId("confirm-insert-table-btn");
    fireEvent.press(confirmBtn);

    expect(onInsertTable).toHaveBeenCalledWith(4, 3);
    expect(onClose).toHaveBeenCalled();
  });
});
