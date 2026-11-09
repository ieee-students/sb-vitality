import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { cycleHeading } from "../domain/format";
import {
  branchRows,
  DEFAULT_BRANCH_SORT,
  DEFAULT_SUMMARY_SORT,
  evaluateAll,
  summaryRows,
} from "../domain/metrics";
import { parseVitalityCsv } from "../domain/parseCsv";
import { BranchTable } from "./BranchTable";
import { SummaryTable } from "./SummaryTable";
import { VISIBLE_TABLE_ROWS } from "./TableScroll";

const workbook = parseVitalityCsv(
  readFileSync(resolve(process.cwd(), "samples/sample-sb-vitality-report.csv"), "utf8"),
);
const evaluations = evaluateAll(workbook.branches, workbook.cycles, false);
const standingColumns = evaluations[0].cycles.map((result) => ({
  label: cycleHeading(result.cycle, false),
  planRequired: true,
  officersRequired: result.cycle.kind === "open",
}));

describe("10-row scrollable tables with headers and totals", () => {
  it("keeps VISIBLE_TABLE_ROWS at 10", () => {
    expect(VISIBLE_TABLE_ROWS).toBe(10);
  });

  it("caps section SummaryTable only when more than 10 sections are listed, and keeps totals in tfoot", () => {
    const baseSections = summaryRows(evaluations, "section", false);
    const fiveHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(SummaryTable, {
          kind: "section",
          rows: baseSections,
          standingColumns,
          caption: "Vitality status by section",
          sort: DEFAULT_SUMMARY_SORT,
          onSort: () => {},
          emptyMessage: "None",
          showRegion: true,
          showRebate: false,
        }),
      ),
    );
    expect(fiveHtml).toContain('role="region"');
    expect(fiveHtml).not.toContain("table-scroll-capped");
    expect(fiveHtml).toContain("<tfoot>");
    expect(fiveHtml).toContain("Total");

    const twelveSections = Array.from({ length: 12 }, (_, index) => ({
      ...baseSections[index % baseSections.length],
      id: `sec-${index}`,
      name: `Section ${index + 1}`,
    }));
    const twelveHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(SummaryTable, {
          kind: "section",
          rows: twelveSections,
          standingColumns,
          caption: "Vitality status by section",
          sort: DEFAULT_SUMMARY_SORT,
          onSort: () => {},
          emptyMessage: "None",
          showRegion: true,
          showRebate: false,
        }),
      ),
    );
    expect(twelveHtml).toContain("table-scroll-capped");
    expect(twelveHtml).toContain("<tfoot>");
  });

  it("does not cap region SummaryTable", () => {
    const baseRegions = summaryRows(evaluations, "region", false);
    const twelveRegions = Array.from({ length: 12 }, (_, index) => ({
      ...baseRegions[index % baseRegions.length],
      id: `reg-${index}`,
      name: `Region ${index + 1}`,
    }));
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(SummaryTable, {
          kind: "region",
          rows: twelveRegions,
          standingColumns,
          caption: "Vitality status by region",
          sort: DEFAULT_SUMMARY_SORT,
          onSort: () => {},
          emptyMessage: "None",
          showRegion: false,
          showRebate: false,
        }),
      ),
    );
    expect(html).not.toContain("table-scroll-capped");
  });

  it("caps BranchTable when more than 10 student branches are listed and renders totals in tfoot", () => {
    const allBranchRows = branchRows(evaluations, workbook.cycles, false);
    expect(allBranchRows).toHaveLength(11);

    const elevenHtml = renderToStaticMarkup(
      createElement(BranchTable, {
        rows: allBranchRows,
        caption: "Sample student branches",
        sort: DEFAULT_BRANCH_SORT,
        onSort: () => {},
        emptyMessage: "No schools",
        showRebate: true,
      }),
    );
    expect(elevenHtml).toContain('role="region"');
    expect(elevenHtml).toContain("table-scroll-capped");
    expect(elevenHtml).toContain("<tfoot>");
    expect(elevenHtml).toContain("11 SBs");
    expect(elevenHtml).toContain("Projected $710");
    expect(elevenHtml).toContain("At risk $362");

    const tenHtml = renderToStaticMarkup(
      createElement(BranchTable, {
        rows: allBranchRows.slice(0, 10),
        caption: "Sample student branches",
        sort: DEFAULT_BRANCH_SORT,
        onSort: () => {},
        emptyMessage: "No schools",
        showRebate: false,
      }),
    );
    expect(tenHtml).not.toContain("table-scroll-capped");
    expect(tenHtml).toContain("<tfoot>");
    expect(tenHtml).toContain("10 SBs");
    expect(tenHtml).not.toContain("Expected $");
  });

  it("renders the requested column order for region, section, and student branch tables", () => {
    const firstRowHeaders = (html: string) => {
      const theadRow = /<thead><tr>([\s\S]*?)<\/tr>/.exec(html)?.[1] ?? "";
      return Array.from(theadRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g), (match) =>
        match[1]
          .replace(/<span class="sr-only">[\s\S]*?<\/span>/g, "")
          .replace(/<span class="group-note">[\s\S]*?<\/span>/g, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    };

    const regionHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(SummaryTable, {
          kind: "region",
          rows: summaryRows(evaluations, "region", false),
          standingColumns,
          caption: "Vitality status by region",
          sort: DEFAULT_SUMMARY_SORT,
          onSort: () => {},
          emptyMessage: "None",
          showRegion: false,
          showRebate: false,
        }),
      ),
    );
    expect(firstRowHeaders(regionHtml)).toEqual([
      "Region",
      "Sections",
      "Sections with SAC Chair",
      "Sections with SSR",
      "Student members",
      "Student branches",
      "SBs with officers",
      "SBs with counselor",
      "Reported events",
      "Vitality status",
      "Immediate action",
    ]);

    const sectionHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(SummaryTable, {
          kind: "section",
          rows: summaryRows(evaluations, "section", false),
          standingColumns,
          caption: "Vitality status by section",
          sort: DEFAULT_SUMMARY_SORT,
          onSort: () => {},
          emptyMessage: "None",
          showRegion: true,
          showRebate: false,
        }),
      ),
    );
    expect(firstRowHeaders(sectionHtml)).toEqual([
      "Section",
      "Region",
      "SAC Chair",
      "SSR",
      "Student members",
      "Student branches",
      "SBs with officers",
      "SBs with counselor",
      "Reported events",
      "Vitality status",
      "Immediate action",
    ]);

    const branchHtml = renderToStaticMarkup(
      createElement(BranchTable, {
        rows: branchRows(evaluations, workbook.cycles, false),
        caption: "Sample student branches",
        sort: DEFAULT_BRANCH_SORT,
        onSort: () => {},
        emptyMessage: "No schools",
        showRebate: true,
      }),
    );
    expect(firstRowHeaders(branchHtml)).toEqual([
      "School",
      "SPOID",
      "Sheet status",
      "Dissolution risk",
      "Members now",
      "2026 events",
      "Unreported",
      "2027 plan",
      "Officers",
      "Counselor",
      "2027 vitality projected",
      "Branch rebate",
      "Dec 2025 members",
      "2025 events",
      "2026 plan",
      "Officers",
      "2026 vitality",
      "Dec 2024 members",
      "2024 events",
      "2025 plan",
      "Officers",
      "2025 vitality",
    ]);
    expect(branchHtml).toContain("N/A");

    const branchWithSectionHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(BranchTable, {
          rows: branchRows(evaluations, workbook.cycles, false),
          caption: "Region student branches",
          sort: DEFAULT_BRANCH_SORT,
          onSort: () => {},
          emptyMessage: "No schools",
          showRebate: true,
          showSection: true,
        }),
      ),
    );
    expect(firstRowHeaders(branchWithSectionHtml)[0]).toBe("School");
    expect(firstRowHeaders(branchWithSectionHtml)[1]).toBe("Section");
    expect(branchWithSectionHtml).toContain('href="/r10/harbor-section"');

    const branchWithRegionAndSectionHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(BranchTable, {
          rows: branchRows(evaluations, workbook.cycles, false),
          caption: "All student branches",
          sort: DEFAULT_BRANCH_SORT,
          onSort: () => {},
          emptyMessage: "No schools",
          showRebate: true,
          showRegion: true,
          showSection: true,
        }),
      ),
    );
    expect(firstRowHeaders(branchWithRegionAndSectionHtml)[0]).toBe("School");
    expect(firstRowHeaders(branchWithRegionAndSectionHtml)[1]).toBe("Region");
    expect(firstRowHeaders(branchWithRegionAndSectionHtml)[2]).toBe("Section");
    expect(branchWithRegionAndSectionHtml).toContain('href="/r10"');
    expect(branchWithRegionAndSectionHtml).toContain('href="/r10/harbor-section"');
  });

  it("virtualizes large BranchTable datasets while keeping accurate totals in tfoot", () => {
    const baseRows = branchRows(evaluations, workbook.cycles, false);
    // Create 60 rows (> 40 threshold)
    const largeRows = Array.from({ length: 60 }, (_, idx) => ({
      ...baseRows[idx % baseRows.length],
      id: `row-${idx}`,
      anchor: `sb-${idx}`,
      schoolName: `School ${idx + 1}`,
    }));

    const html = renderToStaticMarkup(
      createElement(BranchTable, {
        rows: largeRows,
        caption: "Large branch roster",
        sort: DEFAULT_BRANCH_SORT,
        onSort: () => {},
        emptyMessage: "No schools",
        showRebate: true,
      }),
    );

    expect(html).toContain("table-scroll-capped");
    expect(html).toContain("60 SBs");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("padding:0;border:0;background:transparent");
  });

  it("virtualizes large SummaryTable datasets while keeping accurate totals in tfoot", () => {
    const baseSections = summaryRows(evaluations, "section", false);
    const largeSections = Array.from({ length: 50 }, (_, idx) => ({
      ...baseSections[idx % baseSections.length],
      id: `section-${idx}`,
      name: `Section ${idx + 1}`,
    }));

    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(SummaryTable, {
          kind: "section",
          rows: largeSections,
          standingColumns,
          caption: "Large section list",
          sort: DEFAULT_SUMMARY_SORT,
          onSort: () => {},
          emptyMessage: "None",
          showRegion: true,
          showRebate: false,
        }),
      ),
    );

    expect(html).toContain("table-scroll-capped");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("padding:0;border:0;background:transparent");
    expect(html).toContain("Total");
  });

  it("stabilizes table and follow-up scroll containers with overflow-anchor and scrollbar-gutter in styles.css", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
    expect(css).toMatch(/\.table-scroll-capped\s*\{[^}]*overflow-anchor:\s*none;/);
    expect(css).toMatch(/\.table-scroll-capped\s*\{[^}]*scrollbar-gutter:\s*stable;/);
    expect(css).toMatch(/\.followup-scroll-capped\s*\{[^}]*overflow-anchor:\s*none;/);
    expect(css).toMatch(/\.followup-scroll-capped\s*\{[^}]*scrollbar-gutter:\s*stable;/);
    expect(css).toMatch(/\.data-table tfoot\s*\{[^}]*bottom:\s*0;/);
    expect(css).toMatch(/\.data-table tfoot\s*\{[^}]*inset-block-end:\s*0;/);
  });
});
