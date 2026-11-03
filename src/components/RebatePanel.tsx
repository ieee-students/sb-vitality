import { MANUAL_URL } from "../config/links";
import { formatNumber, formatUsd } from "../domain/format";
import type { Kpis } from "../domain/types";

export function RebatePanel({ kpis }: { kpis: Kpis }) {
  return (
    <section className="panel">
      <h2>Rebate at the current headcount</h2>
      <div className="money-grid">
        <article>
          <h3>Expected branch rebate</h3>
          <p className="money-value">{formatUsd(kpis.expectedRebate)}</p>
          <p>Paid to student branches in good standing for the {kpis.openRebateYear} cycle.</p>
        </article>
        <article>
          <h3>Foregone branch rebate</h3>
          <p className="money-value">{formatUsd(kpis.foregoneRebate)}</p>
          <p>The allowance those branches would not receive at their current size.</p>
        </article>
        <article>
          <h3>Section student portion</h3>
          <p className="money-value">{formatUsd(kpis.sectionStudentPortion)}</p>
          <p>$3 per student-branch member. This is part of the section rebate, not the branch rebate.</p>
        </article>
      </div>
      <p className="panel-lead">
        Branch allowance is $50 under 50 members and $100 at 50 or more, plus $2 per member. The two amounts
        above are not added together. A section still has its own membership, meeting, and timeliness
        requirements, which are not in this export.
        {kpis.unknownRebateBranches > 0
          ? ` ${formatNumber(kpis.unknownRebateBranches)} ${kpis.unknownRebateBranches === 1 ? "branch is" : "branches are"} incomplete, so ${kpis.unknownRebateBranches === 1 ? "it is" : "they are"} left out of both branch totals.`
          : ""}
        {kpis.eventsYearToDate
          ? ` ${kpis.eventsYear} events are year to date, and membership is the current headcount until a December snapshot is in the file.`
          : ""}{" "}
        <a href={MANUAL_URL} target="_blank" rel="noreferrer">
          MGA Operations Manual
        </a>
      </p>
    </section>
  );
}
