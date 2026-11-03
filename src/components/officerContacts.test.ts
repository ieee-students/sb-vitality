import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BRANCH_SORT,
  DEFAULT_SUMMARY_SORT,
  defaultSummarySort,
} from "../domain/metrics";
import { parseVitalityCsv } from "../domain/parseCsv";
import { resolveView } from "../domain/scope";
import { DashboardBody } from "../pages/DashboardPage";
import { copyTextToClipboard } from "./OfficerContacts";

const workbook = parseVitalityCsv(
  readFileSync(resolve(process.cwd(), "samples/sample-sb-vitality-report.csv"), "utf8"),
);

function renderView(regionCode?: string, sectionSlug?: string, customWorkbook = workbook): string {
  const view = resolveView(customWorkbook.branches, customWorkbook.scope, regionCode, sectionSlug);
  if (view.status !== "ready") {
    throw new Error("Expected view to resolve as ready");
  }
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(DashboardBody, {
        model: customWorkbook,
        view,
        ignoreAnnualPlan: false,
        showRebate: false,
        query: "",
        setQuery: () => {},
        summarySort: defaultSummarySort(view.level),
        setSummarySort: () => {},
        sectionSort: DEFAULT_SUMMARY_SORT,
        setSectionSort: () => {},
        branchSort: DEFAULT_BRANCH_SORT,
        setBranchSort: () => {},
        error: null,
        memoryOnly: false,
      }),
    ),
  );
}

describe("OfficerContacts header card", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("omits officer contacts on MGA view", () => {
    const html = renderView();
    expect(html).not.toContain("officer-contacts");
    expect(html).not.toContain("Region officers");
    expect(html).not.toContain("Section officers");
  });

  it("renders region officer emails and clipboard copy button on region view", () => {
    const html = renderView("r10");
    expect(html).toContain("Region officers");
    expect(html).toContain("mailto:rsac.r10@example.com");
    expect(html).toContain("mailto:region.rep.r10@example.com");
    expect(html).not.toContain("Additional RSAC");
    expect(html).not.toContain("section.chair.harbor@example.com");
    expect(html).toContain('aria-label="Copy all region officers emails for Region 10"');

    const withAdditional = {
      ...workbook,
      branches: workbook.branches.map((branch) =>
        branch.regionCode === "R10"
          ? {
              ...branch,
              emails: {
                ...branch.emails,
                additionalRsac: "additional.rsac.r10@example.com",
                additionalRegionStudentRep: "additional.rep.r10@example.com",
              },
            }
          : branch,
      ),
    };
    const htmlWithAdditionals = renderView("r10", undefined, withAdditional);
    expect(htmlWithAdditionals).toContain("Additional RSAC");
    expect(htmlWithAdditionals).toContain("mailto:additional.rsac.r10@example.com");
    expect(htmlWithAdditionals).toContain("Additional Region Student Rep");
    expect(htmlWithAdditionals).toContain("mailto:additional.rep.r10@example.com");
  });

  it("renders section officer emails, missing placeholders, and clipboard copy button on section view", () => {
    const html = renderView("r10", "harbor-section");
    expect(html).toContain("Section officers");
    expect(html).toContain("Section Chair");
    expect(html).toContain("Section SAC");
    expect(html).toContain("Section Student Rep");
    expect(html).toContain("mailto:section.chair.harbor@example.com");
    expect(html).toContain("mailto:section.sac.harbor@example.com");
    expect(html).toContain("mailto:section.rep.harbor@example.com");
    expect(html).not.toContain("rsac.r10@example.com");
    expect(html).not.toContain("chair.stb90001@example.com");
    expect(html).toContain('aria-label="Copy all section officers emails for Harbor Section"');

    const missingSac = {
      ...workbook,
      branches: workbook.branches.map((branch) =>
        branch.sectionSlug === "harbor-section"
          ? { ...branch, emails: { ...branch.emails, sectionSac: "" } }
          : branch,
      ),
    };
    const missingHtml = renderView("r10", "harbor-section", missingSac);
    expect(missingHtml).toContain("Not reported");
  });

  it("copies comma-separated emails via navigator.clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const ok = await copyTextToClipboard(
      "section.chair.harbor@example.com, section.sac.harbor@example.com",
    );
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(
      "section.chair.harbor@example.com, section.sac.harbor@example.com",
    );
    expect(await copyTextToClipboard("")).toBe(false);
  });
});

