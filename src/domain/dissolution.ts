import { MIN_EVENTS, MIN_MEMBERS } from "../config/defaults";
import { cycleMembers } from "./cycles";
import type { Branch, Cycles, DissolutionAssessment, YearActivity } from "./types";

export function operationalResult(
  members: number | null,
  events: number | null,
): "met" | "failed" | "unknown" {
  if (members == null || events == null) return "unknown";
  if (members >= MIN_MEMBERS && events >= MIN_EVENTS) return "met";
  return "failed";
}

export function dissolutionInputs(
  branch: Branch,
  cycles: Cycles,
): { complete: YearActivity[]; inProgress: YearActivity } {
  const inProgressYear = cycles.open.eventYear;
  const completeYears = cycles.snapshotYears.filter(
    (year) => year !== inProgressYear && cycles.eventsYears.includes(year),
  );

  return {
    complete: completeYears.map((year) => ({
      year,
      members: branch.membersByYear[year] ?? null,
      events: branch.eventsByYear[year] ?? null,
    })),
    inProgress: {
      year: inProgressYear,
      members: cycleMembers(branch, cycles.open),
      events: branch.eventsByYear[inProgressYear] ?? null,
    },
  };
}

function formatYearList(years: number[]): string {
  if (years.length === 0) return "";
  if (years.length === 1) return String(years[0]);
  if (years.length === 2) return `${years[0]} and ${years[1]}`;
  return `${years.slice(0, -1).join(", ")}, and ${years[years.length - 1]}`;
}

export function assessDissolution(
  complete: YearActivity[],
  inProgress: YearActivity,
): DissolutionAssessment {
  const ordered = [...complete].sort((left, right) => left.year - right.year);
  if (ordered.length === 0) {
    return {
      tier: "unknown",
      streak: 0,
      failedYears: [],
      detail: "This file has no completed activity year to judge.",
    };
  }

  const latest = ordered[ordered.length - 1];
  const latestResult = operationalResult(latest.members, latest.events);
  if (latestResult === "unknown") {
    return {
      tier: "unknown",
      streak: 0,
      failedYears: [],
      detail: `${latest.year} membership or meetings are blank, so the streak cannot be judged.`,
    };
  }
  if (latestResult === "met") {
    return {
      tier: "on-track",
      streak: 0,
      failedYears: [],
      detail: `Met the membership and meeting minimums in ${latest.year}.`,
    };
  }

  const failedYears: number[] = [];
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const year = ordered[index];
    if (failedYears.length > 0 && failedYears[failedYears.length - 1] - year.year !== 1) break;
    if (operationalResult(year.members, year.events) !== "failed") break;
    failedYears.push(year.year);
  }
  failedYears.reverse();

  const streak = failedYears.length;
  const progress = operationalResult(inProgress.members, inProgress.events);
  const yearList = formatYearList(failedYears);

  if (streak >= 3) {
    return {
      tier: "dissolution-activity-test",
      streak,
      failedYears,
      detail: `Missed the membership or meeting minimums in ${yearList}. This meets the three-year activity test for automatic dissolution. Notice history is not in this file.`,
    };
  }
  if (streak >= 2 && progress === "failed") {
    return {
      tier: "immediate",
      streak,
      failedYears,
      detail: `Missed the membership or meeting minimums in ${yearList}, and ${inProgress.year} is not on track.`,
    };
  }
  if (streak >= 2 && progress === "met") {
    return {
      tier: "two-year-warning",
      streak,
      failedYears,
      detail: `Missed the membership or meeting minimums in ${yearList}. ${inProgress.year} currently meets both minimums.`,
    };
  }
  if (streak >= 2) {
    return {
      tier: "streak-incomplete",
      streak,
      failedYears,
      detail: `Missed the membership or meeting minimums in ${yearList}. ${inProgress.year} is incomplete, so this year cannot be judged.`,
    };
  }
  return {
    tier: "one-year-watch",
    streak,
    failedYears,
    detail: `Missed the membership or meeting minimums in ${yearList}.`,
  };
}
