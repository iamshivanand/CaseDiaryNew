import { render } from "@testing-library/react-native";
import React from "react";
import TimelineEventItem from "../TimelineEventItem";
import { TimelineEvent } from "../../../../Types/appTypes";

describe("TimelineEventItem", () => {
  it("formats embedded YYYY-MM-DD dates in the description as DD-MM-YYYY", () => {
    const event: TimelineEvent = {
      id: "1",
      case_id: 101,
      date: "2026-08-27",
      description: "Hearing adjourned / rescheduled: 2024-01-15 ➔ 2024-02-20",
      event_type: "hearing_adjourned",
    };

    const { getByText } = render(<TimelineEventItem event={event} />);
    expect(
      getByText("Hearing adjourned / rescheduled: 15-01-2024 ➔ 20-02-2024")
    ).toBeTruthy();
  });

  it("handles regular notes without dates normally", () => {
    const event: TimelineEvent = {
      id: "2",
      case_id: 101,
      date: "2026-08-27",
      description: "Witness cross-examination completed.",
      event_type: "hearing_proceeding",
    };

    const { getByText } = render(<TimelineEventItem event={event} />);
    expect(getByText("Witness cross-examination completed.")).toBeTruthy();
  });
});
