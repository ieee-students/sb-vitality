import type { EmailKey } from "../config/defaults";

export type PlanValue = "yes" | "no" | "blank" | "unrecognized";

export type Standing = "good" | "needs-support" | "inactive" | "incomplete";

export type Gap =
  | "good"
  | "incomplete"
  | "only-members"
  | "only-events"
  | "only-officers"
  | "only-plan"
  | "multiple";

export type DissolutionTier =
  | "dissolution-activity-test"
  | "immediate"
  | "two-year-warning"
  | "streak-incomplete"
  | "one-year-watch"
  | "on-track"
  | "unknown";

export type ScopeLevel = "mga" | "region" | "section";

export interface OfficerEmails {
  chair: string;
  viceChair: string;
  treasurer: string;
  secretary: string;
  counselor: string;
  sectionChair: string;
  sectionSac: string;
  sectionStudentRep: string;
  rsac: string;
  regionStudentRep: string;
  additionalRsac: string;
  additionalRegionStudentRep: string;
}

export type EmailField = EmailKey;

export interface OfficerContactRole {
  key: EmailField;
  label: string;
  emails: string[];
}

export interface OfficerContactSummary {
  heading: string;
  roles: OfficerContactRole[];
  allEmails: string[];
  commaSeparated: string;
}

export interface Branch {
  sourceStatus: string;
  regionCode: string;
  regionLabel: string;
  sectionName: string;
  sectionSlug: string;
  schoolName: string;
  spoid: string;
  currentMembers: number | null;
  membersByYear: Record<number, number | null>;
  eventsByYear: Record<number, number | null>;
  unreportedByYear: Record<number, number | null>;
  plansByYear: Record<number, PlanValue>;
  emails: OfficerEmails;
}

export interface MemberSourceCurrent {
  source: "current";
}

export interface MemberSourceSnapshot {
  source: "snapshot";
  year: number;
}

export type MemberSource = MemberSourceCurrent | MemberSourceSnapshot;

export interface Cycle {
  rebateYear: number;
  kind: "open" | "complete";
  members: MemberSource;
  eventYear: number;
  planYear: number;
  eventsAreYearToDate: boolean;
}

export interface Cycles {
  open: Cycle;
  completed: Cycle[];
  eventsYears: number[];
  snapshotYears: number[];
  planYears: number[];
  unreportedYears: number[];
}

export interface Scope {
  level: ScopeLevel;
  regionCode: string | null;
  regionLabel: string | null;
  sectionName: string | null;
  sectionSlug: string | null;
}

export interface DataQuality {
  blankMemberCells: number;
  blankEventCells: number;
  blankPlanCells: number;
  unrecognizedPlanValues: string[];
}

export interface Workbook {
  branches: Branch[];
  scope: Scope;
  cycles: Cycles;
  quality: DataQuality;
}

export interface StandingInput {
  members: number | null;
  events: number | null;
  plan: PlanValue;
  planRequired: boolean;
  hasReportedOfficers?: boolean;
  officersCount?: number;
  officersRequired?: boolean;
}

export interface YearActivity {
  year: number;
  members: number | null;
  events: number | null;
}

export interface DissolutionAssessment {
  tier: DissolutionTier;
  streak: number;
  failedYears: number[];
  detail: string;
}

export interface CycleResult {
  cycle: Cycle;
  members: number | null;
  events: number | null;
  plan: PlanValue;
  standing: Standing;
  allowance: number | null;
  expectedRebate: number | null;
  foregoneRebate: number | null;
}

export interface BranchEvaluation {
  branch: Branch;
  cycles: CycleResult[];
  open: CycleResult;
  officerCount: number;
  hasAllOfficers: boolean;
  missingOfficers: string[];
  hasCounselor: boolean;
  hasChair: boolean;
  hasReportedOfficers: boolean;
  hasCoreLeadership: boolean;
  gap: Gap;
  dissolution: DissolutionAssessment;
  sectionPortion: number | null;
}

export interface StandingCounts {
  good: number;
  needsSupport: number;
  inactive: number;
  incomplete: number;
}

export interface MemberChange {
  current: number;
  previous: number;
  previousLabel: string;
  direction: "up" | "down" | "flat";
  percent: number | null;
}

export interface Kpis {
  branchCount: number;
  branchesWithoutAllOfficers: number;
  branchesWithoutReportedOfficers: number;
  branchesWithoutCounselor: number;
  branchesWithoutChair: number;
  members: number;
  membersMissing: number;
  memberChange: MemberChange | null;
  reportedEvents: number;
  reportedEventsMissing: number;
  eventsYear: number;
  eventsYearToDate: boolean;
  unreportedEvents: number | null;
  unreportedMissing: number;
  goodStanding: StandingCounts;
  goodStandingRate: number | null;
  previousRates: { rebateYear: number; rate: number | null; counts: StandingCounts }[];
  expectedRebate: number;
  foregoneRebate: number;
  unknownRebateBranches: number;
  sectionStudentPortion: number;
  sectionPortionMissing: number;
  openRebateYear: number;
}

export interface ChartPoint {
  label: string;
  sum: number;
  missing: number;
  yearToDate: boolean;
}

export interface GapCounts {
  onlyMembers: number;
  onlyEvents: number;
  onlyOfficers: number;
  onlyPlan: number;
  multiple: number;
  incomplete: number;
  good: number;
}

export interface SummaryRow {
  id: string;
  name: string;
  regionLabel: string;
  href: string;
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
  hasSacChair: boolean;
  hasSsr: boolean;
  standings: {
    label: string;
    good: number;
    total: number;
    planRequired: boolean;
    officersRequired?: boolean;
  }[];
  foregone: number;
  immediate: number;
  attention: number;
  searchText?: string;
}

export interface BranchCycleColumns {
  rebateYear: number;
  kind: "open" | "complete";
  membersLabel: string;
  members: number | null;
  eventYear: number;
  eventsLabel: string;
  events: number | null;
  showUnreported: boolean;
  unreported: number | null;
  planYear: number;
  planLabel: string;
  plan: PlanValue;
  officersAvailable: boolean;
  standingLabel: string;
  standing: Standing;
  planRequired: boolean;
  officersRequired: boolean;
}

export interface BranchRow {
  id: string;
  anchor: string;
  schoolName: string;
  regionCode: string;
  regionLabel: string;
  sectionName: string;
  sectionSlug: string;
  sectionHref: string;
  spoid: string;
  sourceStatus: string;
  currentMembers: number | null;
  snapshots: { label: string; value: number | null }[];
  events: { label: string; value: number | null }[];
  unreported: number | null;
  plans: { label: string; value: PlanValue }[];
  cycles: BranchCycleColumns[];
  officerCount: number;
  officerTotal: number;
  missingOfficers: string[];
  hasCounselor: boolean;
  hasChair: boolean;
  hasReportedOfficers: boolean;
  hasCoreLeadership: boolean;
  standings: {
    label: string;
    value: Standing;
    planRequired: boolean;
    officersRequired?: boolean;
  }[];
  dissolution: DissolutionTier;
  dissolutionLabel: string;
  dissolutionDetail: string;
  rebateText: string;
  expected: number | null;
  foregone: number | null;
  riskRank: number;
  attention: number;
  searchText?: string;
}

export interface ActItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  foregone: number;
  attention: number;
  searchText?: string;
}

export interface Crumb {
  label: string;
  to: string | null;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}
