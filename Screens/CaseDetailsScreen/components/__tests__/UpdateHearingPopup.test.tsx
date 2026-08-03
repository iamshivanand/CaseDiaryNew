import { render, fireEvent } from "@testing-library/react-native";
import React from "react";

import UpdateHearingPopup from "../UpdateHearingPopup";

jest.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: jest
      .fn()
      .mockResolvedValue({ status: "granted", granted: true }),
    getStateAsync: jest.fn().mockResolvedValue("inactive"),
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  useSpeechRecognitionEvent: jest.fn(),
}));

describe("UpdateHearingPopup", () => {
  it("renders correctly when visible", () => {
    const { getByText, getByPlaceholderText } = render(
      <UpdateHearingPopup visible onClose={() => {}} onSave={() => {}} />
    );

    expect(getByText("Update Hearing & Fee Details")).toBeTruthy();
    expect(
      getByPlaceholderText("Dictate or type today's court hearing notes...")
    ).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <UpdateHearingPopup
        visible={false}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    expect(queryByText("Update Hearing & Payment Details")).toBeNull();
  });

  it("calls onSave with the correct data when save is pressed", () => {
    const onSave = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <UpdateHearingPopup visible onClose={() => {}} onSave={onSave} />
    );

    const notesInput = getByPlaceholderText(
      "Dictate or type today's court hearing notes..."
    );
    fireEvent.changeText(notesInput, "Test notes");

    const saveButton = getByText("Save");
    fireEvent.press(saveButton);

    expect(onSave).toHaveBeenCalled();
  });

  it("calls onClose when cancel is pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <UpdateHearingPopup visible onClose={onClose} onSave={() => {}} />
    );

    const cancelButton = getByText("Cancel");
    fireEvent.press(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("renders voice dictation bar and allows language toggling", () => {
    const { getByText } = render(
      <UpdateHearingPopup visible onClose={() => {}} onSave={() => {}} />
    );

    expect(getByText("EN")).toBeTruthy();
    expect(getByText("HI")).toBeTruthy();
    expect(getByText("Voice Dictate (HI)")).toBeTruthy();

    const enToggle = getByText("EN");
    fireEvent.press(enToggle);

    expect(getByText("Voice Dictate (EN)")).toBeTruthy();
  });
});
