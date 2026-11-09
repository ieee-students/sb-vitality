import {
  formatBranchChange,
  formatMemberChange,
  formatNumber,
  formatPercent,
  formatUsd,
} from "../domain/format";
import type { Kpis } from "../domain/types";

export function KpiGrid({ kpis, showRebate }: { kpis: Kpis; showRebate: boolean }) {
  return (
    <section
      className={showRebate ? "kpi-grid outcome-grid with-rebate" : "kpi-grid outcome-grid"}
      aria-label="Outcome summary"
    >
      <article className="kpi-card">
        <h2>In good standing</h2>
        <p className="kpi-value">{formatNumber(kpis.goodStanding.good)}</p>
        <p className="kpi-note">
          {formatPercent(kpis.goodStandingRate)} of branches for {kpis.openRebateYear} projected.
          {kpis.previousRates.length > 0
            ? ` ${kpis.previousRates.map((item) => `${item.rebateYear} was ${formatPercent(item.rate)}`).join(" · ")}.`
            : ""}
        </p>
        {kpis.goodStanding.incomplete > 0 ? (
          <p className="kpi-note">{formatNumber(kpis.goodStanding.incomplete)} incomplete for this cycle.</p>
        ) : null}
      </article>
      {showRebate ? (
        <article className="kpi-card">
          <h2>Branch rebate (approx.)</h2>
          <p className="kpi-value">{formatUsd(kpis.expectedRebate)}</p>
          <p className="kpi-note">At risk (vitality unmet): {formatUsd(kpis.foregoneRebate)}</p>
          <p className="kpi-note">Student portion of Section rebate: {formatUsd(kpis.sectionStudentPortion)}</p>
        </article>
      ) : null}
    </section>
  );
}

export function ActivityStatStrip({ kpis }: { kpis: Kpis }) {
  const change = kpis.memberChange;
  return (
    <div className="trends-stat-strip" aria-label="Activity overview">
      <article className="trends-stat-card">
        <h3>Student members</h3>
        <p className="trends-stat-value">{formatNumber(kpis.members)}</p>
        <p className={change ? `trends-stat-note delta-${change.direction}` : "trends-stat-note"}>
          {change ? formatMemberChange(change) : "No earlier December snapshot in this file."}
        </p>
      </article>
      <article className="trends-stat-card">
        <h3>Student branches</h3>
        <p className="trends-stat-value">{formatNumber(kpis.branchCount)}</p>
        {kpis.branchChange && kpis.branchChange.direction !== "flat" ? (
          <p className={`trends-stat-note delta-${kpis.branchChange.direction}`}>
            {formatBranchChange(kpis.branchChange)}
          </p>
        ) : null}
        <p className="trends-stat-note">
          {kpis.branchesWithoutReportedOfficers > 0
            ? `${formatNumber(kpis.branchesWithoutReportedOfficers)} without an officer report · `
            : "All have reported officers · "}
          {formatNumber(kpis.branchesWithoutCounselor)} without a counselor
          {kpis.branchesWithoutChair > 0
            ? ` · ${formatNumber(kpis.branchesWithoutChair)} without a chair`
            : ""}
          .
        </p>
        <p className="trends-stat-note trends-stat-history">
          {kpis.branchChange
            ? kpis.branchChange.historyText
            : "Current roster. This export does not say how many branches existed last year."}
        </p>
      </article>
      <article className="trends-stat-card">
        <h3>Events reported</h3>
        <p className="trends-stat-value">{formatNumber(kpis.reportedEvents)}</p>
        <p className="trends-stat-note">
          {kpis.eventsYear}
          {kpis.eventsYearToDate ? " year to date" : ""}.{" "}
          {kpis.unreportedEvents == null
            ? "No unreported-events column."
            : `${formatNumber(kpis.unreportedEvents)} unreported, not counted.`}
        </p>
        {kpis.reportedEventsMissing > 0 ? (
          <p className="trends-stat-note">
            {formatNumber(kpis.reportedEventsMissing)}{" "}
            {kpis.reportedEventsMissing === 1 ? "branch has" : "branches have"} a blank events cell and{" "}
            {kpis.reportedEventsMissing === 1 ? "is" : "are"} not in this total.
          </p>
        ) : null}
      </article>
    </div>
  );
}
