import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CsvFormatError } from "./errors";
import { parseVitalityCsv } from "./parseCsv";

function sampleCsv(): string {
  return readFileSync(resolve(process.cwd(), "samples/sample-sb-vitality-report.csv"), "utf8");
}

function branchNamed(name: string) {
  return parseVitalityCsv(sampleCsv()).branches.find((branch) => branch.schoolName === name);
}

describe("parseVitalityCsv", () => {
  it("reads the fictional sample as an MGA file and maps R0 to Region 10", () => {
    const workbook = parseVitalityCsv(sampleCsv());
    expect(workbook.branches).toHaveLength(11);
    expect(workbook.scope.level).toBe("mga");
    expect(workbook.cycles.open.rebateYear).toBe(2027);
    expect(workbook.cycles.open.eventsAreYearToDate).toBe(true);
    expect(workbook.cycles.completed.map((cycle) => cycle.rebateYear)).toEqual([2026, 2025]);

    const harbor = branchNamed("Harbor Polytechnic");
    expect(harbor?.regionCode).toBe("R10");
    expect(harbor?.regionLabel).toBe("Region 10");
    expect(harbor?.sectionSlug).toBe("harbor-section");
    expect(harbor?.emails.chair).toBe("chair.stb90001@example.com");
  });

  it("keeps a blank events cell unknown and a zero as zero", () => {
    const westmill = branchNamed("Westmill Institute, City Campus");
    const pine = branchNamed("Pine Ridge University");
    expect(westmill?.eventsByYear[2026]).toBeNull();
    expect(westmill?.plansByYear[2027]).toBe("blank");
    expect(pine?.eventsByYear[2026]).toBe(0);
    expect(westmill?.unreportedByYear[2026]).toBeNull();
    expect(pine?.unreportedByYear[2026]).toBe(3);
  });

  it("uses only example.com addresses", () => {
    for (const branch of parseVitalityCsv(sampleCsv()).branches) {
      for (const email of Object.values(branch.emails)) {
        if (email) expect(email.endsWith("@example.com")).toBe(true);
      }
    }
  });

  it("rejects a file that is missing required columns", () => {
    expect(() => parseVitalityCsv("School Name,Total Members\nA,1\n")).toThrow(CsvFormatError);
  });

  it("rejects a header-only file", () => {
    const header = sampleCsv().split("\n")[0];
    expect(() => parseVitalityCsv(header)).toThrow(/no student branch rows/);
  });

  it("keeps the public sample identical to the fixture", () => {
    const fixture = sampleCsv();
    const published = readFileSync(
      resolve(process.cwd(), "public/sample-sb-vitality-report.csv"),
      "utf8",
    );
    expect(published).toBe(fixture);
  });

  it("does not commit the real export filename", () => {
    const ignore = readFileSync(resolve(process.cwd(), ".gitignore"), "utf8");
    expect(ignore).toMatch(/^\*Vitality Report\*\.csv$/m);
    expect(ignore).toMatch(/^\.cursor\/$/m);
    const exportPattern = /^.*Vitality Report.*\.csv$/;
    expect(exportPattern.test("MGA SAC SB Vitality Report.csv")).toBe(true);
    expect(exportPattern.test("MGA SAC SB Vitality Report (1).csv")).toBe(true);
    expect(exportPattern.test("Vitality Report - R10.csv")).toBe(true);
  });
});
