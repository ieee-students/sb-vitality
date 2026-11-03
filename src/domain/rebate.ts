import {
  SB_BASE_AT_LEAST,
  SB_BASE_BELOW,
  SB_BASE_MEMBER_THRESHOLD,
  SB_PER_MEMBER,
  SECTION_PER_STUDENT_MEMBER,
} from "../config/defaults";
import type { Standing } from "./types";

export function sbAllowance(members: number | null): number | null {
  if (members == null) return null;
  const base = members >= SB_BASE_MEMBER_THRESHOLD ? SB_BASE_AT_LEAST : SB_BASE_BELOW;
  return base + SB_PER_MEMBER * members;
}

export function splitRebate(
  allowance: number | null,
  standing: Standing,
): { expectedRebate: number | null; foregoneRebate: number | null } {
  if (allowance == null || standing === "incomplete") {
    return { expectedRebate: null, foregoneRebate: null };
  }
  if (standing === "good") return { expectedRebate: allowance, foregoneRebate: 0 };
  return { expectedRebate: 0, foregoneRebate: allowance };
}

export function sectionStudentPortion(members: number | null): number | null {
  if (members == null) return null;
  return SECTION_PER_STUDENT_MEMBER * members;
}
