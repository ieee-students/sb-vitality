import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityStatStrip, KpiGrid } from "./KpiGrid";
import type { Kpis } from "../domain/types";

const mockKpis: Kpis = {
  members: 172141,
  membersMissing: 0,
  memberChange: {
    current: 172141,
    previous: 195202,
    previousLabel: "31 Dec 2025",
    direction: "down",
    percent: -0.118,
  },
  branchCount: 3941,
  branchChange: {
    current: 3941,
    previous: 3742,
    previousLabel: "31 Dec 2025",
    difference: 199,
    direction: "up",
    percent: 0.053,
    historyText: "Active units: 3,941 today · 3,742 at Dec 2025 · 3,605 at Dec 2024 based on member snapshots.",
  },
  branchesWithoutReportedOfficers: 1200,
  branchesWithoutAllOfficers: 1500,
  branchesWithoutCounselor: 1471,
  branchesWithoutChair: 1853,
  reportedEvents: 13642,
  reportedEventsMissing: 0,
  eventsYear: 2026,
  eventsYearToDate: true,
  unreportedEvents: 2626,
  unreportedMissing: 0,
  goodStanding: {
    good: 769,
    needsSupport: 3172,
    inactive: 0,
    incomplete: 0,
  },
  openRebateYear: 2027,
  goodStandingRate: 0.2,
  previousRates: [
    {
      rebateYear: 2026,
      rate: 0.3,
      counts: { good: 1122, needsSupport: 2620, inactive: 0, incomplete: 0 },
      activeBranches: 3742,
      totalBranches: 3941,
    },
    {
      rebateYear: 2025,
      rate: 0.32,
      counts: { good: 1150, needsSupport: 2455, inactive: 0, incomplete: 0 },
      activeBranches: 3605,
      totalBranches: 3941,
    },
  ],
  expectedRebate: 198080,
  foregoneRebate: 391502,
  unknownRebateBranches: 0,
  sectionStudentPortion: 516423,
  sectionPortionMissing: 0,
};

describe("KpiGrid", () => {
  it("renders outcome cards with In good standing as primary", () => {
    const html = renderToStaticMarkup(
      createElement(KpiGrid, {
        kpis: mockKpis,
        showRebate: false,
      }),
    );

    expect(html).toContain("In good standing");
    expect(html).toContain("769");
    expect(html).toContain("20% of branches for 2027 projected.");
    expect(html).toContain("2026 was 30% · 2025 was 32%.");
    expect(html).not.toContain("Branch rebate");
  });

  it("renders Branch rebate when showRebate is true", () => {
    const html = renderToStaticMarkup(
      createElement(KpiGrid, {
        kpis: mockKpis,
        showRebate: true,
      }),
    );

    expect(html).toContain("In good standing");
    expect(html).toContain("Branch rebate");
    expect(html).toContain("$198,080");
    expect(html).toContain("Foregone at current size: $391,502");
    expect(html).toContain("Section student portion, paid to sections: $516,423");
  });
});

describe("ActivityStatStrip", () => {
  it("renders the 3 activity metrics with deltas and details", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityStatStrip, {
        kpis: mockKpis,
      }),
    );

    expect(html).toContain("Student members");
    expect(html).toContain("172,141");
    expect(html).toContain("Down 23,061 (-12%) vs 31 Dec 2025");

    expect(html).toContain("Student branches");
    expect(html).toContain("3,941");
    expect(html).toContain("Up 199 (5%) vs 31 Dec 2025");
    expect(html).toContain("1,200 without an officer report");
    expect(html).toContain("1,471 without a counselor");
    expect(html).toContain("1,853 without a chair");
    expect(html).toContain("Active units: 3,941 today · 3,742 at Dec 2025 · 3,605 at Dec 2024");

    expect(html).toContain("Events reported");
    expect(html).toContain("13,642");
    expect(html).toContain("2026 year to date");
    expect(html).toContain("2,626 unreported, not counted");
  });
});
