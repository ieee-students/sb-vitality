import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RebatePanel } from "./RebatePanel";
import type { Kpis } from "../domain/types";

const sampleKpis: Kpis = {
  branchCount: 23,
  branchChange: null,
  branchesWithoutAllOfficers: 3,
  branchesWithoutReportedOfficers: 1,
  branchesWithoutCounselor: 2,
  branchesWithoutChair: 1,
  members: 1500,
  membersMissing: 0,
  memberChange: null,
  reportedEvents: 120,
  reportedEventsMissing: 0,
  eventsYear: 2026,
  eventsYearToDate: true,
  unreportedEvents: 10,
  unreportedMissing: 0,
  goodStanding: {
    good: 20,
    needsSupport: 3,
    inactive: 0,
    incomplete: 0,
  },
  goodStandingRate: 20 / 23,
  previousRates: [
    {
      rebateYear: 2026,
      rate: 18 / 22,
      counts: { good: 18, needsSupport: 4, inactive: 0, incomplete: 0 },
      activeBranches: 22,
      totalBranches: 23,
    },
    {
      rebateYear: 2025,
      rate: 17 / 21,
      counts: { good: 17, needsSupport: 4, inactive: 0, incomplete: 0 },
      activeBranches: 21,
      totalBranches: 23,
    },
  ],
  expectedRebate: 9438,
  foregoneRebate: 268,
  unknownRebateBranches: 0,
  sectionStudentPortion: 4500,
  sectionPortionMissing: 0,
  openRebateYear: 2027,
  cycleRebates: [
    {
      rebateYear: 2027,
      kind: "open",
      eventYear: 2026,
      membersLabel: "Members now",
      expectedRebate: 9438,
      foregoneRebate: 268,
      unknownRebateBranches: 0,
      sectionStudentPortion: 4500,
      sectionPortionMissing: 0,
      qualifiedBranches: 20,
      unqualifiedBranches: 3,
      activeBranches: 23,
      totalBranches: 23,
      members: 1500,
      officersEvaluated: true,
    },
    {
      rebateYear: 2026,
      kind: "complete",
      eventYear: 2025,
      membersLabel: "Dec 2025 members",
      expectedRebate: 8850,
      foregoneRebate: 750,
      unknownRebateBranches: 0,
      sectionStudentPortion: 4200,
      sectionPortionMissing: 0,
      qualifiedBranches: 18,
      unqualifiedBranches: 4,
      activeBranches: 22,
      totalBranches: 23,
      members: 1400,
      officersEvaluated: false,
    },
    {
      rebateYear: 2025,
      kind: "complete",
      eventYear: 2024,
      membersLabel: "Dec 2024 members",
      expectedRebate: 8100,
      foregoneRebate: 900,
      unknownRebateBranches: 0,
      sectionStudentPortion: 3900,
      sectionPortionMissing: 0,
      qualifiedBranches: 17,
      unqualifiedBranches: 4,
      activeBranches: 21,
      totalBranches: 23,
      members: 1300,
      officersEvaluated: false,
    },
  ],
};

describe("RebatePanel", () => {
  it("renders 3-year cycle overview with approximate values and qualification counts", () => {
    const html = renderToStaticMarkup(createElement(RebatePanel, { kpis: sampleKpis }));

    expect(html).toContain("Approximate rebate estimates (3-year overview)");
    expect(html).toContain("2027");
    expect(html).toContain("2026");
    expect(html).toContain("2025");

    // Open cycle values
    expect(html).toContain("$9,438");
    expect(html).toContain("20</strong> of 23 SBs qualified");
    expect(html).toContain("Rebate at risk");
    expect(html).toContain("$268");
    expect(html).toContain("3</strong> SBs unqualified ($0.00)");
    expect(html).toContain("Student portion of Section rebate");
    expect(html).toContain("$4,500");

    // Completed cycle values
    expect(html).toContain("$8,850");
    expect(html).toContain("18</strong> of 22 SBs qualified");
    expect(html).toContain("Unqualified rebate");
    expect(html).toContain("$750");

    expect(html).toContain("$8,100");
    expect(html).toContain("17</strong> of 21 SBs qualified");
    expect(html).toContain("$900");

    // Historical officer disclaimer
    expect(html).toContain("Historical officer status is not in the CSV export");

    // Vitality conditions guidance
    expect(html).toContain("4 Vitality Conditions Required");
    expect(html).toContain("≥ 12 student members");
    expect(html).toContain("≥ 4 reported events");
    expect(html).toContain("Reported officers");
    expect(html).toContain("Annual plan submitted");
    expect(html).toContain("$0.00");

    // Q3 transfer and section distribution
    expect(html).toContain("Q3");
    expect(html).toContain("Sections receive the total student branch rebate from IEEE and are responsible for distributing");

    // Verified numbers link
    expect(html).toContain("https://events.vtools.ieee.org/tego_/events/administration/rebates");
    expect(html).toContain("IEEE vTools Rebates Administration");
  });
});
