import { MANUAL_URL, VTOOLS_REBATES_URL } from "../config/links";
import { formatNumber, formatUsd } from "../domain/format";
import type { CycleRebateKpi, Kpis } from "../domain/types";

export function RebatePanel({ kpis }: { kpis: Kpis }) {
  const cycles: CycleRebateKpi[] =
    kpis.cycleRebates && kpis.cycleRebates.length > 0
      ? kpis.cycleRebates
      : [
          {
            rebateYear: kpis.openRebateYear,
            kind: "open",
            eventYear: kpis.eventsYear,
            membersLabel: "Members now",
            expectedRebate: kpis.expectedRebate,
            foregoneRebate: kpis.foregoneRebate,
            unknownRebateBranches: kpis.unknownRebateBranches,
            sectionStudentPortion: kpis.sectionStudentPortion,
            sectionPortionMissing: kpis.sectionPortionMissing,
            qualifiedBranches: kpis.goodStanding.good,
            unqualifiedBranches: kpis.goodStanding.needsSupport + kpis.goodStanding.inactive,
            activeBranches: kpis.branchCount,
            totalBranches: kpis.branchCount,
            members: kpis.members,
            officersEvaluated: true,
          },
        ];

  return (
    <section className="panel">
      <div className="rebate-panel-header">
        <h2>Approximate rebate estimates (3-year overview)</h2>
        <p className="panel-lead">
          Planning approximations based on MGA rebate allowances ($50 base under 50 members, $100 base at 50+ members, plus $2/member).
          To receive a rebate, student branches must satisfy all <strong>4 vitality requirements</strong>.
        </p>
      </div>

      <div className="rebate-cycle-grid">
        {cycles.map((cycle) => {
          const isOpen = cycle.kind === "open";
          return (
            <article
              key={cycle.rebateYear}
              className={`rebate-cycle-card ${isOpen ? "is-open" : "is-complete"}`}
            >
              <header className="rebate-card-header">
                <div className="rebate-card-title-wrap">
                  <span className="rebate-cycle-year">{cycle.rebateYear}</span>
                  <span className={`rebate-cycle-badge ${isOpen ? "badge-open" : "badge-complete"}`}>
                    {isOpen ? "Open (projected)" : "Completed cycle"}
                  </span>
                </div>
                <p className="rebate-card-meta">
                  {isOpen
                    ? `Activity year ${cycle.eventYear} YTD · ${cycle.membersLabel}`
                    : `Activity year ${cycle.eventYear} · ${cycle.membersLabel}`}
                </p>
              </header>

              <div className="rebate-metrics-list">
                <div className="rebate-metric-box metric-expected">
                  <span className="rebate-metric-label">
                    {isOpen ? "Estimated SB rebate" : "Estimated qualified rebate"}
                  </span>
                  <p className="rebate-metric-value">{formatUsd(cycle.expectedRebate)}</p>
                  <p className="rebate-metric-sub">
                    <strong>{formatNumber(cycle.qualifiedBranches)}</strong> of{" "}
                    {formatNumber(cycle.activeBranches)} SBs qualified
                  </p>
                </div>

                <div className="rebate-metric-box metric-risk">
                  <span className="rebate-metric-label">
                    {isOpen ? "Rebate at risk" : "Unqualified rebate"}
                  </span>
                  <p className="rebate-metric-value">{formatUsd(cycle.foregoneRebate)}</p>
                  <p className="rebate-metric-sub">
                    <strong>{formatNumber(cycle.unqualifiedBranches)}</strong>{" "}
                    {cycle.unqualifiedBranches === 1 ? "SB unqualified" : "SBs unqualified"} ($0.00)
                  </p>
                </div>

                <div className="rebate-metric-box metric-section">
                  <span className="rebate-metric-label">Student portion of Section rebate</span>
                  <p className="rebate-metric-value">{formatUsd(cycle.sectionStudentPortion)}</p>
                  <p className="rebate-metric-sub">
                    $3 × {formatNumber(cycle.members)} student members
                  </p>
                </div>
              </div>

              <div className="rebate-card-footer">
                {isOpen ? (
                  <p>
                    Evaluates all 4 requirements: members, {cycle.eventYear} YTD events, reported officers &amp; annual plan.
                  </p>
                ) : (
                  <p className="rebate-note-warning">
                    ⚠️ Historical officer status is not in the CSV export; qualification assumes officers were reported. Actual distributed rebate was likely lower.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="rebate-guidance-box">
        <h3>How student branch rebates &amp; section distributions work</h3>
        <div className="rebate-guidance-grid">
          <div className="rebate-guidance-item">
            <h4>4 Vitality Conditions Required</h4>
            <p>
              Student member count alone is not sufficient to receive a rebate. SBs must meet all 4 vitality requirements:
            </p>
            <ul>
              <li><strong>≥ 12 student members</strong> (by December snapshot)</li>
              <li><strong>≥ 4 reported events</strong> in vTools during activity year</li>
              <li><strong>Reported officers</strong> (at least Chair/officer or counselor)</li>
              <li><strong>Annual plan submitted</strong></li>
            </ul>
            <p className="rebate-zero-note">
              Units missing any condition receive <strong>$0.00</strong> rebate.
            </p>
          </div>

          <div className="rebate-guidance-item">
            <h4>Annual Distribution in Q3 via Sections</h4>
            <p>
              IEEE transfers approved student branch rebates annually in <strong>Q3</strong> (July–September) as a lump sum to the <strong>Section</strong>.
            </p>
            <p>
              Sections receive the total student branch rebate from IEEE and are responsible for distributing the individual allocations to their qualified student branches.
            </p>
            <p>
              The <strong>student portion of Section rebate</strong> ($3 per student member, as listed on Section rebate statements) is part of the Section rebate formula, separate from the student branch rebate.
            </p>
          </div>

          <div className="rebate-guidance-item">
            <h4>Verified Statements on IEEE vTools</h4>
            <p>
              All figures on this site are approximate estimates for planning and advocacy.
            </p>
            <p>
              Section officers can inspect and download the official, verified <em>Statement of Student Branch Rebate</em> and branch breakdown on IEEE vTools:
            </p>
            <p>
              <a
                href={VTOOLS_REBATES_URL}
                target="_blank"
                rel="noreferrer"
                className="vtools-rebate-link"
              >
                IEEE vTools Rebates Administration ↗
              </a>
            </p>
            <p>
              Reference:{" "}
              <a href={MANUAL_URL} target="_blank" rel="noreferrer">
                MGA Operations Manual
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
