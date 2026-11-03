import { CsvFormatError } from "./errors";
import type { Branch, Cycle, Cycles, MemberSource } from "./types";

export interface CycleColumns {
  eventYears: number[];
  memberYears: number[];
  planYears: number[];
  unreportedYears: number[];
}

function uniqueSorted(years: number[]): number[] {
  return [...new Set(years)].sort((left, right) => left - right);
}

export function buildCycles(columns: CycleColumns): Cycles {
  const eventsYears = uniqueSorted(columns.eventYears);
  if (eventsYears.length === 0) {
    throw new CsvFormatError(
      'The CSV has no reported-events column. Expected a header like "2026 Events".',
    );
  }

  const memberYears = uniqueSorted(columns.memberYears);
  const activityYear = eventsYears[eventsYears.length - 1];
  const rebateYear = activityYear + 1;
  const locked = memberYears.includes(activityYear);
  const members: MemberSource = locked
    ? { source: "snapshot", year: activityYear }
    : { source: "current" };

  const open: Cycle = {
    rebateYear,
    kind: "open",
    members,
    eventYear: activityYear,
    planYear: rebateYear,
    eventsAreYearToDate: !locked,
  };

  const completed: Cycle[] = [];
  const planYears = uniqueSorted(columns.planYears).sort((left, right) => right - left);
  for (const year of planYears) {
    if (year === rebateYear) continue;
    const sourceYear = year - 1;
    if (!memberYears.includes(sourceYear) || !eventsYears.includes(sourceYear)) continue;
    completed.push({
      rebateYear: year,
      kind: "complete",
      members: { source: "snapshot", year: sourceYear },
      eventYear: sourceYear,
      planYear: year,
      eventsAreYearToDate: false,
    });
    if (completed.length === 2) break;
  }

  return {
    open,
    completed,
    eventsYears,
    snapshotYears: memberYears,
    planYears: uniqueSorted(columns.planYears),
    unreportedYears: uniqueSorted(columns.unreportedYears),
  };
}

export function cycleMembers(branch: Branch, cycle: Cycle): number | null {
  if (cycle.members.source === "current") return branch.currentMembers;
  return branch.membersByYear[cycle.members.year] ?? null;
}
