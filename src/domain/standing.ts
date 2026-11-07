import {
  MIN_EVENTS,
  MIN_MEMBERS,
  REQUIRED_OFFICER_KEYS,
  REQUIRED_OFFICER_LABELS,
  REQUIRED_OFFICERS,
} from "../config/defaults";
import type { Gap, OfficerEmails, Standing, StandingInput } from "./types";

export function assessOfficers(emails: OfficerEmails): {
  officerCount: number;
  hasAllOfficers: boolean;
  missingOfficers: string[];
  hasCounselor: boolean;
  hasChair: boolean;
  hasReportedOfficers: boolean;
  hasCoreLeadership: boolean;
} {
  const missingOfficers: string[] = [];
  let officerCount = 0;
  for (const key of REQUIRED_OFFICER_KEYS) {
    if (emails[key].trim()) {
      officerCount += 1;
    } else {
      missingOfficers.push(REQUIRED_OFFICER_LABELS[key]);
    }
  }
  const hasCounselor = Boolean(emails.counselor.trim());
  const hasChair = Boolean(emails.chair.trim());
  const hasReportedOfficers = officerCount > 0 || hasCounselor;
  return {
    officerCount,
    hasAllOfficers: officerCount >= REQUIRED_OFFICERS,
    missingOfficers,
    hasCounselor,
    hasChair,
    hasReportedOfficers,
    hasCoreLeadership: hasChair && hasCounselor,
  };
}

/** Rules: docs/calculations.md */
export function evaluateStanding(input: StandingInput): Standing {
  const planKnown = input.plan === "yes" || input.plan === "no";
  if (input.members == null || input.events == null || (input.planRequired && !planKnown)) {
    return "incomplete";
  }

  const planOk = !input.planRequired || input.plan === "yes";
  const officersOk =
    !input.officersRequired ||
    (input.hasReportedOfficers !== undefined
      ? input.hasReportedOfficers
      : (input.officersCount ?? 1) >= 1);
  if (input.members >= MIN_MEMBERS && input.events >= MIN_EVENTS && planOk && officersOk) {
    return "good";
  }
  if (input.events === 0 && (!input.planRequired || input.plan !== "yes")) return "inactive";
  return "needs-support";
}

export function requirementGap(input: StandingInput): Gap {
  const standing = evaluateStanding(input);
  if (standing === "good") return "good";
  if (standing === "incomplete") return "incomplete";

  const officersOk =
    !input.officersRequired ||
    (input.hasReportedOfficers !== undefined
      ? input.hasReportedOfficers
      : (input.officersCount ?? 1) >= 1);

  const failures = [
    input.members != null && input.members < MIN_MEMBERS ? "members" : null,
    input.events != null && input.events < MIN_EVENTS ? "events" : null,
    !officersOk ? "officers" : null,
    input.planRequired && input.plan !== "yes" ? "plan" : null,
  ].filter((item): item is "members" | "events" | "officers" | "plan" => item != null);

  if (failures.length === 2) return "two-requirements";
  if (failures.length === 3) return "three-requirements";
  if (failures.length === 4) return "four-requirements";
  if (failures.length > 4) return "multiple";
  if (failures[0] === "members") return "only-members";
  if (failures[0] === "events") return "only-events";
  if (failures[0] === "officers") return "only-officers";
  return "only-plan";
}
