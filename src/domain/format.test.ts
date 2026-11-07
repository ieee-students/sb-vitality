import { describe, expect, it } from "vitest";
import { MIN_EVENTS, MIN_MEMBERS } from "../config/defaults";
import {
  branchCycleHeading,
  counselorHint,
  formatBranchChange,
  gapLabel,
  goodStandingHint,
  headingLines,
  historicalOfficersHint,
  officersHint,
  standingLabel,
} from "./format";

describe("good standing hint", () => {
  it("names the members, reported events, and annual plan counted for a year", () => {
    expect(goodStandingHint("2026", true)).toBe(
      `2026: student branches with at least ${MIN_MEMBERS} members, ${MIN_EVENTS} reported events, and a submitted annual plan.`,
    );
    expect(goodStandingHint("2027 projected", true, true)).toBe(
      `2027 projected: student branches with at least ${MIN_MEMBERS} members, ${MIN_EVENTS} reported events, at least one reported officer or counselor, and a submitted annual plan.`,
    );
  });

  it("stacks the projected year and the excluded plan on their own lines", () => {
    expect(headingLines("2027 projected · plan excluded")).toEqual(["2027", "projected", "plan excluded"]);
    expect(headingLines("2027 projected")).toEqual(["2027", "projected"]);
    expect(headingLines("2026")).toEqual(["2026"]);
    expect(
      headingLines(
        branchCycleHeading(
          {
            rebateYear: 2027,
            kind: "open",
            members: { source: "current" },
            eventYear: 2026,
            planYear: 2027,
            eventsAreYearToDate: true,
          },
          true,
        ),
      ),
    ).toEqual(["2027 vitality", "projected", "plan excluded"]);
    expect(
      headingLines(
        branchCycleHeading(
          {
            rebateYear: 2026,
            kind: "complete",
            members: { source: "snapshot", year: 2025 },
            eventYear: 2025,
            planYear: 2026,
            eventsAreYearToDate: false,
          },
          true,
        ),
      ),
    ).toEqual(["2026 vitality"]);
    expect(historicalOfficersHint(2026, "Dec 2025 members", 2025)).toBe(
      "Historical officer data is not in the CSV export, so 2026 vitality is evaluated from Dec 2025 members, 2025 reported events, and the 2026 annual plan.",
    );
  });

  it("says the projected year leaves the annual plan out", () => {
    expect(goodStandingHint("2027 projected · plan excluded", false)).toBe(
      `2027 projected · plan excluded: student branches with at least ${MIN_MEMBERS} members and ${MIN_EVENTS} reported events. The annual plan is not counted for this projected year.`,
    );
    expect(goodStandingHint("2027 projected · plan excluded", false, true)).toBe(
      `2027 projected · plan excluded: student branches with at least ${MIN_MEMBERS} members, ${MIN_EVENTS} reported events, and at least one reported officer or counselor. The annual plan is not counted for this projected year.`,
    );
  });

  it("describes missing officers by role without exposing emails", () => {
    expect(officersHint(4, [], true, true)).toBe(
      "All 4 ExCom officers reported (Chair, Vice Chair, Treasurer, Secretary). Compliant for rebate reporting.",
    );
    expect(officersHint(3, ["Treasurer"], true, true)).toBe(
      "3 of 4 ExCom officers reported. Missing: Treasurer. Compliant for rebate reporting.",
    );
    expect(officersHint(3, ["Chair"], true, false)).toBe(
      "3 of 4 ExCom officers reported. Missing: Chair. Compliant for rebate reporting. Note: Chair is vacant. Maintaining a Chair is recommended at all times.",
    );
    expect(officersHint(0, ["Chair", "Vice Chair", "Treasurer", "Secretary"], false, false)).toBe(
      "No officers reported. Non-compliant for rebate (at least one ExCom officer or Counselor required).",
    );
    expect(counselorHint(true)).toBe(
      "Counselor reported. Meets recommended student branch leadership standard.",
    );
    expect(counselorHint(false)).toBe(
      "No Counselor reported. Maintaining a Counselor at all times is recommended for branch vitality.",
    );
  });

  it("formats gap labels with clear requirement text and counts", () => {
    expect(gapLabel("only-members")).toBe("Under 12 members");
    expect(gapLabel("only-events")).toBe("Fewer than 4 events");
    expect(gapLabel("only-officers")).toBe("No reported officers");
    expect(gapLabel("only-plan")).toBe("Annual plan not submitted");
    expect(gapLabel("two-requirements")).toBe("2 requirements not met");
    expect(gapLabel("three-requirements")).toBe("3 requirements not met");
    expect(gapLabel("four-requirements")).toBe("All 4 requirements not met");
    expect(gapLabel("incomplete")).toBe("Incomplete data");
    expect(gapLabel("not-established")).toBe("Not established");
    expect(gapLabel("good")).toBe("In good standing");
    expect(standingLabel("not-established")).toBe("Not established");
  });

  it("formats branch change notes cleanly", () => {
    expect(
      formatBranchChange({
        current: 3941,
        previous: 3742,
        previousLabel: "31 Dec 2025",
        difference: 199,
        direction: "up",
        percent: 0.053,
        historyText: "",
      }),
    ).toBe("Up 199 (5%) vs 31 Dec 2025");
    expect(
      formatBranchChange({
        current: 10,
        previous: 10,
        previousLabel: "31 Dec 2025",
        difference: 0,
        direction: "flat",
        percent: 0,
        historyText: "",
      }),
    ).toBe("No change vs 31 Dec 2025");
  });
});
