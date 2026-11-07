import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CycleGapSummary, GapCounts } from "../domain/types";
import { GapPanel } from "./GapPanel";

const mockGaps: GapCounts = {
  onlyMembers: 68,
  onlyEvents: 1122,
  onlyOfficers: 10,
  onlyPlan: 45,
  missingTwo: 720,
  missingThree: 255,
  missingFour: 100,
  multiple: 1075,
  incomplete: 897,
  good: 1500,
};

const mockCycleGaps: CycleGapSummary[] = [
  {
    cycle: {
      rebateYear: 2027,
      kind: "open",
      members: { source: "current" },
      eventYear: 2026,
      planYear: 2027,
      eventsAreYearToDate: true,
    },
    gaps: mockGaps,
    planExcluded: true,
    officersEvaluated: true,
  },
  {
    cycle: {
      rebateYear: 2026,
      kind: "complete",
      members: { source: "snapshot", year: 2025 },
      eventYear: 2025,
      planYear: 2026,
      eventsAreYearToDate: false,
    },
    gaps: {
      onlyMembers: 142,
      onlyEvents: 410,
      onlyOfficers: 0,
      onlyPlan: 180,
      missingTwo: 350,
      missingThree: 85,
      missingFour: 0,
      multiple: 435,
      incomplete: 115,
      good: 1600,
    },
    planExcluded: false,
    officersEvaluated: false,
  },
  {
    cycle: {
      rebateYear: 2025,
      kind: "complete",
      members: { source: "snapshot", year: 2024 },
      eventYear: 2024,
      planYear: 2025,
      eventsAreYearToDate: false,
    },
    gaps: {
      onlyMembers: 130,
      onlyEvents: 390,
      onlyOfficers: 0,
      onlyPlan: 195,
      missingTwo: 320,
      missingThree: 90,
      missingFour: 0,
      multiple: 410,
      incomplete: 120,
      good: 1620,
    },
    planExcluded: false,
    officersEvaluated: false,
  },
];

describe("GapPanel requirement gap breakdown", () => {
  it("renders a 3-year comparison table showing numbers for 2027, 2026, and 2025", () => {
    const html = renderToStaticMarkup(
      createElement(GapPanel, {
        cycleGaps: mockCycleGaps,
        gaps: mockGaps,
        openYear: 2027,
        planExcluded: true,
      }),
    );

    expect(html).toContain("Why branches miss");
    expect(html).toContain("2027");
    expect(html).toContain("2026");
    expect(html).toContain("2025");
    expect(html).toContain("Under 12 members");
    expect(html).toContain("Fewer than 4 events");
    expect(html).toContain("No reported officers");
    expect(html).toContain("Annual plan not submitted");
    expect(html).toContain("2 requirements missing");
    expect(html).toContain("3 requirements missing");
    expect(html).toContain("All 4 requirements missing");
    expect(html).toContain("Incomplete data");
    expect(html).toContain("1,122"); // 2027 events
    expect(html).toContain("410"); // 2026 events
    expect(html).toContain("390"); // 2025 events
    expect(html).toContain("Excluded*"); // 2027 excluded plan
    expect(html).toContain("N/A*"); // historical officers
  });

  it("renders clear labels without 'only' suffix in single year fallback (plan excluded)", () => {
    const html = renderToStaticMarkup(
      createElement(GapPanel, {
        gaps: mockGaps,
        openYear: 2027,
        planExcluded: true,
      }),
    );

    expect(html).toContain("Why branches miss 2027");
    expect(html).toContain("The annual plan is excluded from this breakdown.");
    expect(html).not.toContain("“Only”");
    expect(html).toContain("Under 12 members");
    expect(html).not.toContain("Under 12 members only");
    expect(html).toContain("Fewer than 4 events");
    expect(html).not.toContain("Fewer than 4 events only");
    expect(html).toContain("No reported officers");
    expect(html).not.toContain("No reported officers only");
    expect(html).not.toContain("Annual plan not submitted");
    expect(html).toContain("2 requirements missing");
    expect(html).toContain("All 3 requirements missing");
    expect(html).not.toContain("All 4 requirements missing");
    expect(html).toContain("Incomplete data");
    expect(html).toContain("1,122");
    expect(html).toContain("897");
  });

  it("renders all 4 requirement rows in single year fallback when annual plan is included", () => {
    const html = renderToStaticMarkup(
      createElement(GapPanel, {
        gaps: mockGaps,
        openYear: 2027,
        planExcluded: false,
      }),
    );

    expect(html).toContain("Why branches miss 2027");
    expect(html).toContain("Each branch is counted once, for the open cycle.");
    expect(html).not.toContain("“Only”");
    expect(html).toContain("Under 12 members");
    expect(html).toContain("Fewer than 4 events");
    expect(html).toContain("No reported officers");
    expect(html).toContain("Annual plan not submitted");
    expect(html).toContain("2 requirements missing");
    expect(html).toContain("3 requirements missing");
    expect(html).toContain("All 4 requirements missing");
    expect(html).toContain("Incomplete data");
  });
});

