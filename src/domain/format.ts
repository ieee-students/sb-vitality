import { MIN_EVENTS, MIN_MEMBERS, REQUIRED_OFFICERS } from "../config/defaults";
import type { BranchChange, Cycle, DissolutionTier, Gap, MemberChange, PlanValue, Standing } from "./types";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

export function formatUsd(value: number): string {
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(rate: number | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatMemberChange(change: MemberChange): string {
  if (change.direction === "flat") return `No change vs ${change.previousLabel}`;
  const word = change.direction === "up" ? "Up" : "Down";
  const amount = formatNumber(Math.abs(change.current - change.previous));
  const percent = change.percent == null ? "" : ` (${formatPercent(change.percent)})`;
  return `${word} ${amount}${percent} vs ${change.previousLabel}`;
}

export function formatBranchChange(change: BranchChange): string {
  if (change.direction === "flat") return `No change vs ${change.previousLabel}`;
  const word = change.direction === "up" ? "Up" : "Down";
  const amount = formatNumber(Math.abs(change.difference));
  const percent = change.percent == null ? "" : ` (${formatPercent(change.percent)})`;
  return `${word} ${amount}${percent} vs ${change.previousLabel}`;
}

export function standingLabel(standing: Standing): string {
  switch (standing) {
    case "good":
      return "Good standing";
    case "needs-support":
      return "Needs support";
    case "inactive":
      return "Inactive";
    case "incomplete":
      return "Incomplete data";
    case "not-established":
      return "Not established";
  }
}

export function dissolutionLabel(tier: DissolutionTier): string {
  switch (tier) {
    case "dissolution-activity-test":
      return "Dissolution activity test met";
    case "immediate":
      return "Immediate action";
    case "two-year-warning":
      return "Two-year warning";
    case "streak-incomplete":
      return "Multi-year failure, this year incomplete";
    case "one-year-watch":
      return "One-year watch";
    case "on-track":
      return "On track";
    case "unknown":
      return "Incomplete history";
  }
}

export function gapLabel(gap: Gap): string {
  switch (gap) {
    case "only-members":
      return "Under 12 members";
    case "only-events":
      return "Fewer than 4 events";
    case "only-officers":
      return "No reported officers";
    case "only-plan":
      return "Annual plan not submitted";
    case "two-requirements":
      return "2 requirements not met";
    case "three-requirements":
      return "3 requirements not met";
    case "four-requirements":
      return "All 4 requirements not met";
    case "multiple":
      return "More than one requirement";
    case "incomplete":
      return "Incomplete data";
    case "not-established":
      return "Not established";
    case "good":
      return "In good standing";
  }
}

export function planLabel(plan: PlanValue): string {
  switch (plan) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    case "blank":
      return "Blank";
    case "unrecognized":
      return "Unrecognized";
  }
}

export function goodStandingHint(
  label: string,
  planRequired: boolean,
  officersRequired = false,
): string {
  const officersPhrase = officersRequired ? `, at least one reported officer or counselor` : "";
  if (planRequired) {
    return `${label}: student branches with at least ${MIN_MEMBERS} members, ${MIN_EVENTS} reported events${officersPhrase}, and a submitted annual plan.`;
  }
  if (officersRequired) {
    return `${label}: student branches with at least ${MIN_MEMBERS} members, ${MIN_EVENTS} reported events, and at least one reported officer or counselor. The annual plan is not counted for this projected year.`;
  }
  return `${label}: student branches with at least ${MIN_MEMBERS} members and ${MIN_EVENTS} reported events. The annual plan is not counted for this projected year.`;
}

export function officersHint(
  officerCount: number,
  missingOfficers: string[],
  hasCounselor = false,
  hasChair = true,
): string {
  if (officerCount === 0 && !hasCounselor) {
    return "No officers reported. Non-compliant for rebate (at least one ExCom officer or Counselor required).";
  }
  const parts: string[] = [];
  if (missingOfficers.length === 0) {
    parts.push(`All ${REQUIRED_OFFICERS} ExCom officers reported (Chair, Vice Chair, Treasurer, Secretary).`);
  } else {
    parts.push(`${officerCount} of ${REQUIRED_OFFICERS} ExCom officers reported. Missing: ${missingOfficers.join(", ")}.`);
  }
  parts.push("Compliant for rebate reporting.");
  if (!hasChair) {
    parts.push("Note: Chair is vacant. Maintaining a Chair is recommended at all times.");
  }
  return parts.join(" ");
}

export function counselorHint(hasCounselor: boolean): string {
  if (hasCounselor) {
    return "Counselor reported. Meets recommended student branch leadership standard.";
  }
  return "No Counselor reported. Maintaining a Counselor at all times is recommended for branch vitality.";
}

export function historicalOfficersHint(
  rebateYear: number,
  membersLabel: string,
  eventYear: number,
): string {
  return `Historical officer data is not in the CSV export, so ${rebateYear} vitality is evaluated from ${membersLabel}, ${eventYear} reported events, and the ${rebateYear} annual plan.`;
}

export function cycleHeading(cycle: Cycle, ignoreOpenPlan: boolean): string {
  if (cycle.kind === "open") {
    return ignoreOpenPlan
      ? `${cycle.rebateYear} projected · plan excluded`
      : `${cycle.rebateYear} projected`;
  }
  return String(cycle.rebateYear);
}

export function branchCycleHeading(cycle: Cycle, ignoreOpenPlan: boolean): string {
  if (cycle.kind === "open") {
    return ignoreOpenPlan
      ? `${cycle.rebateYear} vitality · projected · plan excluded`
      : `${cycle.rebateYear} vitality · projected`;
  }
  return `${cycle.rebateYear} vitality`;
}

export function headingLines(label: string): string[] {
  const [first, ...rest] = label.split(" · ");
  const projected = /^(.*?) projected$/.exec(first);
  const lines = projected ? [projected[1], "projected"] : [first];
  return [...lines, ...rest];
}

export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
