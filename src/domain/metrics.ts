import {
  REGION_CONTACT_ROLES,
  REQUIRED_OFFICERS,
  SECTION_CONTACT_ROLES,
} from "../config/defaults";
import { cycleMembers } from "./cycles";
import { assessDissolution, dissolutionInputs } from "./dissolution";
import {
  branchCycleHeading,
  cycleHeading,
  dissolutionLabel,
  formatNumber,
  formatUsd,
  standingLabel,
} from "./format";
import { sectionPath, slugify } from "./regions";
import { sbAllowance, sectionStudentPortion, splitRebate } from "./rebate";
import { assessOfficers, evaluateStanding, requirementGap } from "./standing";
import type {
  ActItem,
  Branch,
  BranchChange,
  BranchEvaluation,
  BranchRow,
  ChartPoint,
  Cycle,
  CycleGapSummary,
  CycleRebateKpi,
  Cycles,
  DissolutionTier,
  Gap,
  GapCounts,
  Kpis,
  MemberChange,
  OfficerContactRole,
  OfficerContactSummary,
  PlanValue,
  ScopeLevel,
  SortState,
  Standing,
  StandingCounts,
  SummaryRow,
} from "./types";

const RISK_RANK: Record<DissolutionTier, number> = {
  "dissolution-activity-test": 0,
  immediate: 1,
  "streak-incomplete": 2,
  "two-year-warning": 3,
  "one-year-watch": 4,
  unknown: 5,
  "on-track": 6,
};

const WATCHLIST = new Set<DissolutionTier>([
  "dissolution-activity-test",
  "immediate",
  "streak-incomplete",
  "two-year-warning",
  "one-year-watch",
]);

export const DEFAULT_SUMMARY_SORT: SortState = { key: "attention", direction: "desc" };
export const REGION_TABLE_SORT: SortState = { key: "name", direction: "asc" };
export const DEFAULT_BRANCH_SORT: SortState = { key: "risk", direction: "asc" };

export function defaultSummarySort(level: ScopeLevel | null | undefined): SortState {
  return level === "mga" ? REGION_TABLE_SORT : DEFAULT_SUMMARY_SORT;
}

export function anchorFor(branch: Branch): string {
  const id = branch.spoid || slugify(branch.schoolName);
  return `branch-${id.toLowerCase()}`;
}

export function evaluateBranch(
  branch: Branch,
  cycles: Cycles,
  ignoreOpenCyclePlan: boolean,
): BranchEvaluation {
  const officers = assessOfficers(branch.emails);
  const ordered = [cycles.open, ...cycles.completed];
  const results = ordered.map((cycle) => {
    const planRequired = cycle.kind === "complete" || !ignoreOpenCyclePlan;
    const officersRequired = cycle.kind === "open";
    const members = cycleMembers(branch, cycle);
    const events = branch.eventsByYear[cycle.eventYear] ?? null;
    const plan = branch.plansByYear[cycle.planYear] ?? "blank";

    const isEstablished = cycle.kind === "open" || members != null;
    if (!isEstablished) {
      const standing: Standing = "not-established";
      const gap: Gap = "not-established";
      return {
        cycle,
        members: null,
        events: null,
        plan: "blank" as PlanValue,
        standing,
        gap,
        allowance: null,
        expectedRebate: null,
        foregoneRebate: null,
      };
    }

    const standing = evaluateStanding({
      members,
      events,
      plan,
      planRequired,
      hasReportedOfficers: officers.hasReportedOfficers,
      officersCount: officers.officerCount,
      officersRequired,
    });
    const gap = requirementGap({
      members,
      events,
      plan,
      planRequired,
      hasReportedOfficers: officers.hasReportedOfficers,
      officersCount: officers.officerCount,
      officersRequired,
    });
    const allowance = sbAllowance(members);
    const split = splitRebate(allowance, standing);
    return { cycle, members, events, plan, standing, gap, allowance, ...split };
  });
  const open = results[0];
  const activity = dissolutionInputs(branch, cycles);
  return {
    branch,
    cycles: results,
    open,
    officerCount: officers.officerCount,
    hasAllOfficers: officers.hasAllOfficers,
    missingOfficers: officers.missingOfficers,
    hasCounselor: officers.hasCounselor,
    hasChair: officers.hasChair,
    hasReportedOfficers: officers.hasReportedOfficers,
    hasCoreLeadership: officers.hasCoreLeadership,
    gap: open.gap,
    dissolution: assessDissolution(activity.complete, activity.inProgress),
    sectionPortion: sectionStudentPortion(cycleMembers(branch, cycles.open)),
  };
}

export function evaluateAll(
  branches: Branch[],
  cycles: Cycles,
  ignoreOpenCyclePlan: boolean,
): BranchEvaluation[] {
  return branches.map((branch) => evaluateBranch(branch, cycles, ignoreOpenCyclePlan));
}

function emptyCounts(): StandingCounts {
  return { good: 0, needsSupport: 0, inactive: 0, incomplete: 0, notEstablished: 0 };
}

export function countStanding(values: Standing[]): StandingCounts {
  const counts = emptyCounts();
  for (const standing of values) {
    if (standing === "good") counts.good += 1;
    else if (standing === "needs-support") counts.needsSupport += 1;
    else if (standing === "inactive") counts.inactive += 1;
    else if (standing === "incomplete") counts.incomplete += 1;
    else if (standing === "not-established") counts.notEstablished = (counts.notEstablished ?? 0) + 1;
  }
  return counts;
}

function rate(counts: StandingCounts, total: number): number | null {
  if (total === 0) return null;
  return counts.good / total;
}

function sumKnown(values: (number | null)[]): { sum: number; missing: number } {
  let sum = 0;
  let missing = 0;
  for (const value of values) {
    if (value == null) missing += 1;
    else sum += value;
  }
  return { sum, missing };
}

export function memberComparison(evaluations: BranchEvaluation[], cycles: Cycles): MemberChange | null {
  const open = cycles.open;
  const memberSource = open.members;
  const previousYear =
    memberSource.source === "current"
      ? cycles.snapshotYears.at(-1) ?? null
      : [...cycles.snapshotYears].reverse().find((year) => year < memberSource.year) ?? null;
  if (previousYear == null) return null;

  const current = sumKnown(evaluations.map((evaluation) => cycleMembers(evaluation.branch, open)));
  const previous = sumKnown(
    evaluations.map((evaluation) => evaluation.branch.membersByYear[previousYear] ?? null),
  );
  if (current.missing === evaluations.length || previous.missing === evaluations.length) return null;
  const diff = current.sum - previous.sum;
  return {
    current: current.sum,
    previous: previous.sum,
    previousLabel: `31 Dec ${previousYear}`,
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
    percent: previous.sum === 0 ? null : diff / previous.sum,
  };
}

export function branchComparison(evaluations: BranchEvaluation[], cycles: Cycles): BranchChange | null {
  const open = cycles.open;
  const memberSource = open.members;
  const previousYear =
    memberSource.source === "current"
      ? cycles.snapshotYears.at(-1) ?? null
      : [...cycles.snapshotYears].reverse().find((year) => year < memberSource.year) ?? null;
  if (previousYear == null) return null;

  const current = evaluations.length;
  const previous = evaluations.filter(
    (item) => item.branch.membersByYear[previousYear] != null,
  ).length;
  const diff = current - previous;

  const historyParts = cycles.snapshotYears.map((year) => {
    const count = evaluations.filter((item) => item.branch.membersByYear[year] != null).length;
    return `${formatNumber(count)} at Dec ${year}`;
  });
  const historyText = `Active units: ${formatNumber(current)} today · ${[...historyParts].reverse().join(" · ")} based on member snapshots.`;

  return {
    current,
    previous,
    previousLabel: `31 Dec ${previousYear}`,
    difference: diff,
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
    percent: previous === 0 ? null : diff / previous,
    historyText,
  };
}

export function buildKpis(evaluations: BranchEvaluation[], cycles: Cycles): Kpis {
  const memberValues = evaluations.map((item) => item.open.members);
  const members = sumKnown(memberValues);
  const events = sumKnown(evaluations.map((item) => item.open.events));
  const goodStanding = countStanding(evaluations.map((item) => item.open.standing));
  let expectedRebate = 0;
  let foregoneRebate = 0;
  let unknownRebateBranches = 0;
  let sectionStudentPortionTotal = 0;
  let sectionPortionMissing = 0;

  for (const evaluation of evaluations) {
    if (evaluation.open.expectedRebate == null || evaluation.open.foregoneRebate == null) {
      unknownRebateBranches += 1;
    } else {
      expectedRebate += evaluation.open.expectedRebate;
      foregoneRebate += evaluation.open.foregoneRebate;
    }
    if (evaluation.sectionPortion == null) sectionPortionMissing += 1;
    else sectionStudentPortionTotal += evaluation.sectionPortion;
  }

  const hasUnreported = cycles.unreportedYears.includes(cycles.open.eventYear);
  const unreported = hasUnreported
    ? sumKnown(
      evaluations.map((item) => item.branch.unreportedByYear[cycles.open.eventYear] ?? null),
    )
    : null;

  const allCycles = [cycles.open, ...cycles.completed];
  const cycleRebates: CycleRebateKpi[] = allCycles.map((cycle, idx) => {
    let cycleExpected = 0;
    let cycleForegone = 0;
    let cycleUnknown = 0;
    let cycleSectionPortion = 0;
    let cycleSectionPortionMissing = 0;
    let qualifiedBranches = 0;
    let unqualifiedBranches = 0;
    let activeBranches = 0;
    let memberSum = 0;

    for (const evaluation of evaluations) {
      const cycleResult = evaluation.cycles[idx];
      if (!cycleResult) continue;

      const isNotEstablished = cycleResult.standing === "not-established";
      if (!isNotEstablished) {
        activeBranches += 1;
      }

      if (cycleResult.members != null) {
        memberSum += cycleResult.members;
        cycleSectionPortion += cycleResult.members * 3;
      } else {
        cycleSectionPortionMissing += 1;
      }

      if (cycleResult.standing === "good") {
        qualifiedBranches += 1;
      } else if (cycleResult.standing === "needs-support" || cycleResult.standing === "inactive") {
        unqualifiedBranches += 1;
      }

      if (isNotEstablished) {
        continue;
      }

      if (cycleResult.expectedRebate == null || cycleResult.foregoneRebate == null) {
        cycleUnknown += 1;
      } else {
        cycleExpected += cycleResult.expectedRebate;
        cycleForegone += cycleResult.foregoneRebate;
      }
    }

    return {
      rebateYear: cycle.rebateYear,
      kind: cycle.kind,
      eventYear: cycle.eventYear,
      membersLabel: cycleMembersLabel(cycle),
      expectedRebate: cycleExpected,
      foregoneRebate: cycleForegone,
      unknownRebateBranches: cycleUnknown,
      sectionStudentPortion: cycleSectionPortion,
      sectionPortionMissing: cycleSectionPortionMissing,
      qualifiedBranches,
      unqualifiedBranches,
      activeBranches,
      totalBranches: evaluations.length,
      members: memberSum,
      officersEvaluated: cycle.kind === "open",
    };
  });

  return {
    branchCount: evaluations.length,
    branchChange: branchComparison(evaluations, cycles),
    branchesWithoutAllOfficers: evaluations.filter((item) => !item.hasAllOfficers).length,
    branchesWithoutReportedOfficers: evaluations.filter((item) => !item.hasReportedOfficers).length,
    branchesWithoutCounselor: evaluations.filter((item) => !item.hasCounselor).length,
    branchesWithoutChair: evaluations.filter((item) => !item.hasChair).length,
    members: members.sum,
    membersMissing: members.missing,
    memberChange: memberComparison(evaluations, cycles),
    reportedEvents: events.sum,
    reportedEventsMissing: events.missing,
    eventsYear: cycles.open.eventYear,
    eventsYearToDate: cycles.open.eventsAreYearToDate,
    unreportedEvents: unreported ? unreported.sum : null,
    unreportedMissing: unreported ? unreported.missing : 0,
    goodStanding,
    goodStandingRate: rate(goodStanding, evaluations.length),
    previousRates: cycles.completed.map((cycle, index) => {
      const standings = evaluations.map((item) => item.cycles[index + 1].standing);
      const counts = countStanding(standings);
      const activeBranches = evaluations.filter(
        (item) => item.branch.membersByYear[cycle.eventYear] != null,
      ).length;
      return {
        rebateYear: cycle.rebateYear,
        rate: rate(counts, activeBranches),
        counts,
        activeBranches,
        totalBranches: evaluations.length,
      };
    }),
    expectedRebate,
    foregoneRebate,
    unknownRebateBranches,
    sectionStudentPortion: sectionStudentPortionTotal,
    sectionPortionMissing,
    openRebateYear: cycles.open.rebateYear,
    cycleRebates,
  };
}

function chartPoint(label: string, values: (number | null)[], yearToDate = false): ChartPoint {
  const summed = sumKnown(values);
  return { label, sum: summed.sum, missing: summed.missing, yearToDate };
}

export function memberChart(evaluations: BranchEvaluation[], cycles: Cycles): ChartPoint[] {
  const points = cycles.snapshotYears.map((year) =>
    chartPoint(
      `Dec ${year}`,
      evaluations.map((item) => item.branch.membersByYear[year] ?? null),
    ),
  );
  if (cycles.open.members.source === "current") {
    points.push(chartPoint("Current", evaluations.map((item) => item.branch.currentMembers)));
  }
  return points;
}

export function eventChart(evaluations: BranchEvaluation[], cycles: Cycles): ChartPoint[] {
  return cycles.eventsYears.map((year) => {
    const yearToDate = cycles.open.eventsAreYearToDate && year === cycles.open.eventYear;
    return chartPoint(
      yearToDate ? `${year} YTD` : String(year),
      evaluations.map((item) => item.branch.eventsByYear[year] ?? null),
      yearToDate,
    );
  });
}

export function countCycleGaps(
  evaluations: BranchEvaluation[],
  cycleIndex: number,
): GapCounts {
  const counts: GapCounts = {
    onlyMembers: 0,
    onlyEvents: 0,
    onlyOfficers: 0,
    onlyPlan: 0,
    missingTwo: 0,
    missingThree: 0,
    missingFour: 0,
    multiple: 0,
    incomplete: 0,
    good: 0,
  };
  for (const evaluation of evaluations) {
    const cycleResult = evaluation.cycles[cycleIndex];
    if (!cycleResult) continue;
    const gap = cycleResult.gap;
    if (gap === "only-members") counts.onlyMembers += 1;
    else if (gap === "only-events") counts.onlyEvents += 1;
    else if (gap === "only-officers") counts.onlyOfficers += 1;
    else if (gap === "only-plan") counts.onlyPlan += 1;
    else if (gap === "two-requirements") {
      counts.missingTwo += 1;
      counts.multiple += 1;
    } else if (gap === "three-requirements") {
      counts.missingThree += 1;
      counts.multiple += 1;
    } else if (gap === "four-requirements") {
      counts.missingFour += 1;
      counts.multiple += 1;
    } else if (gap === "multiple") {
      counts.multiple += 1;
    } else if (gap === "incomplete") {
      counts.incomplete += 1;
    } else if (gap === "not-established") {
      counts.notEstablished = (counts.notEstablished ?? 0) + 1;
    } else if (gap === "good") {
      counts.good += 1;
    }
  }
  return counts;
}

export function countGaps(evaluations: BranchEvaluation[]): GapCounts {
  return countCycleGaps(evaluations, 0);
}

export function allCycleGaps(
  evaluations: BranchEvaluation[],
  cycles: Cycles,
  ignoreOpenPlan: boolean,
): CycleGapSummary[] {
  const ordered = [cycles.open, ...cycles.completed];
  return ordered.map((cycle, index) => ({
    cycle,
    gaps: countCycleGaps(evaluations, index),
    planExcluded: cycle.kind === "open" && ignoreOpenPlan,
    officersEvaluated: cycle.kind === "open",
  }));
}

export function countTiers(evaluations: BranchEvaluation[]): Record<DissolutionTier, number> {
  const counts: Record<DissolutionTier, number> = {
    "dissolution-activity-test": 0,
    immediate: 0,
    "two-year-warning": 0,
    "streak-incomplete": 0,
    "one-year-watch": 0,
    "on-track": 0,
    unknown: 0,
  };
  for (const evaluation of evaluations) counts[evaluation.dissolution.tier] += 1;
  return counts;
}

export function urgentBranches(evaluations: BranchEvaluation[]): BranchEvaluation[] {
  return evaluations
    .filter((item) => WATCHLIST.has(item.dissolution.tier))
    .sort((left, right) => {
      const byTier = RISK_RANK[left.dissolution.tier] - RISK_RANK[right.dissolution.tier];
      if (byTier !== 0) return byTier;
      return (right.open.foregoneRebate ?? -1) - (left.open.foregoneRebate ?? -1);
    });
}

function isImmediate(tier: DissolutionTier): boolean {
  return tier === "immediate" || tier === "dissolution-activity-test";
}

function needsAttention(standing: Standing): boolean {
  return standing === "needs-support" || standing === "inactive";
}

export function summaryRows(
  evaluations: BranchEvaluation[],
  kind: "region" | "section",
  ignoreOpenPlan: boolean,
): SummaryRow[] {
  const groups = new Map<string, BranchEvaluation[]>();
  for (const evaluation of evaluations) {
    const key =
      kind === "region"
        ? evaluation.branch.regionCode
        : `${evaluation.branch.regionCode}/${evaluation.branch.sectionSlug}`;
    const current = groups.get(key) ?? [];
    current.push(evaluation);
    groups.set(key, current);
  }

  return [...groups.entries()].map(([id, items]) => {
    const first = items[0].branch;
    const members = sumKnown(items.map((item) => item.open.members));
    const events = sumKnown(items.map((item) => item.open.events));
    let foregone = 0;
    for (const item of items) {
      if (item.open.foregoneRebate != null) foregone += item.open.foregoneRebate;
    }
    const sectionGroups = new Map<string, BranchEvaluation[]>();
    for (const item of items) {
      const sectionKey = `${item.branch.regionCode}/${item.branch.sectionSlug}`;
      const list = sectionGroups.get(sectionKey) ?? [];
      list.push(item);
      sectionGroups.set(sectionKey, list);
    }
    let sectionsWithSac = 0;
    let sectionsWithSsr = 0;
    for (const sectionItems of sectionGroups.values()) {
      if (sectionItems.some((item) => item.branch.emails.sectionSac.trim().length > 0)) {
        sectionsWithSac += 1;
      }
      if (sectionItems.some((item) => item.branch.emails.sectionStudentRep.trim().length > 0)) {
        sectionsWithSsr += 1;
      }
    }
    return {
      id,
      name: kind === "region" ? first.regionLabel : first.sectionName,
      regionLabel: first.regionLabel,
      href:
        kind === "region"
          ? `/${first.regionCode.toLowerCase()}`
          : sectionPath(first.regionCode, first.sectionSlug),
      branches: items.length,
      members: members.sum,
      reportedEvents: events.sum,
      withOfficers: items.filter((item) => item.hasReportedOfficers).length,
      withCounselor: items.filter((item) => item.hasCounselor).length,
      missingOfficers: items.filter((item) => !item.hasReportedOfficers).length,
      missingCounselor: items.filter((item) => !item.hasCounselor).length,
      sections: sectionGroups.size,
      sectionsWithSac,
      sectionsWithSsr,
      hasSacChair: sectionsWithSac > 0,
      hasSsr: sectionsWithSsr > 0,
      standings: items[0].cycles.map((cycleResult) => {
        const cycleStandings = items.map((item) => {
          const match = item.cycles.find(
            (candidate) => candidate.cycle.rebateYear === cycleResult.cycle.rebateYear,
          );
          return match?.standing ?? "incomplete";
        });
        const counts = countStanding(cycleStandings);
        const activeBranches =
          cycleResult.cycle.kind === "open"
            ? items.length
            : items.filter(
                (item) => item.branch.membersByYear[cycleResult.cycle.eventYear] != null,
              ).length;
        return {
          label: cycleHeading(cycleResult.cycle, ignoreOpenPlan),
          planRequired: cycleResult.cycle.kind === "complete" || !ignoreOpenPlan,
          officersRequired: cycleResult.cycle.kind === "open",
          good: counts.good,
          total: activeBranches,
          allBranches: items.length,
        };
      }),
      foregone,
      immediate: items.filter((item) => isImmediate(item.dissolution.tier)).length,
      attention: items.filter((item) => needsAttention(item.open.standing)).length,
      searchText: `${kind === "region" ? first.regionLabel : first.sectionName} ${first.regionLabel}`.toLowerCase(),
    };
  });
}

function rebateText(evaluation: BranchEvaluation): string {
  if (evaluation.open.expectedRebate == null || evaluation.open.foregoneRebate == null) return "Unknown";
  if (evaluation.open.foregoneRebate > 0) return `At risk ${formatUsd(evaluation.open.foregoneRebate)}`;
  return `Projected ${formatUsd(evaluation.open.expectedRebate)}`;
}

function cycleMembersLabel(cycle: Cycle): string {
  return cycle.members.source === "current"
    ? "Members now"
    : `Dec ${cycle.members.year} members`;
}

export function branchRows(
  evaluations: BranchEvaluation[],
  cycles: Cycles,
  ignoreOpenPlan: boolean,
): BranchRow[] {
  return evaluations.map((evaluation) => {
    const branch = evaluation.branch;
    const unreported = cycles.unreportedYears.includes(cycles.open.eventYear)
      ? (branch.unreportedByYear[cycles.open.eventYear] ?? null)
      : null;
    return {
      id: `${branch.regionCode}/${branch.sectionSlug}/${branch.spoid}/${branch.schoolName}`,
      anchor: anchorFor(branch),
      schoolName: branch.schoolName,
      regionCode: branch.regionCode,
      regionLabel: branch.regionLabel,
      sectionName: branch.sectionName,
      sectionSlug: branch.sectionSlug,
      sectionHref: sectionPath(branch.regionCode, branch.sectionSlug),
      spoid: branch.spoid,
      sourceStatus: branch.sourceStatus || "—",
      currentMembers: branch.currentMembers,
      snapshots: cycles.snapshotYears.map((year) => ({
        label: `Dec ${year}`,
        value: branch.membersByYear[year] ?? null,
      })),
      events: cycles.eventsYears.map((year) => ({
        label: String(year),
        value: branch.eventsByYear[year] ?? null,
      })),
      unreported,
      plans: [cycles.open, ...cycles.completed].map((cycle) => ({
        label: String(cycle.planYear),
        value: branch.plansByYear[cycle.planYear] ?? "blank",
      })),
      cycles: evaluation.cycles.map((result) => {
        const isOpen = result.cycle.kind === "open";
        return {
          rebateYear: result.cycle.rebateYear,
          kind: result.cycle.kind,
          membersLabel: cycleMembersLabel(result.cycle),
          members: result.members,
          eventYear: result.cycle.eventYear,
          eventsLabel: `${result.cycle.eventYear} events`,
          events: result.events,
          showUnreported: isOpen,
          unreported: isOpen ? unreported : null,
          planYear: result.cycle.planYear,
          planLabel: `${result.cycle.planYear} plan`,
          plan: result.plan,
          officersAvailable: isOpen,
          standingLabel: branchCycleHeading(result.cycle, ignoreOpenPlan),
          standing: result.standing,
          planRequired: result.cycle.kind === "complete" || !ignoreOpenPlan,
          officersRequired: isOpen,
        };
      }),
      officerCount: evaluation.officerCount,
      officerTotal: REQUIRED_OFFICERS,
      missingOfficers: evaluation.missingOfficers,
      hasCounselor: evaluation.hasCounselor,
      hasChair: evaluation.hasChair,
      hasReportedOfficers: evaluation.hasReportedOfficers,
      hasCoreLeadership: evaluation.hasCoreLeadership,
      standings: evaluation.cycles.map((result) => ({
        label: cycleHeading(result.cycle, ignoreOpenPlan),
        planRequired: result.cycle.kind === "complete" || !ignoreOpenPlan,
        officersRequired: result.cycle.kind === "open",
        value: result.standing,
      })),
      dissolution: evaluation.dissolution.tier,
      dissolutionLabel: dissolutionLabel(evaluation.dissolution.tier),
      dissolutionDetail: evaluation.dissolution.detail,
      rebateText: rebateText(evaluation),
      expected: evaluation.open.expectedRebate,
      foregone: evaluation.open.foregoneRebate,
      riskRank: RISK_RANK[evaluation.dissolution.tier],
      attention: needsAttention(evaluation.open.standing) ? 1 : 0,
      searchText: `${branch.schoolName} ${branch.spoid} ${branch.sectionName} ${branch.regionLabel} ${branch.regionCode}`.toLowerCase(),
    };
  });
}

export function whereToAct(evaluations: BranchEvaluation[], level: ScopeLevel): ActItem[] {
  if (level === "section") {
    return evaluations
      .filter((item) => (item.open.foregoneRebate ?? 0) > 0)
      .map((item) => ({
        id: item.branch.spoid || item.branch.schoolName,
        title: item.branch.schoolName,
        subtitle:
          item.dissolution.tier === "on-track" || item.dissolution.tier === "unknown"
            ? standingLabel(item.open.standing)
            : dissolutionLabel(item.dissolution.tier),
        href: `#${anchorFor(item.branch)}`,
        foregone: item.open.foregoneRebate ?? 0,
        attention: needsAttention(item.open.standing) ? 1 : 0,
      }))
      .sort((left, right) => right.foregone - left.foregone || compareText(left.title, right.title));
  }

  const groups = new Map<string, ActItem>();
  for (const evaluation of evaluations) {
    const branch = evaluation.branch;
    const key = `${branch.regionCode}/${branch.sectionSlug}`;
    const current = groups.get(key) ?? {
      id: key,
      title: branch.sectionName,
      subtitle: branch.regionLabel,
      href: sectionPath(branch.regionCode, branch.sectionSlug),
      foregone: 0,
      attention: 0,
    };
    current.foregone += evaluation.open.foregoneRebate ?? 0;
    if (needsAttention(evaluation.open.standing)) current.attention += 1;
    groups.set(key, current);
  }

  return [...groups.values()]
    .filter((item) => item.foregone > 0)
    .sort((left, right) => right.foregone - left.foregone || compareText(left.title, right.title));
}

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function compareText(left: string, right: string): number {
  return collator.compare(left, right);
}

function compareNullable(left: number | null, right: number | null, direction: SortState["direction"]): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  const diff = left - right;
  return direction === "asc" ? diff : -diff;
}

export function sortSummary(rows: SummaryRow[], sort: SortState): SummaryRow[] {
  return [...rows].sort((left, right) => {
    const primary = compareSummary(left, right, sort);
    if (primary !== 0) return primary;
    return compareText(left.name, right.name);
  });
}

function standingGood(row: SummaryRow, index: number): number | null {
  return row.standings[index]?.good ?? null;
}

function standingRate(row: SummaryRow, index: number): number | null {
  const item = row.standings[index];
  if (!item || item.total === 0) return null;
  return item.good / item.total;
}

export interface SummaryTotals {
  branches: number;
  members: number;
  reportedEvents: number;
  withOfficers: number;
  withCounselor: number;
  missingOfficers: number;
  missingCounselor: number;
  sections: number;
  sectionsWithSac: number;
  sectionsWithSsr: number;
  standings: { good: number; total: number }[];
  foregone: number;
  immediate: number;
}

export function summaryTotals(rows: SummaryRow[]): SummaryTotals {
  const standings: { good: number; total: number }[] = [];
  const totals: SummaryTotals = {
    branches: 0,
    members: 0,
    reportedEvents: 0,
    withOfficers: 0,
    withCounselor: 0,
    missingOfficers: 0,
    missingCounselor: 0,
    sections: 0,
    sectionsWithSac: 0,
    sectionsWithSsr: 0,
    standings,
    foregone: 0,
    immediate: 0,
  };
  for (const row of rows) {
    totals.branches += row.branches;
    totals.members += row.members;
    totals.reportedEvents += row.reportedEvents;
    totals.withOfficers += row.withOfficers;
    totals.withCounselor += row.withCounselor;
    totals.missingOfficers += row.missingOfficers;
    totals.missingCounselor += row.missingCounselor;
    totals.sections += row.sections;
    totals.sectionsWithSac += row.sectionsWithSac;
    totals.sectionsWithSsr += row.sectionsWithSsr;
    totals.foregone += row.foregone;
    totals.immediate += row.immediate;
    row.standings.forEach((item, index) => {
      const current = standings[index] ?? { good: 0, total: 0 };
      current.good += item.good;
      current.total += item.total;
      standings[index] = current;
    });
  }
  return totals;
}

export interface BranchCycleTotals {
  rebateYear: number;
  kind: "open" | "complete";
  membersLabel: string;
  members: number | null;
  eventsLabel: string;
  events: number | null;
  showUnreported: boolean;
  unreported: number | null;
  planLabel: string;
  planYes: number;
  officersAvailable: boolean;
  standingLabel: string;
  standingGood: number;
  total: number;
}

export interface BranchTotals {
  branches: number;
  currentMembers: number | null;
  snapshots: { label: string; value: number | null }[];
  events: { label: string; value: number | null }[];
  unreported: number | null;
  plans: { label: string; yes: number; total: number }[];
  cycles: BranchCycleTotals[];
  withOfficers: number;
  withCounselor: number;
  standings: { label: string; good: number; total: number }[];
  immediate: number;
  expected: number | null;
  foregone: number | null;
}

export function branchTotals(rows: BranchRow[]): BranchTotals {
  const sample = rows[0];
  if (!sample || rows.length === 0) {
    return {
      branches: 0,
      currentMembers: null,
      snapshots: [],
      events: [],
      unreported: null,
      plans: [],
      cycles: [],
      withOfficers: 0,
      withCounselor: 0,
      standings: [],
      immediate: 0,
      expected: null,
      foregone: null,
    };
  }

  const numCycles = sample.cycles.length;
  const numSnapshots = sample.snapshots.length;
  const numEvents = sample.events.length;
  const numPlans = sample.plans.length;
  const numStandings = sample.standings.length;

  let currentMembersSum = 0;
  let currentMembersMissing = 0;
  let unreportedSum = 0;
  let unreportedMissing = 0;
  let withOfficers = 0;
  let withCounselor = 0;
  let immediate = 0;
  let expectedSum = 0;
  let expectedMissing = 0;
  let foregoneSum = 0;
  let foregoneMissing = 0;

  const snapshotSums = new Array<number>(numSnapshots).fill(0);
  const snapshotMissing = new Array<number>(numSnapshots).fill(0);
  const eventSums = new Array<number>(numEvents).fill(0);
  const eventMissing = new Array<number>(numEvents).fill(0);
  const planYes = new Array<number>(numPlans).fill(0);
  const standingGood = new Array<number>(numStandings).fill(0);

  const cycleMembersSum = new Array<number>(numCycles).fill(0);
  const cycleMembersMissing = new Array<number>(numCycles).fill(0);
  const cycleEventsSum = new Array<number>(numCycles).fill(0);
  const cycleEventsMissing = new Array<number>(numCycles).fill(0);
  const cycleUnreportedSum = new Array<number>(numCycles).fill(0);
  const cycleUnreportedMissing = new Array<number>(numCycles).fill(0);
  const cyclePlanYes = new Array<number>(numCycles).fill(0);
  const cycleStandingGood = new Array<number>(numCycles).fill(0);

  const len = rows.length;
  for (let i = 0; i < len; i++) {
    const row = rows[i];
    if (row.currentMembers == null) currentMembersMissing++;
    else currentMembersSum += row.currentMembers;

    if (row.unreported == null) unreportedMissing++;
    else unreportedSum += row.unreported;

    if (row.hasReportedOfficers) withOfficers++;
    if (row.hasCounselor) withCounselor++;
    if (isImmediate(row.dissolution)) immediate++;

    if (row.expected == null) expectedMissing++;
    else expectedSum += row.expected;

    if (row.foregone == null) foregoneMissing++;
    else foregoneSum += row.foregone;

    for (let s = 0; s < numSnapshots; s++) {
      const v = row.snapshots[s]?.value;
      if (v == null) snapshotMissing[s]++;
      else snapshotSums[s] += v;
    }

    for (let e = 0; e < numEvents; e++) {
      const v = row.events[e]?.value;
      if (v == null) eventMissing[e]++;
      else eventSums[e] += v;
    }

    for (let p = 0; p < numPlans; p++) {
      if (row.plans[p]?.value === "yes") planYes[p]++;
    }

    for (let st = 0; st < numStandings; st++) {
      if (row.standings[st]?.value === "good") standingGood[st]++;
    }

    for (let c = 0; c < numCycles; c++) {
      const cycle = row.cycles[c];
      if (!cycle) continue;
      if (cycle.members == null) cycleMembersMissing[c]++;
      else cycleMembersSum[c] += cycle.members;

      if (cycle.events == null) cycleEventsMissing[c]++;
      else cycleEventsSum[c] += cycle.events;

      if (cycle.showUnreported) {
        if (cycle.unreported == null) cycleUnreportedMissing[c]++;
        else cycleUnreportedSum[c] += cycle.unreported;
      }

      if (cycle.plan === "yes") cyclePlanYes[c]++;
      if (cycle.standing === "good") cycleStandingGood[c]++;
    }
  }

  const resolveSum = (sum: number, missing: number) => (missing === len ? null : sum);

  return {
    branches: len,
    currentMembers: resolveSum(currentMembersSum, currentMembersMissing),
    snapshots: sample.snapshots.map((item, idx) => ({
      label: item.label,
      value: resolveSum(snapshotSums[idx], snapshotMissing[idx]),
    })),
    events: sample.events.map((item, idx) => ({
      label: item.label,
      value: resolveSum(eventSums[idx], eventMissing[idx]),
    })),
    unreported: resolveSum(unreportedSum, unreportedMissing),
    plans: sample.plans.map((item, idx) => ({
      label: item.label,
      yes: planYes[idx],
      total: len,
    })),
    cycles: sample.cycles.map((item, idx) => ({
      rebateYear: item.rebateYear,
      kind: item.kind,
      membersLabel: item.membersLabel,
      members: resolveSum(cycleMembersSum[idx], cycleMembersMissing[idx]),
      eventsLabel: item.eventsLabel,
      events: resolveSum(cycleEventsSum[idx], cycleEventsMissing[idx]),
      showUnreported: item.showUnreported,
      unreported: item.showUnreported
        ? resolveSum(cycleUnreportedSum[idx], cycleUnreportedMissing[idx])
        : null,
      planLabel: item.planLabel,
      planYes: cyclePlanYes[idx],
      officersAvailable: item.officersAvailable,
      standingLabel: item.standingLabel,
      standingGood: cycleStandingGood[idx],
      total: len,
    })),
    withOfficers,
    withCounselor,
    standings: sample.standings.map((item, idx) => ({
      label: item.label,
      good: standingGood[idx],
      total: len,
    })),
    immediate,
    expected: resolveSum(expectedSum, expectedMissing),
    foregone: resolveSum(foregoneSum, foregoneMissing),
  };
}

function compareSummary(left: SummaryRow, right: SummaryRow, sort: SortState): number {
  if (sort.key.startsWith("rate-") || sort.key === "vitality" || sort.key === "rate") {
    const index = sort.key.startsWith("rate-") ? Number(sort.key.slice("rate-".length)) : 0;
    return compareNullable(standingRate(left, index), standingRate(right, index), sort.direction);
  }
  if (sort.key.startsWith("standing-") || sort.key === "standing") {
    const index = sort.key.startsWith("standing-") ? Number(sort.key.slice("standing-".length)) : 0;
    return compareNullable(standingGood(left, index), standingGood(right, index), sort.direction);
  }
  switch (sort.key) {
    case "name":
      return sort.direction === "asc" ? compareText(left.name, right.name) : compareText(right.name, left.name);
    case "region":
      return sort.direction === "asc"
        ? compareText(left.regionLabel, right.regionLabel)
        : compareText(right.regionLabel, left.regionLabel);
    case "sections":
      return compareNullable(left.sections, right.sections, sort.direction);
    case "branches":
      return compareNullable(left.branches, right.branches, sort.direction);
    case "members":
      return compareNullable(left.members, right.members, sort.direction);
    case "events":
      return compareNullable(left.reportedEvents, right.reportedEvents, sort.direction);
    case "with-officers":
      return compareNullable(left.withOfficers, right.withOfficers, sort.direction);
    case "with-counselor":
      return compareNullable(left.withCounselor, right.withCounselor, sort.direction);
    case "missing-officers":
      return compareNullable(left.missingOfficers, right.missingOfficers, sort.direction);
    case "missing-counselor":
      return compareNullable(left.missingCounselor, right.missingCounselor, sort.direction);
    case "sac": {
      const byCount = compareNullable(left.sectionsWithSac, right.sectionsWithSac, sort.direction);
      if (byCount !== 0) return byCount;
      return compareNullable(left.sections, right.sections, sort.direction);
    }
    case "ssr": {
      const byCount = compareNullable(left.sectionsWithSsr, right.sectionsWithSsr, sort.direction);
      if (byCount !== 0) return byCount;
      return compareNullable(left.sections, right.sections, sort.direction);
    }
    case "foregone":
      return compareNullable(left.foregone, right.foregone, sort.direction);
    case "immediate":
      return compareNullable(left.immediate, right.immediate, sort.direction);
    case "attention":
      return compareNullable(left.attention, right.attention, sort.direction);
    default:
      return compareNullable(left.attention, right.attention, "desc");
  }
}

const STANDING_RANK: Record<Standing, number> = {
  good: 0,
  "needs-support": 1,
  inactive: 2,
  incomplete: 3,
  "not-established": 4,
};

const PLAN_RANK: Record<PlanValue, number> = {
  yes: 0,
  no: 1,
  blank: 2,
  unrecognized: 3,
};

function compareNonEmptyText(left: string, right: string, direction: SortState["direction"]): number {
  const leftTrim = (left ?? "").trim();
  const rightTrim = (right ?? "").trim();
  if (!leftTrim && !rightTrim) return 0;
  if (!leftTrim) return 1;
  if (!rightTrim) return -1;
  return direction === "asc" ? compareText(leftTrim, rightTrim) : compareText(rightTrim, leftTrim);
}

export function sortBranches(rows: BranchRow[], sort: SortState): BranchRow[] {
  return [...rows].sort((left, right) => {
    const primary = compareBranch(left, right, sort);
    if (primary !== 0) return primary;
    return compareText(left.schoolName, right.schoolName);
  });
}

function compareBranch(left: BranchRow, right: BranchRow, sort: SortState): number {
  if (sort.key === "members" || sort.key.startsWith("members-")) {
    const index = sort.key === "members" ? 0 : Number(sort.key.slice("members-".length));
    const leftVal = left.cycles[index]?.members ?? (index === 0 ? left.currentMembers : null);
    const rightVal = right.cycles[index]?.members ?? (index === 0 ? right.currentMembers : null);
    return compareNullable(leftVal, rightVal, sort.direction);
  }
  if (sort.key === "events" || sort.key.startsWith("events-")) {
    const index = sort.key === "events" ? 0 : Number(sort.key.slice("events-".length));
    const leftVal = left.cycles[index]?.events ?? null;
    const rightVal = right.cycles[index]?.events ?? null;
    return compareNullable(leftVal, rightVal, sort.direction);
  }
  if (sort.key === "unreported" || sort.key.startsWith("unreported-")) {
    const index = sort.key === "unreported" ? 0 : Number(sort.key.slice("unreported-".length));
    const leftVal = left.cycles[index]?.unreported ?? (index === 0 ? left.unreported : null);
    const rightVal = right.cycles[index]?.unreported ?? (index === 0 ? right.unreported : null);
    return compareNullable(leftVal, rightVal, sort.direction);
  }
  if (sort.key === "plan" || sort.key.startsWith("plan-")) {
    const index = sort.key === "plan" ? 0 : Number(sort.key.slice("plan-".length));
    const leftPlan = left.cycles[index]?.plan;
    const rightPlan = right.cycles[index]?.plan;
    const leftRank = leftPlan != null ? PLAN_RANK[leftPlan] ?? 4 : null;
    const rightRank = rightPlan != null ? PLAN_RANK[rightPlan] ?? 4 : null;
    return compareNullable(leftRank, rightRank, sort.direction);
  }
  if (sort.key === "standing" || sort.key.startsWith("standing-")) {
    const index = sort.key === "standing" ? 0 : Number(sort.key.slice("standing-".length));
    const leftStanding = left.cycles[index]?.standing;
    const rightStanding = right.cycles[index]?.standing;
    const leftRank = leftStanding != null ? STANDING_RANK[leftStanding] ?? 5 : null;
    const rightRank = rightStanding != null ? STANDING_RANK[rightStanding] ?? 5 : null;
    return compareNullable(leftRank, rightRank, sort.direction);
  }
  if (sort.key === "officers" || sort.key.startsWith("officers-")) {
    return compareNullable(left.officerCount, right.officerCount, sort.direction);
  }

  switch (sort.key) {
    case "school":
      return sort.direction === "asc"
        ? compareText(left.schoolName, right.schoolName)
        : compareText(right.schoolName, left.schoolName);
    case "region":
      return sort.direction === "asc"
        ? compareText(left.regionLabel, right.regionLabel)
        : compareText(right.regionLabel, left.regionLabel);
    case "section":
      return sort.direction === "asc"
        ? compareText(left.sectionName, right.sectionName)
        : compareText(right.sectionName, left.sectionName);
    case "spoid":
      return compareNonEmptyText(left.spoid, right.spoid, sort.direction);
    case "status":
    case "sheet-status":
      return compareNonEmptyText(left.sourceStatus, right.sourceStatus, sort.direction);
    case "counselor":
      return compareNullable(left.hasCounselor ? 1 : 0, right.hasCounselor ? 1 : 0, sort.direction);
    case "foregone":
      return compareNullable(left.foregone, right.foregone, sort.direction);
    case "risk":
      return compareNullable(left.riskRank, right.riskRank, sort.direction);
    case "attention":
      return compareNullable(left.attention, right.attention, sort.direction);
    default:
      return compareNullable(left.riskRank, right.riskRank, "asc");
  }
}

export function filterSummary(rows: SummaryRow[], query: string): SummaryRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    row.searchText
      ? row.searchText.includes(needle)
      : row.name.toLowerCase().includes(needle) || row.regionLabel.toLowerCase().includes(needle),
  );
}

export function filterBranches(rows: BranchRow[], query: string): BranchRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    row.searchText
      ? row.searchText.includes(needle)
      : row.schoolName.toLowerCase().includes(needle) ||
        row.spoid.toLowerCase().includes(needle) ||
        row.sectionName.toLowerCase().includes(needle) ||
        row.regionLabel.toLowerCase().includes(needle) ||
        row.regionCode.toLowerCase().includes(needle),
  );
}

export interface TableSelection {
  kind: "summary" | "branches" | "region";
  summaryKind: "region" | "section" | null;
  summary: SummaryRow[];
  sections: SummaryRow[];
  branches: BranchRow[];
  emptyMessage: string;
  sectionEmptyMessage: string;
}

export function selectTable(args: {
  evaluations: BranchEvaluation[];
  cycles: Cycles;
  level: ScopeLevel;
  ignoreOpenPlan: boolean;
  query?: string;
  sectionQuery?: string;
  branchQuery?: string;
  summarySort: SortState;
  sectionSort: SortState;
  branchSort: SortState;
  cachedBranchRows?: BranchRow[];
  cachedSectionRows?: SummaryRow[];
  cachedRegionRows?: SummaryRow[];
}): TableSelection {
  const baseBranches =
    args.cachedBranchRows ?? branchRows(args.evaluations, args.cycles, args.ignoreOpenPlan);
  const branchQuery = args.branchQuery ?? args.query ?? "";
  const sectionQuery = args.sectionQuery ?? args.query ?? "";

  if (args.level === "section") {
    const branches = sortBranches(filterBranches(baseBranches, branchQuery), args.branchSort);
    return {
      kind: "branches",
      summaryKind: null,
      summary: [],
      sections: [],
      branches,
      emptyMessage: "No schools match that search.",
      sectionEmptyMessage: "",
    };
  }

  if (args.level === "mga") {
    const baseRegions =
      args.cachedRegionRows ?? summaryRows(args.evaluations, "region", args.ignoreOpenPlan);
    const baseSections =
      args.cachedSectionRows ?? summaryRows(args.evaluations, "section", args.ignoreOpenPlan);
    return {
      kind: "summary",
      summaryKind: "region",
      summary: sortSummary(baseRegions, args.summarySort),
      sections: sortSummary(filterSummary(baseSections, sectionQuery), args.sectionSort),
      branches: sortBranches(filterBranches(baseBranches, branchQuery), args.branchSort),
      emptyMessage: "No regions in this file.",
      sectionEmptyMessage: "No sections match that search.",
    };
  }

  const sectionSort =
    args.sectionSort !== DEFAULT_SUMMARY_SORT ? args.sectionSort : args.summarySort;
  const baseSections =
    args.cachedSectionRows ?? summaryRows(args.evaluations, "section", args.ignoreOpenPlan);
  const sections = sortSummary(baseSections, sectionSort);
  const branches = sortBranches(filterBranches(baseBranches, branchQuery), args.branchSort);
  return {
    kind: "region",
    summaryKind: "section",
    summary: sections,
    sections,
    branches,
    emptyMessage: "No sections in this region.",
    sectionEmptyMessage: "No schools match that search.",
  };
}

export function cycleList(cycles: Cycles): Cycle[] {
  return [cycles.open, ...cycles.completed];
}

function uniqueEmails(rawValues: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of rawValues) {
    for (const part of raw.split(/[,;]+/)) {
      const email = part.trim();
      if (!email) continue;
      const lower = email.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      result.push(email);
    }
  }
  return result;
}

export function collectOfficerContacts(
  branches: Branch[],
  level: ScopeLevel,
): OfficerContactSummary | null {
  if (level === "mga") return null;
  const specs = level === "section" ? SECTION_CONTACT_ROLES : REGION_CONTACT_ROLES;
  const heading = level === "section" ? "Section officers" : "Region officers";
  const roles: OfficerContactRole[] = [];
  for (const spec of specs) {
    const emails = uniqueEmails(branches.map((branch) => branch.emails[spec.key]));
    if (spec.optional && emails.length === 0) continue;
    roles.push({
      key: spec.key,
      label: spec.label,
      emails,
    });
  }
  const allEmails = uniqueEmails(roles.flatMap((role) => role.emails));
  return {
    heading,
    roles,
    allEmails,
    commaSeparated: allEmails.join(", "),
  };
}
