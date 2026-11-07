import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  countTiers,
  DEFAULT_BRANCH_SORT,
  DEFAULT_SUMMARY_SORT,
  defaultSummarySort,
  evaluateAll,
  urgentBranches,
  whereToAct,
} from "../domain/metrics";
import { parseVitalityCsv } from "../domain/parseCsv";
import { resolveView } from "../domain/scope";
import { DashboardBody } from "../pages/DashboardPage";
import { FollowUpPanel, VISIBLE_FOLLOWUP_ITEMS } from "./FollowUpPanel";

const workbook = parseVitalityCsv(
  readFileSync(resolve(process.cwd(), "samples/sample-sb-vitality-report.csv"), "utf8"),
);

function panelHeadings(html: string): string[] {
  return Array.from(html.matchAll(/<section class="panel">[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/g), (match) =>
    match[1].replace(/<[^>]+>/g, "").trim(),
  );
}

describe("Dashboard page structure and combined FollowUpPanel", () => {
  it("keeps VISIBLE_FOLLOWUP_ITEMS at 10", () => {
    expect(VISIBLE_FOLLOWUP_ITEMS).toBe(10);
  });

  it("places tables above Follow-up actions and makes Rebate at the current headcount the last card", () => {
    const mgaView = resolveView(workbook.branches, workbook.scope);
    const regionView = resolveView(workbook.branches, workbook.scope, "r10");
    const sectionView = resolveView(workbook.branches, workbook.scope, "r10", "harbor-section");
    if (mgaView.status !== "ready" || regionView.status !== "ready" || sectionView.status !== "ready") {
      throw new Error("Expected sample views to resolve as ready");
    }

    const renderBody = (view: typeof mgaView, showRebate: boolean) =>
      renderToStaticMarkup(
        createElement(
          MemoryRouter,
          null,
          createElement(DashboardBody, {
            model: workbook,
            view,
            ignoreAnnualPlan: false,
            showRebate,
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

    const mgaWithRebate = renderBody(mgaView, true);
    expect(panelHeadings(mgaWithRebate)).toEqual([
      "Three-year picture",
      "Why branches miss 2027",
      "Regions",
      "Sections",
      "Student branches",
      "Follow-up actions",
      "Rebate at the current headcount",
    ]);
    expect(mgaWithRebate).toContain('placeholder="Search sections or region"');
    expect(mgaWithRebate).toContain('Search schools, SPOID, section, or region');

    const regionWithRebate = renderBody(regionView, true);
    expect(panelHeadings(regionWithRebate)).toEqual([
      "Three-year picture",
      "Why branches miss 2027",
      "Sections",
      "Student branches",
      "Follow-up actions",
      "Rebate at the current headcount",
    ]);

    const sectionWithRebate = renderBody(sectionView, true);
    expect(panelHeadings(sectionWithRebate)).toEqual([
      "Three-year picture",
      "Why branches miss 2027",
      "Student branches",
      "Follow-up actions",
      "Rebate at the current headcount",
    ]);

    const mgaWithoutRebate = renderBody(mgaView, false);
    expect(panelHeadings(mgaWithoutRebate)).toEqual([
      "Three-year picture",
      "Why branches miss 2027",
      "Regions",
      "Sections",
      "Student branches",
      "Dissolution risk",
    ]);

    const regionWithoutRebate = renderBody(regionView, false);
    expect(panelHeadings(regionWithoutRebate)).toEqual([
      "Three-year picture",
      "Why branches miss 2027",
      "Sections",
      "Student branches",
      "Dissolution risk",
    ]);
    expect(mgaWithoutRebate).not.toContain("$");
    expect(mgaWithoutRebate).not.toContain("Where to act");
    expect(mgaWithoutRebate).not.toContain("Rebate at the current headcount");
  });

  it("combines Dissolution risk and Where to act into tabs when rebate is enabled and links watchlist branches", () => {
    const evaluations = evaluateAll(workbook.branches, workbook.cycles, false);
    const counts = countTiers(evaluations);
    const urgent = urgentBranches(evaluations);
    const acts = whereToAct(evaluations, "mga");

    const mgaHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(FollowUpPanel, {
          counts,
          urgent,
          acts,
          level: "mga",
          showRebate: true,
        }),
      ),
    );
    expect(mgaHtml).toContain('role="tablist"');
    expect(mgaHtml).toContain("Dissolution risk");
    expect(mgaHtml).toContain("Where to act");
    expect(mgaHtml).toContain('href="/r10/summit-section#branch-stb90004"');
    expect(mgaHtml).not.toContain("followup-scroll-capped");

    const sectionHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(FollowUpPanel, {
          counts,
          urgent,
          acts: whereToAct(evaluations, "section"),
          level: "section",
          showRebate: true,
        }),
      ),
    );
    expect(sectionHtml).toContain('href="#branch-stb90004"');

    const regionHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(FollowUpPanel, {
          counts,
          urgent,
          acts: whereToAct(evaluations, "region"),
          level: "region",
          showRebate: true,
        }),
      ),
    );
    expect(regionHtml).toContain('href="#branch-stb90004"');
  });

  it("renders all items and caps vertical height at 10 with scrolling when more than 10 items exist", () => {
    const baseEval = evaluateAll(workbook.branches, workbook.cycles, false);
    const baseUrgent = urgentBranches(baseEval);
    const counts = countTiers(baseEval);

    const fourteenUrgent = Array.from({ length: 14 }, (_, index) => ({
      ...baseUrgent[index % baseUrgent.length],
      branch: {
        ...baseUrgent[index % baseUrgent.length].branch,
        spoid: `STB88${String(index).padStart(2, "0")}`,
        schoolName: `Watchlist School ${index + 1}`,
      },
    }));

    const riskCappedHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(FollowUpPanel, {
          counts,
          urgent: fourteenUrgent,
          acts: [],
          level: "mga",
          showRebate: false,
        }),
      ),
    );
    expect(riskCappedHtml).toContain("followup-scroll-capped");
    expect(riskCappedHtml).toContain("Watchlist School 1");
    expect(riskCappedHtml).toContain("Watchlist School 14");
    expect(riskCappedHtml).toContain("Showing 10 at a time — scroll to see all 14 branches on the watchlist.");

    const twelveActs = Array.from({ length: 12 }, (_, index) => ({
      id: `act-${index}`,
      title: `Action Section ${index + 1}`,
      subtitle: "Region 10",
      href: `/r10/action-section-${index + 1}`,
      foregone: 500 - index * 10,
      attention: 2,
    }));

    const actCappedHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(FollowUpPanel, {
          counts,
          urgent: baseUrgent,
          acts: twelveActs,
          level: "mga",
          showRebate: true,
          defaultTab: "act",
        }),
      ),
    );
    expect(actCappedHtml).toContain("followup-scroll-capped");
    expect(actCappedHtml).toContain("Action Section 1");
    expect(actCappedHtml).toContain("Action Section 12");
    expect(actCappedHtml).toContain("Showing 10 at a time — scroll to see all 12 sections.");
  });
});
