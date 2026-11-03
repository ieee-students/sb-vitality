/**
 * Thresholds, rebate amounts, and CSV header patterns.
 * Normative rules: docs/calculations.md.
 * A later configuration screen can edit these values. Version 1 reads them here.
 */

export const MIN_MEMBERS = 12;
export const MIN_EVENTS = 4;
export const MIN_REPORTED_OFFICERS = 1;
export const TOTAL_EXCOM_OFFICERS = 4;
export const REQUIRED_OFFICERS = 4;

export const REQUIRED_OFFICER_KEYS = ["chair", "viceChair", "treasurer", "secretary"] as const;
export type RequiredOfficerKey = (typeof REQUIRED_OFFICER_KEYS)[number];

export const REQUIRED_OFFICER_LABELS: Record<RequiredOfficerKey, string> = {
  chair: "Chair",
  viceChair: "Vice Chair",
  treasurer: "Treasurer",
  secretary: "Secretary",
};

export const SB_BASE_BELOW = 50;
export const SB_BASE_AT_LEAST = 100;
export const SB_BASE_MEMBER_THRESHOLD = 50;
export const SB_PER_MEMBER = 2;
export const SECTION_PER_STUDENT_MEMBER = 3;

export const HEADER = {
  region: "Region",
  section: "Section Name",
  school: "School Name",
  spoid: "SPOID",
  status: "Vitality Status",
  totalMembers: "Total Members",
  decMembers: /^Dec (\d{4}) Members$/,
  events: /^(\d{4}) Events$/,
  unreported: /^(\d{4}) Unreported Events$/,
  plan: /^(\d{4}) Annual Plan$/,
} as const;

export const EMAIL_HEADERS = {
  chair: "Chair Email",
  viceChair: "Vice Chair Email",
  treasurer: "Treasurer Email",
  secretary: "Secretary Email",
  counselor: "Counselor Email",
  sectionChair: "Section Chair Email",
  sectionSac: "Section SAC Email",
  sectionStudentRep: "Section Student Rep Email",
  rsac: "RSAC Email",
  regionStudentRep: "Region Student Rep Email",
  additionalRsac: "Additional RSAC Email",
  additionalRegionStudentRep: "Additional Region Student Rep Email",
} as const;

export type EmailKey = keyof typeof EMAIL_HEADERS;

export interface ContactRoleSpec {
  key: EmailKey;
  label: string;
  optional?: boolean;
}

export const SECTION_CONTACT_ROLES: readonly ContactRoleSpec[] = [
  { key: "sectionChair", label: "Section Chair" },
  { key: "sectionSac", label: "Section SAC" },
  { key: "sectionStudentRep", label: "Section Student Rep" },
];

export const REGION_CONTACT_ROLES: readonly ContactRoleSpec[] = [
  { key: "rsac", label: "RSAC" },
  { key: "regionStudentRep", label: "Region Student Rep" },
  { key: "additionalRsac", label: "Additional RSAC", optional: true },
  { key: "additionalRegionStudentRep", label: "Additional Region Student Rep", optional: true },
];
