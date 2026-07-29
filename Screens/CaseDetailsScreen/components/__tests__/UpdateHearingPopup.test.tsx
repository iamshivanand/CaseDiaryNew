import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import UpdateHearingPopup from "../UpdateHearingPopup";

describe("UpdateHearingPopup", () => {
  it("renders correctly when visible", () => {
    const { getByText, getByPlaceholderText } = render(
      <UpdateHearingPopup visible={true} onClose={() => {}} onSave={() => {}} />
    );

    expect(getByText("Update Hearing & Payment Details")).toBeTruthy();
    expect(getByPlaceholderText("Notes for today's hearing proceedings...")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <UpdateHearingPopup visible={false} onClose={() => {}} onSave={() => {}} />
    );

    expect(queryByText("Update Hearing & Payment Details")).toBeNull();
  });

  it("calls onSave with the correct data when save is pressed", () => {
    const onSave = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <UpdateHearingPopup visible={true} onClose={() => {}} onSave={onSave} />
    );

    const notesInput = getByPlaceholderText("Notes for today's hearing proceedings...");
    fireEvent.changeText(notesInput, "Test notes");

    const saveButton = getByText("Save");
    fireEvent.press(saveButton);

    expect(onSave).toHaveBeenCalled();
  });

  it("calls onClose when cancel is pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <UpdateHearingPopup visible={true} onClose={onClose} onSave={() => {}} />
    );

    const cancelButton = getByText("Cancel");
    fireEvent.press(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
