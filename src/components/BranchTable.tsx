import { Fragment, useId, useRef } from "react";
import { Link } from "react-router-dom";
import {
  counselorHint,
  formatNumber,
  formatPercent,
  formatUsd,
  goodStandingHint,
  headingLines,
  historicalOfficersHint,
  officersHint,
  planLabel,
} from "../domain/format";
import { branchTotals } from "../domain/metrics";
import type { BranchRow, SortState } from "../domain/types";
import { RiskPill, StatusPill } from "./StatusPill";
import { TableScroll, VISIBLE_TABLE_ROWS } from "./TableScroll";
import { useVirtualRows } from "./useVirtualRows";

function ariaSort(sort: SortState, key: string): "ascending" | "descending" | "none" {
  if (sort.key !== key) return "none";
  return sort.direction === "asc" ? "ascending" : "descending";
}

function cell(value: number | null): string {
  return value == null ? "—" : formatNumber(value);
}

export function BranchTable({
  rows,
  caption,
  sort,
  onSort,
  emptyMessage,
  template,
  showRebate,
  showRegion = false,
  showSection = false,
  targetAnchor,
}: {
  rows: BranchRow[];
  caption: string;
  sort: SortState;
  onSort: (key: string) => void;
  emptyMessage: string;
  template?: BranchRow;
  showRebate: boolean;
  showRegion?: boolean;
  showSection?: boolean;
  targetAnchor?: string | null;
}) {
  const captionId = useId();
  const tableRef = useRef<HTMLTableElement>(null);
  const sample = template ?? rows[0];
  const totals = rows.length > 0 ? branchTotals(rows) : null;
  const { visibleRows, startIndex, topSpacerHeight, bottomSpacerHeight, firstRowRef } = useVirtualRows({
    rows,
    tableRef,
    targetAnchor,
    getAnchor: (r) => r.anchor,
  });

  function header(key: string, label: string, className?: string, srSuffix?: string, hint?: string) {
    return (
      <th scope="col" aria-sort={ariaSort(sort, key)} className={className} title={hint}>
        <button type="button" onClick={() => onSort(key)} title={hint} aria-description={hint}>
          {label}
          {srSuffix ? <span className="sr-only"> {srSuffix}</span> : null}
        </button>
      </th>
    );
  }

  const cycleColumnCount = (sample?.cycles ?? []).reduce((sum, cycleCol) => {
    const isOpen = cycleCol.kind === "open";
    return (
      sum +
      5 +
      (cycleCol.showUnreported ? 1 : 0) +
      (isOpen ? 1 : 0) +
      (isOpen && showRebate ? 1 : 0)
    );
  }, 0);
  const columnCount = 4 + (showRegion ? 1 : 0) + (showSection ? 1 : 0) + cycleColumnCount;

  return (
    <div>
      <p id={captionId} className="table-caption">{caption}</p>
      <TableScroll captionId={captionId} rowCount={rows.length} maxVisibleRows={VISIBLE_TABLE_ROWS}>
        <table ref={tableRef} className="data-table branch-table" aria-labelledby={captionId}>
          <thead>
            <tr>
              {header("school", "School", "sticky-col")}
              {showRegion ? header("region", "Region") : null}
              {showSection ? header("section", "Section") : null}
              {header("spoid", "SPOID")}
              {header("status", "Sheet status")}
              {header("risk", "Dissolution risk")}
              {sample?.cycles.map((cycleCol, cycleIndex) => {
                const isOpen = cycleCol.kind === "open";
                const standingHint = goodStandingHint(
                  cycleCol.standingLabel,
                  cycleCol.planRequired,
                  cycleCol.officersRequired,
                );
                const naOfficersHint = historicalOfficersHint(
                  cycleCol.rebateYear,
                  cycleCol.membersLabel,
                  cycleCol.eventYear,
                );
                const membersKey = cycleIndex === 0 ? "members" : `members-${cycleIndex}`;
                const eventsKey = cycleIndex === 0 ? "events" : `events-${cycleIndex}`;
                const unreportedKey = cycleIndex === 0 ? "unreported" : `unreported-${cycleIndex}`;
                const planKey = cycleIndex === 0 ? "plan" : `plan-${cycleIndex}`;
                const standingKey = cycleIndex === 0 ? "standing" : `standing-${cycleIndex}`;
                return (
                  <Fragment key={cycleCol.rebateYear}>
                    {header(membersKey, cycleCol.membersLabel, "num year-start")}
                    {header(eventsKey, cycleCol.eventsLabel, "num")}
                    {cycleCol.showUnreported ? header(unreportedKey, "Unreported", "num") : null}
                    {header(planKey, cycleCol.planLabel)}
                    {cycleCol.officersAvailable ? (
                      header("officers", "Officers", "num", `(${cycleCol.rebateYear} cycle)`)
                    ) : (
                      <th
                        scope="col"
                        className="num"
                        title={naOfficersHint}
                        aria-description={naOfficersHint}
                      >
                        Officers
                        <span className="sr-only"> ({cycleCol.rebateYear} cycle, not in CSV)</span>
                      </th>
                    )}
                    {isOpen ? header("counselor", "Counselor") : null}
                    <th
                      scope="col"
                      aria-sort={ariaSort(sort, standingKey)}
                      title={standingHint}
                    >
                      <button
                        type="button"
                        className="stacked-heading"
                        onClick={() => onSort(standingKey)}
                        title={standingHint}
                        aria-description={standingHint}
                      >
                        {headingLines(cycleCol.standingLabel).map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </button>
                    </th>
                    {isOpen && showRebate
                      ? header(
                          "foregone",
                          "Branch rebate",
                          undefined,
                          undefined,
                          "Approximate student branch rebate: projected if in good standing, at risk if vitality conditions are unmet.",
                        )
                      : null}
                  </Fragment>
                );
              }) ?? null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(columnCount, 1)}>{emptyMessage}</td>
              </tr>
            ) : (
              <>
                {topSpacerHeight > 0 ? (
                  <tr key="__top_spacer" style={{ height: `${topSpacerHeight}px` }} aria-hidden="true">
                    <td
                      colSpan={Math.max(columnCount, 1)}
                      style={{
                        height: `${topSpacerHeight}px`,
                        padding: 0,
                        border: 0,
                        background: "transparent",
                      }}
                    />
                  </tr>
                ) : null}
                {visibleRows.map((row, index) => {
                  const currentOfficersHint = officersHint(
                    row.officerCount,
                    row.missingOfficers,
                    row.hasCounselor,
                    row.hasChair,
                  );
                  return (
                    <tr
                      key={row.id}
                      id={row.anchor}
                      ref={startIndex === 0 && index === 0 ? firstRowRef : undefined}
                    >
                      <th scope="row" className="sticky-col">{row.schoolName}</th>
                      {showRegion ? (
                        <td>
                          <Link to={`/${row.regionCode.toLowerCase()}`}>{row.regionLabel}</Link>
                        </td>
                      ) : null}
                      {showSection ? (
                        <td>
                          <Link to={row.sectionHref}>{row.sectionName}</Link>
                        </td>
                      ) : null}
                      <td>{row.spoid || "—"}</td>
                      <td>{row.sourceStatus}</td>
                      <td>
                        <RiskPill tier={row.dissolution} />
                        <span className="sr-only">. {row.dissolutionDetail}</span>
                      </td>
                      {row.cycles.map((cycleCol) => {
                        const isOpen = cycleCol.kind === "open";
                        const isNotEstablished = cycleCol.standing === "not-established";
                        const naOfficersHint = historicalOfficersHint(
                          cycleCol.rebateYear,
                          cycleCol.membersLabel,
                          cycleCol.eventYear,
                        );
                        return (
                          <Fragment key={cycleCol.rebateYear}>
                            <td className="num year-start">{cell(cycleCol.members)}</td>
                            <td className="num">{isNotEstablished ? "—" : cell(cycleCol.events)}</td>
                            {cycleCol.showUnreported ? (
                              <td className="num">{cell(cycleCol.unreported)}</td>
                            ) : null}
                            <td>{isNotEstablished ? "—" : planLabel(cycleCol.plan)}</td>
                            {cycleCol.officersAvailable ? (
                              <td className="num" title={currentOfficersHint}>
                                {!row.hasReportedOfficers ? (
                                  <span className="badge-danger">None (0/{row.officerTotal})</span>
                                ) : (
                                  <span className="officer-cell">
                                    ({row.officerCount}/{row.officerTotal})
                                    {!row.hasChair ? (
                                      <span
                                        className="tag-warning"
                                        title="Chair not reported (recommended at all times)"
                                      >
                                        No Chair
                                      </span>
                                    ) : null}
                                  </span>
                                )}
                                <span className="sr-only">. {currentOfficersHint}</span>
                              </td>
                            ) : (
                              <td className="num na-cell" title={naOfficersHint}>
                                N/A
                                <span className="sr-only">. {naOfficersHint}</span>
                              </td>
                            )}
                            {isOpen ? (
                              <td>
                                <span
                                  className={row.hasCounselor ? "counselor-yes" : "tag-warning"}
                                  title={counselorHint(row.hasCounselor)}
                                >
                                  {row.hasCounselor ? "Yes" : "Missing"}
                                </span>
                                <span className="sr-only">. {counselorHint(row.hasCounselor)}</span>
                              </td>
                            ) : null}
                            <td>
                              <StatusPill standing={cycleCol.standing} />
                            </td>
                            {isOpen && showRebate ? <td>{row.rebateText}</td> : null}
                          </Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
                {bottomSpacerHeight > 0 ? (
                  <tr key="__bottom_spacer" style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true">
                    <td
                      colSpan={Math.max(columnCount, 1)}
                      style={{
                        height: `${bottomSpacerHeight}px`,
                        padding: 0,
                        border: 0,
                        background: "transparent",
                      }}
                    />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
          {totals ? (
            <tfoot>
              <tr>
                <th scope="row" className="sticky-col">
                  Total
                  <span className="sr-only"> of the listed rows</span>
                </th>
                {showRegion ? <td></td> : null}
                {showSection ? <td></td> : null}
                <td>
                  {formatNumber(totals.branches)} {totals.branches === 1 ? "SB" : "SBs"}
                </td>
                <td></td>
                <td title="Student branches in immediate action or dissolution activity test.">
                  {formatNumber(totals.immediate)} immediate
                </td>
                {totals.cycles.map((cycleTotal) => {
                  const isOpen = cycleTotal.kind === "open";
                  return (
                    <Fragment key={cycleTotal.rebateYear}>
                      <td className="num year-start">{cell(cycleTotal.members)}</td>
                      <td className="num">{cell(cycleTotal.events)}</td>
                      {cycleTotal.showUnreported ? (
                        <td className="num">{cell(cycleTotal.unreported)}</td>
                      ) : null}
                      <td title="Student branches with an annual plan submitted, out of listed branches.">
                        {formatNumber(cycleTotal.planYes)} / {formatNumber(cycleTotal.total)}
                      </td>
                      {cycleTotal.officersAvailable ? (
                        <td
                          className="num"
                          title="Student branches with at least one officer or counselor reported, out of listed branches."
                        >
                          {formatNumber(totals.withOfficers)} / {formatNumber(totals.branches)}
                        </td>
                      ) : (
                        <td
                          className="num na-cell"
                          title="Historical officer data is not in the CSV export."
                        >
                          N/A
                        </td>
                      )}
                      {isOpen ? (
                        <td title="Student branches with a counselor reported, out of listed branches.">
                          {formatNumber(totals.withCounselor)} / {formatNumber(totals.branches)}
                        </td>
                      ) : null}
                      <td title="Student branches in good standing, out of listed branches.">
                        {formatNumber(cycleTotal.standingGood)} / {formatNumber(cycleTotal.total)} (
                        {formatPercent(
                          cycleTotal.total === 0 ? null : cycleTotal.standingGood / cycleTotal.total,
                        )}
                        )
                      </td>
                      {isOpen && showRebate ? (
                        <td>
                          {totals.expected == null && totals.foregone == null ? (
                            "Unknown"
                          ) : (
                            <span className="stacked-total">
                              <span>Projected {formatUsd(totals.expected ?? 0)}</span>
                              <span>At risk {formatUsd(totals.foregone ?? 0)}</span>
                            </span>
                          )}
                        </td>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </TableScroll>
    </div>
  );
}
