import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseVitalityCsv } from "./parseCsv";
import { canonicalRegionParam, resolveView } from "./scope";
import type { Branch, OfficerEmails } from "./types";

function emails(): OfficerEmails {
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

function branch(regionCode: string, sectionName: string, sectionSlug: string, schoolName: string): Branch {
  return {
    sourceStatus: "",
    regionCode,
    regionLabel: regionCode === "R10" ? "Region 10" : regionCode,
    sectionName,
    sectionSlug,
    schoolName,
    spoid: schoolName,
    currentMembers: 12,
    membersByYear: {},
    eventsByYear: {},
    unreportedByYear: {},
    plansByYear: {},
    emails: emails(),
  };
}

const header = readFileSync(resolve(process.cwd(), "samples/sample-sb-vitality-report.csv"), "utf8").split(
  "\n",
)[0];

function row(region: string, section: string, school: string): string {
  return `Yes,${region},${section},${school},STB1,12,12,12,Yes,Yes,Yes,4,0,4,4,,,,,,,,,,,,`;
}

describe("scope", () => {
  const workbook = parseVitalityCsv(
    readFileSync(resolve(process.cwd(), "samples/sample-sb-vitality-report.csv"), "utf8"),
  );

  it("opens regions and sections from an MGA file and blocks unknown ones", () => {
    const home = resolveView(workbook.branches, workbook.scope);
    expect(home.status).toBe("ready");
    if (home.status === "ready") expect(home.title).toBe("All regions");
    const region = resolveView(workbook.branches, workbook.scope, "r10");
    expect(region.status).toBe("ready");
    if (region.status === "ready") {
      expect(region.level).toBe("region");
      expect(region.branches).toHaveLength(6);
      expect(region.crumbs.map((crumb) => crumb.label)).toEqual(["All regions", "Region 10"]);
    }
    const section = resolveView(workbook.branches, workbook.scope, "r10", "harbor-section");
    expect(section.status).toBe("ready");
    if (section.status === "ready") {
      expect(section.branches).toHaveLength(3);
      expect(section.crumbs.map((crumb) => crumb.to)).toEqual(["/", "/r10", null]);
    }
    expect(resolveView(workbook.branches, workbook.scope, "r4").status).toBe("missing");
    expect(canonicalRegionParam("r0")).toBe("r10");
  });

  it("treats R0 and R10 rows in one section as a section file", () => {
    const csv = [header, row("R0", "Harbor Section", "North Campus"), row("R10", "Harbor Section", "South Campus")].join(
      "\n",
    );
    const mixed = parseVitalityCsv(csv);
    expect(mixed.scope).toMatchObject({ level: "section", regionCode: "R10", sectionSlug: "harbor-section" });
    expect(resolveView(mixed.branches, mixed.scope, "r8").status).toBe("outside-file");
    expect(resolveView(mixed.branches, mixed.scope, "r10").status).toBe("outside-file");
    expect(resolveView(mixed.branches, mixed.scope, "r10", "harbor-section").status).toBe("ready");
  });

  it("keeps a region file inside that region", () => {
    const csv = [header, row("R8", "Oasis Section", "One"), row("R8", "St. Mary's Section", "Two")].join("\n");
    const regionFile = parseVitalityCsv(csv);
    expect(regionFile.scope.level).toBe("region");
    const home = resolveView(regionFile.branches, regionFile.scope);
    expect(home.status).toBe("ready");
    if (home.status === "ready") expect(home.crumbs).toEqual([{ label: "Region 8", to: null }]);
    expect(resolveView(regionFile.branches, regionFile.scope, "r7").status).toBe("outside-file");
    const child = resolveView(regionFile.branches, regionFile.scope, "r8", "st-mary-s-section");
    expect(child.status).toBe("ready");
    if (child.status === "ready") {
      expect(child.crumbs.map((crumb) => crumb.label)).toEqual(["Region 8", "St. Mary's Section"]);
    }
  });

  it("can build a branch without a csv", () => {
    expect(branch("R10", "Harbor Section", "harbor-section", "Example").regionCode).toBe("R10");
  });
});
