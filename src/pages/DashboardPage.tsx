import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { StatusPill } from "../components/StatusPill";
import { BarChart } from "../components/Charts";
import { BranchTable } from "../components/BranchTable";
import { FollowUpPanel } from "../components/FollowUpPanel";
import { GapPanel } from "../components/GapPanel";
import { KpiGrid } from "../components/KpiGrid";
import { OfficerContacts } from "../components/OfficerContacts";
import { RebatePanel } from "../components/RebatePanel";
import { SummaryTable } from "../components/SummaryTable";
import { cycleHeading, formatNumber } from "../domain/format";
import {
  DEFAULT_BRANCH_SORT,
  DEFAULT_SUMMARY_SORT,
  defaultSummarySort,
  branchRows,
  summaryRows,
  buildKpis,
  collectOfficerContacts,
  countGaps,
  countTiers,
  evaluateAll,
  eventChart,
  memberChart,
  selectTable,
  urgentBranches,
  whereToAct,
} from "../domain/metrics";
import { canonicalRegionParam, resolveView } from "../domain/scope";
import type { SortState } from "../domain/types";
import { useVitalityRoute } from "../routing/useVitalityRoute";
import { useAppState } from "../state/AppState";

function nextSort(current: SortState, key: string, numericFirst: "asc" | "desc"): SortState {
  if (current.key !== key) return { key, direction: numericFirst };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

export function DashboardPage() {
  const { model, stored, ignoreAnnualPlan, showRebate, error, memoryOnly } = useAppState();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { regionCode, sectionSlug } = useVitalityRoute();
  const [sectionQuery, setSectionQuery] = useState("");
  const [branchQuery, setBranchQuery] = useState("");
  const [summarySort, setSummarySort] = useState<SortState>(() =>
    defaultSummarySort(regionCode || sectionSlug ? null : model?.scope.level),
  );
  const [sectionSort, setSectionSort] = useState<SortState>(DEFAULT_SUMMARY_SORT);
  const [branchSort, setBranchSort] = useState<SortState>(DEFAULT_BRANCH_SORT);

  useEffect(() => {
    setSectionQuery("");
    setBranchQuery("");
    setSummarySort(defaultSummarySort(regionCode || sectionSlug ? null : model?.scope.level));
    setSectionSort(DEFAULT_SUMMARY_SORT);
    setBranchSort(DEFAULT_BRANCH_SORT);
  }, [regionCode, sectionSlug, stored?.importedAt, model?.scope.level]);

  useEffect(() => {
    if (showRebate) return;
    setSummarySort((current) =>
      current.key === "foregone"
        ? defaultSummarySort(regionCode || sectionSlug ? null : model?.scope.level)
        : current,
    );
    setSectionSort((current) => (current.key === "foregone" ? DEFAULT_SUMMARY_SORT : current));
    setBranchSort((current) => (current.key === "foregone" ? DEFAULT_BRANCH_SORT : current));
  }, [showRebate, regionCode, sectionSlug, model?.scope.level]);

  useEffect(() => {
    if (!regionCode) return;
    const canonical = canonicalRegionParam(regionCode);
    if (canonical !== regionCode) {
      navigate(sectionSlug ? `/${canonical}/${sectionSlug}` : `/${canonical}`, { replace: true });
    }
  }, [navigate, regionCode, sectionSlug]);

  const view = useMemo(() => {
    if (!model) return null;
    return resolveView(model.branches, model.scope, regionCode, sectionSlug);
  }, [model, regionCode, sectionSlug]);

  useEffect(() => {
    const title = view?.status === "ready" ? view.title : "Student Branch Vitality";
    document.title = `${title} · Student Branch Vitality`;
  }, [view]);

  useEffect(() => {
    if (!hash || view?.status !== "ready") return;
    const target = document.getElementById(hash.slice(1));
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ block: "nearest" });
    }
  }, [hash, view]);

  if (!model || !stored || !view) return null;

  if (view.status !== "ready") {
    return (
      <div className="page">
        <div className="panel narrow-panel">
          <h1>{view.status === "outside-file" ? "Outside this file" : "Not in this file"}</h1>
          <p>{view.message}</p>
          <Link className="button" to={view.backTo}>
            {view.backLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardBody
      model={model}
      view={view}
      ignoreAnnualPlan={ignoreAnnualPlan}
      showRebate={showRebate}
      sectionQuery={sectionQuery}
      setSectionQuery={setSectionQuery}
      branchQuery={branchQuery}
      setBranchQuery={setBranchQuery}
      summarySort={summarySort}
      setSummarySort={setSummarySort}
      sectionSort={sectionSort}
      setSectionSort={setSectionSort}
      branchSort={branchSort}
      setBranchSort={setBranchSort}
      error={error}
      memoryOnly={memoryOnly}
    />
  );
}

export function DashboardBody({
  model,
  view,
  ignoreAnnualPlan,
  showRebate,
  query,
  setQuery,
  sectionQuery,
  setSectionQuery,
  branchQuery,
  setBranchQuery,
  summarySort,
  setSummarySort,
  sectionSort,
  setSectionSort,
  branchSort,
  setBranchSort,
  error,
  memoryOnly,
}: {
  model: NonNullable<ReturnType<typeof useAppState>["model"]>;
  view: Extract<ReturnType<typeof resolveView>, { status: "ready" }>;
  ignoreAnnualPlan: boolean;
  showRebate: boolean;
  query?: string;
  setQuery?: (value: string) => void;
  sectionQuery?: string;
  setSectionQuery?: (value: string) => void;
  branchQuery?: string;
  setBranchQuery?: (value: string) => void;
  summarySort: SortState;
  setSummarySort: (value: SortState) => void;
  sectionSort: SortState;
  setSectionSort: (value: SortState) => void;
  branchSort: SortState;
  setBranchSort: (value: SortState) => void;
  error: string | null;
  memoryOnly: boolean;
}) {
  const sectionSearchInputId = useId();
  const branchSearchInputId = useId();
  const effectiveSectionQuery = sectionQuery !== undefined ? sectionQuery : (query ?? "");
  const effectiveSetSectionQuery = setSectionQuery ?? setQuery ?? (() => {});
  const effectiveBranchQuery = branchQuery !== undefined ? branchQuery : (query ?? "");
  const effectiveSetBranchQuery = setBranchQuery ?? setQuery ?? (() => {});

  const evaluations = useMemo(
    () => evaluateAll(view.branches, model.cycles, ignoreAnnualPlan),
    [view.branches, model.cycles, ignoreAnnualPlan],
  );
  const kpis = useMemo(() => buildKpis(evaluations, model.cycles), [evaluations, model.cycles]);
  const members = useMemo(() => memberChart(evaluations, model.cycles), [evaluations, model.cycles]);
  const events = useMemo(() => eventChart(evaluations, model.cycles), [evaluations, model.cycles]);
  const gaps = useMemo(() => countGaps(evaluations), [evaluations]);
  const tiers = useMemo(() => countTiers(evaluations), [evaluations]);
  const urgent = useMemo(() => urgentBranches(evaluations), [evaluations]);
  const acts = useMemo(() => whereToAct(evaluations, view.level), [evaluations, view.level]);
  const officerContacts = useMemo(
    () => collectOfficerContacts(view.branches, view.level),
    [view.branches, view.level],
  );
  const standingColumns = useMemo(
    () =>
      evaluations[0]?.cycles.map((result) => ({
        label: cycleHeading(result.cycle, ignoreAnnualPlan),
        planRequired: result.cycle.kind === "complete" || !ignoreAnnualPlan,
        officersRequired: result.cycle.kind === "open",
      })) ?? [],
    [evaluations, ignoreAnnualPlan],
  );
  const deferredSectionQuery = useDeferredValue(effectiveSectionQuery);
  const deferredBranchQuery = useDeferredValue(effectiveBranchQuery);
  const [targetAnchor, setTargetAnchor] = useState<string | null>(null);

  const allBranchRows = useMemo(
    () => branchRows(evaluations, model.cycles, ignoreAnnualPlan),
    [evaluations, model.cycles, ignoreAnnualPlan],
  );
  const allSectionRows = useMemo(
    () => (view.level === "section" ? [] : summaryRows(evaluations, "section", ignoreAnnualPlan)),
    [evaluations, view.level, ignoreAnnualPlan],
  );
  const allRegionRows = useMemo(
    () => (view.level === "mga" ? summaryRows(evaluations, "region", ignoreAnnualPlan) : []),
    [evaluations, view.level, ignoreAnnualPlan],
  );
  const branchTemplate = allBranchRows[0];
  const table = useMemo(
    () =>
      selectTable({
        evaluations,
        cycles: model.cycles,
        level: view.level,
        ignoreOpenPlan: ignoreAnnualPlan,
        sectionQuery: deferredSectionQuery,
        branchQuery: deferredBranchQuery,
        summarySort,
        sectionSort,
        branchSort,
        cachedBranchRows: allBranchRows,
        cachedSectionRows: allSectionRows,
        cachedRegionRows: allRegionRows,
      }),
    [
      evaluations,
      model.cycles,
      view.level,
      ignoreAnnualPlan,
      deferredSectionQuery,
      deferredBranchQuery,
      summarySort,
      sectionSort,
      branchSort,
      allBranchRows,
      allSectionRows,
      allRegionRows,
    ],
  );

  const sectionSearchField = (
    <search className="table-search">
      <label className="search" htmlFor={sectionSearchInputId}>
        <span className="sr-only">Search sections or region</span>
        <input
          id={sectionSearchInputId}
          type="search"
          value={effectiveSectionQuery}
          placeholder="Search sections or region"
          onChange={(event) => effectiveSetSectionQuery(event.target.value)}
        />
      </label>
      {effectiveSectionQuery ? (
        <button
          type="button"
          className="button button-quiet"
          onClick={() => effectiveSetSectionQuery("")}
        >
          Clear search
        </button>
      ) : null}
    </search>
  );

  const branchSearchLabel =
    view.level === "section"
      ? "Search schools or SPOID"
      : view.level === "region"
        ? "Search schools, SPOID, or section"
        : "Search schools, SPOID, section, or region";
  const branchSearchField = (
    <search className="table-search">
      <label className="search" htmlFor={branchSearchInputId}>
        <span className="sr-only">{branchSearchLabel}</span>
        <input
          id={branchSearchInputId}
          type="search"
          value={effectiveBranchQuery}
          placeholder="Search"
          onChange={(event) => effectiveSetBranchQuery(event.target.value)}
        />
      </label>
      {effectiveBranchQuery ? (
        <button
          type="button"
          className="button button-quiet"
          onClick={() => effectiveSetBranchQuery("")}
        >
          Clear search
        </button>
      ) : null}
    </search>
  );
  const branchTableCaption = `${view.title} student branches${
    effectiveBranchQuery.trim() ? ` · matching “${effectiveBranchQuery.trim()}”` : ""
  }`;

  const handleSelectAnchor = (anchorId: string) => {
    setTargetAnchor(anchorId);
    const scrollTarget = () => {
      const target = document.getElementById(anchorId);
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "nearest" });
      }
    };
    if (effectiveBranchQuery) {
      effectiveSetBranchQuery("");
      requestAnimationFrame(scrollTarget);
      return;
    }
    scrollTarget();
  };

  return (
    <div className="page">
      {error ? (
        <p className="banner banner-warn" role="alert">
          {error} The previous file is still in use.
        </p>
      ) : null}
      {memoryOnly ? (
        <p className="banner banner-warn">
          This browser did not keep the file for a later visit. It stays available until you close the tab.
        </p>
      ) : null}
      <QualityBanner model={model} incomplete={kpis.goodStanding.incomplete} />
      <div className={officerContacts ? "page-intro page-intro-with-contacts" : "page-intro"}>
        <div className="page-intro-main">
          <h1>{view.title}</h1>
          <p>
            {formatNumber(view.branches.length)} student{" "}
            {view.branches.length === 1 ? "branch" : "branches"} in this view.
          </p>
          <ul className="legend">
            <li><StatusPill standing="good" /></li>
            <li><StatusPill standing="needs-support" /></li>
            <li><StatusPill standing="inactive" /></li>
            <li><StatusPill standing="incomplete" /></li>
          </ul>
        </div>
        {officerContacts ? <OfficerContacts contacts={officerContacts} scopeTitle={view.title} /> : null}
      </div>
      <KpiGrid kpis={kpis} showRebate={showRebate} />
      <div className="split">
        <section className="panel">
          <h2>Three-year picture</h2>
          <div className="chart-row">
            <BarChart title="Student members" points={members} tone="blue" />
            <BarChart title="Reported events" points={events} tone="teal" />
          </div>
        </section>
        <GapPanel gaps={gaps} openYear={model.cycles.open.rebateYear} planExcluded={ignoreAnnualPlan} />
      </div>
      {view.level === "mga" ? (
        <>
          <section className="panel">
            <div className="table-toolbar">
              <h2>Regions</h2>
            </div>
            <SummaryTable
              kind="region"
              rows={table.summary}
              standingColumns={standingColumns}
              caption={summaryCaption("region", view.title, "")}
              sort={summarySort}
              emptyMessage={table.emptyMessage}
              showRebate={showRebate}
              showRegion={false}
              onSort={(key) =>
                setSummarySort(nextSort(summarySort, key, key === "name" || key === "region" ? "asc" : "desc"))
              }
            />
          </section>
          <section className="panel">
            <div className="table-toolbar">
              <h2>Sections</h2>
              {sectionSearchField}
            </div>
            <SummaryTable
              kind="section"
              rows={table.sections}
              standingColumns={standingColumns}
              caption={summaryCaption("section", view.title, effectiveSectionQuery)}
              sort={sectionSort}
              emptyMessage={table.sectionEmptyMessage}
              showRebate={showRebate}
              showRegion
              onSort={(key) =>
                setSectionSort(nextSort(sectionSort, key, key === "name" || key === "region" ? "asc" : "desc"))
              }
            />
          </section>
          <section className="panel">
            <div className="table-toolbar">
              <h2>Student branches</h2>
              {branchSearchField}
            </div>
            <BranchTable
              rows={table.branches}
              template={branchTemplate}
              caption={branchTableCaption}
              sort={branchSort}
              emptyMessage="No schools match that search."
              showRebate={showRebate}
              showRegion
              showSection
              targetAnchor={targetAnchor}
              onSort={(key) =>
                setBranchSort(
                  nextSort(
                    branchSort,
                    key,
                    key === "school" || key === "region" || key === "section" || key === "risk"
                      ? "asc"
                      : "desc",
                  ),
                )
              }
            />
          </section>
        </>
      ) : view.level === "region" ? (
        <>
          <section className="panel">
            <div className="table-toolbar">
              <h2>Sections</h2>
            </div>
            <SummaryTable
              kind="section"
              rows={table.sections}
              standingColumns={standingColumns}
              caption={summaryCaption("section", view.title, "")}
              sort={sectionSort}
              emptyMessage={table.emptyMessage}
              showRebate={showRebate}
              showRegion={false}
              onSort={(key) =>
                setSectionSort(nextSort(sectionSort, key, key === "name" || key === "region" ? "asc" : "desc"))
              }
            />
          </section>
          <section className="panel">
            <div className="table-toolbar">
              <h2>Student branches</h2>
              {branchSearchField}
            </div>
            <BranchTable
              rows={table.branches}
              template={branchTemplate}
              caption={branchTableCaption}
              sort={branchSort}
              emptyMessage="No schools match that search."
              showRebate={showRebate}
              showSection
              targetAnchor={targetAnchor}
              onSort={(key) =>
                setBranchSort(
                  nextSort(
                    branchSort,
                    key,
                    key === "school" || key === "section" || key === "risk" ? "asc" : "desc",
                  ),
                )
              }
            />
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="table-toolbar">
            <h2>Student branches</h2>
            {branchSearchField}
          </div>
          <BranchTable
            rows={table.branches}
            template={branchTemplate}
            caption={branchTableCaption}
            sort={branchSort}
            emptyMessage={table.emptyMessage}
            showRebate={showRebate}
            targetAnchor={targetAnchor}
            onSort={(key) =>
              setBranchSort(nextSort(branchSort, key, key === "school" || key === "risk" ? "asc" : "desc"))
            }
          />
        </section>
      )}
      <FollowUpPanel
        counts={tiers}
        urgent={urgent}
        acts={acts}
        level={view.level}
        showRebate={showRebate}
        onSelectAnchor={handleSelectAnchor}
      />
      {showRebate ? <RebatePanel kpis={kpis} /> : null}
    </div>
  );
}

function summaryCaption(kind: "region" | "section", title: string, query: string): string {
  const noun = kind === "region" ? "region" : "section";
  const place = kind === "section" && title !== "All regions" ? ` · ${title}` : "";
  const match = query.trim() ? ` · matching “${query.trim()}”` : "";
  return `Vitality status by ${noun}${place}${match}`;
}

function blankPhrase(count: number, noun: string): string | null {
  if (count === 0) return null;
  return `${formatNumber(count)} blank ${noun}${count === 1 ? "" : "s"}`;
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function QualityBanner({
  model,
  incomplete,
}: {
  model: NonNullable<ReturnType<typeof useAppState>["model"]>;
  incomplete: number;
}) {
  const { quality } = model;
  const blanks = [
    blankPhrase(quality.blankMemberCells, "member cell"),
    blankPhrase(quality.blankEventCells, "event cell"),
    blankPhrase(quality.blankPlanCells, "plan cell"),
  ].filter((item) => item != null);
  if (blanks.length === 0 && quality.unrecognizedPlanValues.length === 0 && incomplete === 0) return null;
  return (
    <div className="banner">
      {blanks.length > 0 ? (
        <>
          <p>Blank cells are missing data, not zeros.</p>
          <p>{joinList(blanks)}.</p>
        </>
      ) : null}
      {quality.unrecognizedPlanValues.length > 0 ? (
        <p>Unrecognized annual plan values: {quality.unrecognizedPlanValues.join(", ")}. They count as incomplete.</p>
      ) : null}
    </div>
  );
}
