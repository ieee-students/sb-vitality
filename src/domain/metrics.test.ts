import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  branchRows,
  branchTotals,
  buildKpis,
  collectOfficerContacts,
  countGaps,
  evaluateAll,
  filterBranches,
  selectTable,
  sortSummary,
  summaryRows,
  summaryTotals,
  urgentBranches,
  whereToAct,
  DEFAULT_BRANCH_SORT,
  DEFAULT_SUMMARY_SORT,
  defaultSummarySort,
} from "./metrics";
import { parseVitalityCsv } from "./parseCsv";
import type { SummaryRow } from "./types";

const workbook = parseVitalityCsv(
  readFileSync(resolve(process.cwd(), "samples/sample-sb-vitality-report.csv"), "utf8"),
);

function named(ignorePlan: boolean, school: string) {
  return evaluateAll(workbook.branches, workbook.cycles, ignorePlan).find(
    (item) => item.branch.schoolName === school,
  );
}

describe("sample rollups", () => {
  it("matches the open-cycle totals when the plan still counts", () => {
    const evaluations = evaluateAll(workbook.branches, workbook.cycles, false);
    const kpis = buildKpis(evaluations, workbook.cycles);
    expect(kpis.branchCount).toBe(11);
    expect(kpis.branchesWithoutAllOfficers).toBe(4);
    expect(kpis.branchesWithoutReportedOfficers).toBe(1);
    expect(kpis.branchesWithoutCounselor).toBe(3);
    expect(kpis.branchesWithoutChair).toBe(1);
    expect(kpis.members).toBe(251);
    expect(kpis.memberChange).toMatchObject({ current: 251, previous: 222, direction: "up" });
    expect(kpis.reportedEvents).toBe(35);
    expect(kpis.reportedEventsMissing).toBe(1);
    expect(kpis.unreportedEvents).toBe(10);
    expect(kpis.goodStanding.good).toBe(5);
    expect(kpis.expectedRebate).toBe(710);
    expect(kpis.foregoneRebate).toBe(362);
    expect(kpis.sectionStudentPortion).toBe(753);
    expect(kpis.previousRates.map((item) => item.counts.good)).toEqual([8, 8]);
  });

  it("uses full column sums for member change even when a branch is missing one year", () => {
    const branches = workbook.branches.map((branch, index) =>
      index === 0
        ? { ...branch, membersByYear: { ...branch.membersByYear, 2025: null } }
        : branch,
    );
    const evaluations = evaluateAll(branches, workbook.cycles, false);
    const kpis = buildKpis(evaluations, workbook.cycles);
    const firstSnapshot = workbook.branches[0].membersByYear[2025] ?? 0;
    expect(kpis.members).toBe(251);
    expect(kpis.memberChange).toMatchObject({
      current: 251,
      previous: 222 - firstSnapshot,
      direction: "up",
    });
  });

  it("moves only the open cycle when the annual plan is set aside", () => {
    const withPlan = named(false, "Lumen College");
    const withoutPlan = named(true, "Lumen College");
    expect(withPlan?.open.standing).toBe("needs-support");
    expect(withPlan?.gap).toBe("only-plan");
    expect(withoutPlan?.open.standing).toBe("good");
    expect(withPlan?.dissolution.tier).toBe(withoutPlan?.dissolution.tier);

    const kpis = buildKpis(evaluateAll(workbook.branches, workbook.cycles, true), workbook.cycles);
    expect(kpis.goodStanding.good).toBe(6);
    expect(kpis.expectedRebate).toBe(800);
    expect(kpis.foregoneRebate).toBe(272);
    expect(kpis.previousRates.map((item) => item.counts.good)).toEqual([8, 8]);
  });

  it("does not count unreported events toward the minimum", () => {
    const workshop = named(false, "Unreported Workshop School");
    expect(workshop?.branch.unreportedByYear[2026]).toBe(4);
    expect(workshop?.open.events).toBe(2);
    expect(workshop?.open.standing).toBe("needs-support");
    expect(workshop?.gap).toBe("only-events");
  });

  it("separates dissolution tiers from incomplete inputs", () => {
    expect(named(false, "Pine Ridge University")?.dissolution.tier).toBe("immediate");
    expect(named(false, "Maple Conservatory")?.dissolution.tier).toBe("two-year-warning");
    expect(named(false, "One Year College")?.dissolution.tier).toBe("one-year-watch");
    expect(named(false, "Westmill Institute, City Campus")?.open.standing).toBe("incomplete");
    expect(named(true, "Westmill Institute, City Campus")?.open.standing).toBe("incomplete");
    expect(urgentBranches(evaluateAll(workbook.branches, workbook.cycles, true))[0].branch.schoolName).toBe(
      "Pine Ridge University",
    );
  });

  it("ranks sections by foregone rebate and sorts regions by branches that need attention", () => {
    const evaluations = evaluateAll(workbook.branches, workbook.cycles, false);
    expect(whereToAct(evaluations, "mga").map((item) => item.title)).toEqual([
      "Summit Section",
      "Harbor Section",
      "Lakes Section",
      "Oasis Section",
    ]);

    const manySections = Array.from({ length: 12 }, (_, index) => ({
      ...workbook.branches[1],
      spoid: `STB99${String(index).padStart(2, "0")}`,
      schoolName: `School ${index + 1}`,
      sectionName: `Section ${index + 1}`,
      sectionSlug: `section-${index + 1}`,
      currentMembers: 10 + index,
    }));
    const manyAct = whereToAct(evaluateAll(manySections, workbook.cycles, false), "mga");
    expect(manyAct).toHaveLength(12);
    expect(manyAct[0].title).toBe("Section 12");
    expect(manyAct[11].title).toBe("Section 1");
    expect(countGaps(evaluations)).toMatchObject({
      onlyPlan: 1,
      onlyEvents: 1,
      multiple: 3,
      incomplete: 1,
      good: 5,
    });

    const table = selectTable({
      evaluations,
      cycles: workbook.cycles,
      level: "mga",
      ignoreOpenPlan: false,
      query: "",
      summarySort: DEFAULT_SUMMARY_SORT,
      sectionSort: DEFAULT_SUMMARY_SORT,
      branchSort: DEFAULT_BRANCH_SORT,
    });
    expect(table.summaryKind).toBe("region");
    expect(table.summary.map((row) => row.name)).toEqual(["Region 10", "Region 7", "Region 8"]);
    expect(table.sections.map((row) => row.name).sort()).toEqual([
      "Harbor Section",
      "Lakes Section",
      "Oasis Section",
      "St. Mary's Section",
      "Summit Section",
    ]);

    const search = selectTable({
      evaluations,
      cycles: workbook.cycles,
      level: "mga",
      ignoreOpenPlan: false,
      query: "harbor",
      summarySort: DEFAULT_SUMMARY_SORT,
      sectionSort: DEFAULT_SUMMARY_SORT,
      branchSort: DEFAULT_BRANCH_SORT,
    });
    expect(search.summaryKind).toBe("region");
    expect(search.summary.map((row) => row.name)).toEqual(["Region 10", "Region 7", "Region 8"]);
    expect(search.sections.map((row) => row.name)).toEqual(["Harbor Section"]);

    const byEvents = selectTable({
      evaluations,
      cycles: workbook.cycles,
      level: "mga",
      ignoreOpenPlan: false,
      query: "",
      summarySort: DEFAULT_SUMMARY_SORT,
      sectionSort: { key: "events", direction: "desc" },
      branchSort: DEFAULT_BRANCH_SORT,
    });
    expect(byEvents.sections.map((row) => row.name)).toEqual([
      "Harbor Section",
      "Summit Section",
      "Oasis Section",
      "Lakes Section",
      "St. Mary's Section",
    ]);

    const byMembers = selectTable({
      evaluations,
      cycles: workbook.cycles,
      level: "mga",
      ignoreOpenPlan: false,
      query: "",
      summarySort: DEFAULT_SUMMARY_SORT,
      sectionSort: { key: "members", direction: "desc" },
      branchSort: DEFAULT_BRANCH_SORT,
    });
    expect(byMembers.sections.map((row) => row.name)).toEqual([
      "Harbor Section",
      "Oasis Section",
      "Summit Section",
      "Lakes Section",
      "St. Mary's Section",
    ]);
  });

  it("sorts region names from 1 through 10 and keeps a total of the listed rows", () => {
    const evaluations = evaluateAll(workbook.branches, workbook.cycles, false);
    const table = selectTable({
      evaluations,
      cycles: workbook.cycles,
      level: "mga",
      ignoreOpenPlan: false,
      query: "",
      summarySort: { key: "name", direction: "asc" },
      sectionSort: DEFAULT_SUMMARY_SORT,
      branchSort: DEFAULT_BRANCH_SORT,
    });
    expect(defaultSummarySort("mga")).toEqual({ key: "name", direction: "asc" });
    expect(defaultSummarySort("region")).toEqual(DEFAULT_SUMMARY_SORT);
    expect(table.summary.map((row) => row.name)).toEqual(["Region 7", "Region 8", "Region 10"]);
    expect(summaryTotals(table.summary)).toMatchObject({
      branches: 11,
      members: 251,
      reportedEvents: 35,
      withOfficers: 10,
      withCounselor: 8,
      missingOfficers: 1,
      missingCounselor: 3,
      sections: 5,
      sectionsWithSac: 5,
      sectionsWithSsr: 5,
      foregone: 362,
      standings: [
        { good: 5, total: 11 },
        { good: 8, total: 11 },
        { good: 8, total: 11 },
      ],
    });

    expect(
      sortSummary(
        ["Region 10", "Region 2", "Region 1", "Region 9"].map((name) => summaryRow(name)),
        { key: "name", direction: "asc" },
      ).map((row) => row.name),
    ).toEqual(["Region 1", "Region 2", "Region 9", "Region 10"]);
  });

  it("sorts good-standing counts and percents separately", () => {
    const rows = [
      summaryRow("Small", {
        standings: [{ label: "2026", good: 9, total: 10, planRequired: true }],
      }),
      summaryRow("Large", {
        standings: [{ label: "2026", good: 20, total: 100, planRequired: true }],
      }),
    ];
    expect(sortSummary(rows, { key: "standing-0", direction: "desc" }).map((row) => row.name)).toEqual([
      "Large",
      "Small",
    ]);
    expect(sortSummary(rows, { key: "rate-0", direction: "desc" }).map((row) => row.name)).toEqual([
      "Small",
      "Large",
    ]);
    expect(summaryTotals(rows).standings).toEqual([{ good: 29, total: 110 }]);
  });

  it("sorts section names and school names", () => {
    const evaluations = evaluateAll(workbook.branches, workbook.cycles, true);
    const sections = selectTable({
      evaluations,
      cycles: workbook.cycles,
      level: "region",
      ignoreOpenPlan: true,
      query: "",
      summarySort: { key: "name", direction: "asc" },
      sectionSort: DEFAULT_SUMMARY_SORT,
      branchSort: DEFAULT_BRANCH_SORT,
    });
    expect(sections.summary.map((row) => row.name)).toEqual([
      "Harbor Section",
      "Lakes Section",
      "Oasis Section",
      "St. Mary's Section",
      "Summit Section",
    ]);
    expect(sections.summary[0].standings[0].planRequired).toBe(false);
    expect(sections.summary[0].standings[1].planRequired).toBe(true);

    const schools = selectTable({
      evaluations,
      cycles: workbook.cycles,
      level: "section",
      ignoreOpenPlan: true,
      query: "",
      summarySort: DEFAULT_SUMMARY_SORT,
      sectionSort: DEFAULT_SUMMARY_SORT,
      branchSort: { key: "school", direction: "asc" },
    });
    expect(schools.branches.map((row) => row.schoolName)).toEqual([
      "Dormant Academy",
      "Harbor Polytechnic",
      "Lakeside Institute",
      "Lumen College",
      "Maple Conservatory",
      "One Year College",
      "Pine Ridge University",
      "Sahara Technical University",
      "St. Mary Observatory",
      "Unreported Workshop School",
      "Westmill Institute, City Campus",
    ]);
  });

  it("orders the region column numerically when sections from several regions are listed", () => {
    const rows = [
      summaryRow("Harbor", { regionLabel: "Region 10" }),
      summaryRow("Lakes", { regionLabel: "Region 2" }),
      summaryRow("Oasis", { regionLabel: "Region 1" }),
    ];
    expect(sortSummary(rows, { key: "region", direction: "asc" }).map((row) => row.regionLabel)).toEqual([
      "Region 1",
      "Region 2",
      "Region 10",
    ]);
    expect(summaryRows(evaluateAll(workbook.branches, workbook.cycles, false), "region", false)[0].standings[0].planRequired).toBe(
      true,
    );
  });

  it("populates officer slate counts, counselor status, and open-cycle officer standing", () => {
    const evaluations = evaluateAll(workbook.branches, workbook.cycles, false);
    const schools = selectTable({
      evaluations,
      cycles: workbook.cycles,
      level: "section",
      ignoreOpenPlan: false,
      query: "",
      summarySort: DEFAULT_SUMMARY_SORT,
      sectionSort: DEFAULT_SUMMARY_SORT,
      branchSort: { key: "officers", direction: "asc" },
    });
    expect(schools.branches.slice(0, 4).map((row) => [row.schoolName, row.officerCount, row.hasCounselor])).toEqual([
      ["Pine Ridge University", 0, false],
      ["Dormant Academy", 2, false],
      ["One Year College", 3, false],
      ["Westmill Institute, City Campus", 3, true],
    ]);

    const harborBranch = workbook.branches.find((item) => item.schoolName === "Harbor Polytechnic")!;
    const missingSecretaryBranch = {
      ...harborBranch,
      emails: { ...harborBranch.emails, secretary: "" },
    };
    const [evaluated] = evaluateAll([missingSecretaryBranch], workbook.cycles, true);
    expect(evaluated.officerCount).toBe(3);
    expect(evaluated.hasAllOfficers).toBe(false);
    expect(evaluated.hasReportedOfficers).toBe(true);
    expect(evaluated.hasCoreLeadership).toBe(true);
    expect(evaluated.missingOfficers).toEqual(["Secretary"]);
    expect(evaluated.open.standing).toBe("good");
    expect(evaluated.open.expectedRebate).toBe(228);
    expect(evaluated.open.foregoneRebate).toBe(0);
    expect(evaluated.gap).toBe("good");
    expect(evaluated.cycles[1].standing).toBe("good");
    expect(evaluated.cycles[2].standing).toBe("good");

    const noOfficersBranch = {
      ...harborBranch,
      emails: {
        ...harborBranch.emails,
        chair: "",
        viceChair: "",
        treasurer: "",
        secretary: "",
        counselor: "",
      },
    };
    const [noOfficersEvaluated] = evaluateAll([noOfficersBranch], workbook.cycles, true);
    expect(noOfficersEvaluated.officerCount).toBe(0);
    expect(noOfficersEvaluated.hasReportedOfficers).toBe(false);
    expect(noOfficersEvaluated.hasCoreLeadership).toBe(false);
    expect(noOfficersEvaluated.open.standing).toBe("needs-support");
    expect(noOfficersEvaluated.open.expectedRebate).toBe(0);
    expect(noOfficersEvaluated.open.foregoneRebate).toBe(228);
    expect(noOfficersEvaluated.gap).toBe("only-officers");
  });

  it("tracks section SAC Chair and SSR presence by section and region", () => {
    const branches = workbook.branches.map((branch) => {
      if (branch.sectionName === "Summit Section") {
        return { ...branch, emails: { ...branch.emails, sectionSac: "", sectionStudentRep: "" } };
      }
      if (branch.sectionName === "Oasis Section") {
        return { ...branch, emails: { ...branch.emails, sectionStudentRep: "" } };
      }
      return branch;
    });
    const evaluations = evaluateAll(branches, workbook.cycles, false);
    const regions = sortSummary(summaryRows(evaluations, "region", false), { key: "name", direction: "asc" });
    expect(regions.map((row) => [row.name, row.sectionsWithSac, row.sectionsWithSsr, row.sections])).toEqual([
      ["Region 7", 1, 1, 1],
      ["Region 8", 2, 1, 2],
      ["Region 10", 1, 1, 2],
    ]);
    expect(summaryTotals(regions)).toMatchObject({
      sections: 5,
      sectionsWithSac: 4,
      sectionsWithSsr: 3,
    });

    const sections = sortSummary(summaryRows(evaluations, "section", false), { key: "sac", direction: "asc" });
    expect(sections[0]).toMatchObject({
      name: "Summit Section",
      hasSacChair: false,
      hasSsr: false,
    });
    const bySsr = sortSummary(summaryRows(evaluations, "section", false), { key: "ssr", direction: "asc" });
    expect(bySsr.slice(0, 2).map((row) => row.name)).toEqual(["Oasis Section", "Summit Section"]);

    const bySections = sortSummary(summaryRows(evaluations, "region", false), {
      key: "sections",
      direction: "asc",
    });
    expect(bySections[0].name).toBe("Region 7");
    const byWithOfficers = sortSummary(summaryRows(evaluations, "region", false), {
      key: "with-officers",
      direction: "desc",
    });
    expect(byWithOfficers.map((row) => [row.name, row.withOfficers])).toEqual([
      ["Region 10", 5],
      ["Region 8", 3],
      ["Region 7", 2],
    ]);
  });

  it("totals listed student branches while keeping all-blank columns as null", () => {
    const evaluations = evaluateAll(workbook.branches, workbook.cycles, false);
    const rows = branchRows(evaluations, workbook.cycles, false);
    expect(rows[0].cycles.map((cycle) => [cycle.rebateYear, cycle.membersLabel, cycle.officersAvailable])).toEqual([
      [2027, "Members now", true],
      [2026, "Dec 2025 members", false],
      [2025, "Dec 2024 members", false],
    ]);
    expect(branchTotals(rows)).toMatchObject({
      branches: 11,
      currentMembers: 251,
      unreported: 10,
      withOfficers: 10,
      withCounselor: 8,
      immediate: 1,
      expected: 710,
      foregone: 362,
      cycles: [
        { rebateYear: 2027, members: 251, events: 35, unreported: 10, planYes: 6, standingGood: 5, total: 11 },
        { rebateYear: 2026, members: 222, events: 44, planYes: 9, standingGood: 8, total: 11 },
        { rebateYear: 2025, members: 230, events: 43, planYes: 8, standingGood: 8, total: 11 },
      ],
      standings: [
        { good: 5, total: 11 },
        { good: 8, total: 11 },
        { good: 8, total: 11 },
      ],
    });

    const westmillOnly = filterBranches(rows, "Westmill");
    const westmillTotals = branchTotals(westmillOnly);
    expect(westmillTotals.branches).toBe(1);
    expect(westmillTotals.unreported).toBeNull();
    expect(westmillTotals.events.find((item) => item.label === "2026")?.value).toBeNull();
    expect(westmillTotals.expected).toBeNull();
    expect(westmillTotals.foregone).toBeNull();
  });

  it("collects related officer emails for region and section views and deduplicates comma-separated copies", () => {
    expect(collectOfficerContacts(workbook.branches, "mga")).toBeNull();

    const harborBranches = workbook.branches.filter((branch) => branch.sectionSlug === "harbor-section");
    const sectionContacts = collectOfficerContacts(harborBranches, "section");
    expect(sectionContacts).toEqual({
      heading: "Section officers",
      roles: [
        { key: "sectionChair", label: "Section Chair", emails: ["section.chair.harbor@example.com"] },
        { key: "sectionSac", label: "Section SAC", emails: ["section.sac.harbor@example.com"] },
        { key: "sectionStudentRep", label: "Section Student Rep", emails: ["section.rep.harbor@example.com"] },
      ],
      allEmails: [
        "section.chair.harbor@example.com",
        "section.sac.harbor@example.com",
        "section.rep.harbor@example.com",
      ],
      commaSeparated:
        "section.chair.harbor@example.com, section.sac.harbor@example.com, section.rep.harbor@example.com",
    });

    const r10Branches = workbook.branches.filter((branch) => branch.regionCode === "R10");
    const regionContacts = collectOfficerContacts(r10Branches, "region");
    expect(regionContacts).toEqual({
      heading: "Region officers",
      roles: [
        { key: "rsac", label: "RSAC", emails: ["rsac.r10@example.com"] },
        { key: "regionStudentRep", label: "Region Student Rep", emails: ["region.rep.r10@example.com"] },
      ],
      allEmails: ["rsac.r10@example.com", "region.rep.r10@example.com"],
      commaSeparated: "rsac.r10@example.com, region.rep.r10@example.com",
    });

    const withAdditionals = r10Branches.map((branch, index) => ({
      ...branch,
      emails: {
        ...branch.emails,
        rsac: index === 0 ? "RSAC.R10@example.com" : branch.emails.rsac,
        additionalRsac: index === 1 ? "co.rsac@example.com; RSAC.R10@example.com" : "",
        additionalRegionStudentRep: index === 2 ? "add.rsr@example.com" : "",
      },
    }));
    const additionalContacts = collectOfficerContacts(withAdditionals, "region");
    expect(additionalContacts).toEqual({
      heading: "Region officers",
      roles: [
        { key: "rsac", label: "RSAC", emails: ["RSAC.R10@example.com"] },
        { key: "regionStudentRep", label: "Region Student Rep", emails: ["region.rep.r10@example.com"] },
        {
          key: "additionalRsac",
          label: "Additional RSAC",
          emails: ["co.rsac@example.com", "RSAC.R10@example.com"],
        },
        {
          key: "additionalRegionStudentRep",
          label: "Additional Region Student Rep",
          emails: ["add.rsr@example.com"],
        },
      ],
      allEmails: [
        "RSAC.R10@example.com",
        "region.rep.r10@example.com",
        "co.rsac@example.com",
        "add.rsr@example.com",
      ],
      commaSeparated:
        "RSAC.R10@example.com, region.rep.r10@example.com, co.rsac@example.com, add.rsr@example.com",
    });
  });
});

function summaryRow(name: string, overrides: Partial<SummaryRow> = {}): SummaryRow {
  return {
    id: name,
    name,
    regionLabel: name,
    href: "/",
    branches: 10,
    members: 100,
    reportedEvents: 20,
    withOfficers: 10,
    withCounselor: 10,
    missingOfficers: 0,
    missingCounselor: 0,
    sections: 1,
    sectionsWithSac: 1,
    sectionsWithSsr: 1,
    hasSacChair: true,
    hasSsr: true,
    standings: [{ label: "2026", good: 5, total: 10, planRequired: true }],
    foregone: 0,
    immediate: 0,
    attention: 0,
    ...overrides,
  };
}
