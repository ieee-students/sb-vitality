import { formatMemberChange, formatNumber, formatPercent, formatUsd } from "../domain/format";
import type { Kpis } from "../domain/types";

export function KpiGrid({ kpis, showRebate }: { kpis: Kpis; showRebate: boolean }) {
  const change = kpis.memberChange;
  return (
    <section className={showRebate ? "kpi-grid with-rebate" : "kpi-grid"} aria-label="Summary">
      <article className="kpi-card">
        <h2>Student members</h2>
        <p className="kpi-value">{formatNumber(kpis.members)}</p>
        <p className={change ? `kpi-note delta-${change.direction}` : "kpi-note"}>
          {change ? formatMemberChange(change) : "No earlier December snapshot in this file."}
        </p>
      </article>
      <article className="kpi-card">
        <h2>Student branches</h2>
        <p className="kpi-value">{formatNumber(kpis.branchCount)}</p>
        <p className="kpi-note">
          {kpis.branchesWithoutReportedOfficers > 0
            ? `${formatNumber(kpis.branchesWithoutReportedOfficers)} without an officer report · `
            : "All have reported officers · "}
          {formatNumber(kpis.branchesWithoutCounselor)} without a counselor
          {kpis.branchesWithoutChair > 0
            ? ` · ${formatNumber(kpis.branchesWithoutChair)} without a chair`
            : ""}
          .
        </p>
        <p className="kpi-note">Current roster. This export does not say how many branches existed last year.</p>
      </article>
      <article className="kpi-card">
        <h2>Events reported</h2>
        <p className="kpi-value">{formatNumber(kpis.reportedEvents)}</p>
        <p className="kpi-note">
          {kpis.eventsYear}
          {kpis.eventsYearToDate ? " year to date" : ""}.{" "}
          {kpis.unreportedEvents == null
            ? "No unreported-events column."
            : `${formatNumber(kpis.unreportedEvents)} unreported, not counted.`}
        </p>
        {kpis.reportedEventsMissing > 0 ? (
          <p className="kpi-note">
            {formatNumber(kpis.reportedEventsMissing)}{" "}
            {kpis.reportedEventsMissing === 1 ? "branch has" : "branches have"} a blank events cell and{" "}
            {kpis.reportedEventsMissing === 1 ? "is" : "are"} not in this total.
          </p>
        ) : null}
      </article>
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
          <h2>Branch rebate</h2>
          <p className="kpi-value">{formatUsd(kpis.expectedRebate)}</p>
          <p className="kpi-note">Foregone at current size: {formatUsd(kpis.foregoneRebate)}</p>
          <p className="kpi-note">Section student portion, paid to sections: {formatUsd(kpis.sectionStudentPortion)}</p>
        </article>
      ) : null}
    </section>
  );
}
