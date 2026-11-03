import Papa from "papaparse";
import { EMAIL_HEADERS, HEADER, type EmailKey } from "../config/defaults";
import { buildCycles } from "./cycles";
import { CsvFormatError } from "./errors";
import { normalizeRegion, slugify } from "./regions";
import { detectScope } from "./scope";
import type { Branch, DataQuality, OfficerEmails, PlanValue, Workbook } from "./types";

function yearOf(header: string, pattern: RegExp): number | null {
  const match = header.match(pattern);
  if (!match) return null;
  const year = Number(match[1]);
  if (year < 1900 || year > 2200) return null;
  return year;
}

export function parseNumeric(raw: string | undefined): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function parsePlan(raw: string | undefined): { value: PlanValue; unrecognized?: string } {
  if (raw == null || raw.trim() === "") return { value: "blank" };
  const text = raw.trim().toLowerCase();
  if (text === "yes" || text === "y" || text === "submitted") return { value: "yes" };
  if (text === "no" || text === "n" || text === "not submitted") return { value: "no" };
  return { value: "unrecognized", unrecognized: raw.trim() };
}

function emptyEmails(): OfficerEmails {
  return {
    chair: "",
    viceChair: "",
    treasurer: "",
    secretary: "",
    counselor: "",
    sectionChair: "",
    sectionSac: "",
    sectionStudentRep: "",
    rsac: "",
    regionStudentRep: "",
    additionalRsac: "",
    additionalRegionStudentRep: "",
  };
}

export function parseVitalityCsv(csv: string): Workbook {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  const fatal = parsed.errors.filter(
    (error) => error.type === "Quotes" || error.type === "Delimiter",
  );
  if (fatal.length > 0) {
    throw new CsvFormatError(
      "The CSV could not be read. Check that it is the vitality export and that quotes are closed.",
    );
  }

  const headers = parsed.meta.fields ?? [];
  const required = [HEADER.region, HEADER.section, HEADER.school, HEADER.totalMembers];
  const missing = required.filter((name) => !headers.includes(name));
  if (missing.length > 0) {
    throw new CsvFormatError(`The CSV is missing required columns: ${missing.join(", ")}.`);
  }

  const eventYears: number[] = [];
  const memberYears: number[] = [];
  const planYears: number[] = [];
  const unreportedYears: number[] = [];
  for (const header of headers) {
    const unreported = yearOf(header, HEADER.unreported);
    if (unreported != null) {
      unreportedYears.push(unreported);
      continue;
    }
    const events = yearOf(header, HEADER.events);
    if (events != null) eventYears.push(events);
    const members = yearOf(header, HEADER.decMembers);
    if (members != null) memberYears.push(members);
    const plan = yearOf(header, HEADER.plan);
    if (plan != null) planYears.push(plan);
  }

  const cycles = buildCycles({ eventYears, memberYears, planYears, unreportedYears });
  const quality: DataQuality = {
    blankMemberCells: 0,
    blankEventCells: 0,
    blankPlanCells: 0,
    unrecognizedPlanValues: [],
  };
  const unrecognized = new Set<string>();
  const slugBySection = new Map<string, string>();
  const usedSlugs = new Set<string>();
  const branches: Branch[] = [];

  for (const row of parsed.data) {
    const regionRaw = row[HEADER.region]?.trim() ?? "";
    const sectionRaw = row[HEADER.section]?.trim() ?? "";
    const schoolRaw = row[HEADER.school]?.trim() ?? "";
    const membersRaw = row[HEADER.totalMembers]?.trim() ?? "";
    if (!regionRaw && !sectionRaw && !schoolRaw && !membersRaw) continue;

    const region = normalizeRegion(regionRaw);
    const sectionName = sectionRaw || "Unknown section";
    const sectionKey = `${region.code}\u0000${sectionName}`;
    let sectionSlug = slugBySection.get(sectionKey);
    if (!sectionSlug) {
      const base = slugify(sectionName);
      let candidate = base;
      let suffix = 2;
      while (usedSlugs.has(`${region.code}/${candidate}`)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
      }
      usedSlugs.add(`${region.code}/${candidate}`);
      slugBySection.set(sectionKey, candidate);
      sectionSlug = candidate;
    }

    const currentMembers = parseNumeric(row[HEADER.totalMembers]);
    if (currentMembers == null) quality.blankMemberCells += 1;

    const membersByYear: Record<number, number | null> = {};
    for (const year of cycles.snapshotYears) {
      const value = parseNumeric(row[`Dec ${year} Members`]);
      membersByYear[year] = value;
      if (value == null) quality.blankMemberCells += 1;
    }

    const eventsByYear: Record<number, number | null> = {};
    for (const year of cycles.eventsYears) {
      const value = parseNumeric(row[`${year} Events`]);
      eventsByYear[year] = value;
      if (value == null) quality.blankEventCells += 1;
    }

    const unreportedByYear: Record<number, number | null> = {};
    for (const year of cycles.unreportedYears) {
      unreportedByYear[year] = parseNumeric(row[`${year} Unreported Events`]);
    }

    const plansByYear: Record<number, PlanValue> = {};
    for (const year of cycles.planYears) {
      const parsedPlan = parsePlan(row[`${year} Annual Plan`]);
      plansByYear[year] = parsedPlan.value;
      if (parsedPlan.value === "blank") quality.blankPlanCells += 1;
      if (parsedPlan.unrecognized) unrecognized.add(parsedPlan.unrecognized);
    }

    const emails = emptyEmails();
    for (const key of Object.keys(EMAIL_HEADERS) as EmailKey[]) {
      emails[key] = row[EMAIL_HEADERS[key]]?.trim() ?? "";
    }

    branches.push({
      sourceStatus: row[HEADER.status]?.trim() ?? "",
      regionCode: region.code,
      regionLabel: region.label,
      sectionName,
      sectionSlug,
      schoolName: schoolRaw || "Unknown school",
      spoid: row[HEADER.spoid]?.trim() ?? "",
      currentMembers,
      membersByYear,
      eventsByYear,
      unreportedByYear,
      plansByYear,
      emails,
    });
  }

  if (branches.length === 0) {
    throw new CsvFormatError("This CSV has no student branch rows.");
  }

  quality.unrecognizedPlanValues = [...unrecognized].sort((left, right) => left.localeCompare(right));
  return {
    branches,
    scope: detectScope(branches),
    cycles,
    quality,
  };
}
