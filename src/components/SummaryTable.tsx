import { Fragment, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { formatNumber, formatPercent, formatUsd, goodStandingHint, headingLines } from "../domain/format";
import { summaryTotals } from "../domain/metrics";
import type { SortState, SummaryRow } from "../domain/types";
import { TableScroll, VISIBLE_TABLE_ROWS } from "./TableScroll";
import { useVirtualRows } from "./useVirtualRows";

function ariaSort(sort: SortState, key: string): "ascending" | "descending" | "none" {
  if (sort.key !== key) return "none";
  return sort.direction === "asc" ? "ascending" : "descending";
}

export function SummaryTable({
  rows,
  caption,
  sort,
  onSort,
  emptyMessage,
  showRegion,
  standingColumns,
  showRebate,
  kind = "section",
}: {
  rows: SummaryRow[];
  caption: string;
  sort: SortState;
  onSort: (key: string) => void;
  emptyMessage: string;
  showRegion: boolean;
  standingColumns: { label: string; planRequired: boolean; officersRequired?: boolean }[];
  showRebate: boolean;
  kind?: "region" | "section";
}) {
  const captionId = useId();
  const tableRef = useRef<HTMLTableElement>(null);
  const isRegionTable = kind === "region";
  const headerRows = standingColumns.length > 0 ? 2 : 1;
  const columnCount =
    9 +
    (isRegionTable ? 1 : 0) +
    (showRegion ? 1 : 0) +
    (showRebate ? 1 : 0) +
    standingColumns.length * 2;
  const immediateClass = standingColumns.length > 0 && !showRebate ? "num after-vitality" : "num";
  const totals = rows.length > 0 ? summaryTotals(rows) : null;
  const { visibleRows, startIndex, topSpacerHeight, bottomSpacerHeight, firstRowRef } = useVirtualRows({
    rows,
    tableRef,
  });
  const nameLabel = isRegionTable ? "Region" : "Section";
  const sacLabel = isRegionTable ? "Sections with SAC Chair" : "SAC Chair";
  const sacHint = isRegionTable
    ? "Sections in this region with a Section SAC Chair email reported."
    : "Whether this section has a Section SAC Chair email reported.";
  const ssrLabel = isRegionTable ? "Sections with SSR" : "SSR";
  const ssrHint = isRegionTable
    ? "Sections in this region with a Section Student Representative (SSR) email reported."
    : "Whether this section has a Section Student Representative (SSR) email reported.";

  function header(key: string, label: string, className?: string, hint?: string) {
    return (
      <th scope="col" aria-sort={ariaSort(sort, key)} className={className} rowSpan={headerRows} title={hint}>
        <button type="button" onClick={() => onSort(key)} title={hint} aria-description={hint}>
          {label}
        </button>
      </th>
    );
  }

  function standingCells(items: { good: number; total: number; allBranches?: number }[]) {
    return standingColumns.map((column, index) => {
      const item = items[index];
      const hint = item
        ? item.allBranches && item.total < item.allBranches
          ? `${formatNumber(item.good)} of ${formatNumber(item.total)} active branches for ${column.label} (excludes ${formatNumber(item.allBranches - item.total)} not established at that date).`
          : `${formatNumber(item.good)} of ${formatNumber(item.total)} branches for ${column.label}.`
        : undefined;
      return (
        <Fragment key={column.label}>
          <td className="num year-start">{item ? formatNumber(item.good) : "—"}</td>
          <td className="num" title={hint}>{item ? formatPercent(item.total === 0 ? null : item.good / item.total) : "—"}</td>
        </Fragment>
      );
    });
  }

  return (
    <div>
      <p id={captionId} className="table-caption">{caption}</p>
      <TableScroll
        captionId={captionId}
        rowCount={rows.length}
        maxVisibleRows={isRegionTable ? undefined : VISIBLE_TABLE_ROWS}
      >
      <table ref={tableRef} className="data-table summary-table" aria-labelledby={captionId}>
        <thead>
          <tr>
            {header("name", nameLabel, "sticky-col")}
            {showRegion ? header("region", "Region") : null}
            {isRegionTable ? header("sections", "Sections", "num") : null}
            {header("sac", sacLabel, isRegionTable ? "num" : undefined, sacHint)}
            {header("ssr", ssrLabel, isRegionTable ? "num" : undefined, ssrHint)}
            {header("members", "Student members", "num")}
            {header("branches", "Student branches", "num")}
            {header(
              "with-officers",
              "SBs with officers",
              "num",
              "Student branches with at least one officer or counselor reported (compliant for rebate).",
            )}
            {header(
              "with-counselor",
              "SBs with counselor",
              "num",
              "Student branches with a Counselor Email reported (maintaining a Counselor is recommended).",
            )}
            {header("events", "Reported events", "num")}
            {standingColumns.length > 0 ? (
              <th scope="colgroup" colSpan={standingColumns.length * 2} className="group-heading">
                Vitality status
                <span className="group-note">Student branches in good standing</span>
              </th>
            ) : null}
            {showRebate
              ? header(
                  "foregone",
                  "Rebate at risk",
                  standingColumns.length > 0 ? "num after-vitality" : "num",
                  "Approximate student-branch rebate at risk because branches do not meet all 4 vitality requirements.",
                )
              : null}
            {header("immediate", "Immediate action", immediateClass)}
          </tr>
          {standingColumns.length > 0 ? (
            <tr>
              {standingColumns.map((column, index) => {
                const countHint = goodStandingHint(
                  column.label,
                  column.planRequired,
                  column.officersRequired,
                );
                const percentHint = `Percent of student branches in good standing for ${column.label}.`;
                return (
                  <Fragment key={column.label}>
                    <th scope="col" aria-sort={ariaSort(sort, `standing-${index}`)} className="num year-start" title={countHint}>
                      <button
                        type="button"
                        className="stacked-heading"
                        onClick={() => onSort(`standing-${index}`)}
                        title={countHint}
                        aria-description={countHint}
                      >
                        {headingLines(column.label).map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </button>
                    </th>
                    <th scope="col" aria-sort={ariaSort(sort, `rate-${index}`)} className="num" title={percentHint}>
                      <button
                        type="button"
                        onClick={() => onSort(`rate-${index}`)}
                        title={percentHint}
                        aria-description={percentHint}
                      >
                        %
                        <span className="sr-only"> in good standing for {column.label}</span>
                      </button>
                    </th>
                  </Fragment>
                );
              })}
            </tr>
          ) : null}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount}>{emptyMessage}</td>
            </tr>
          ) : (
            <>
              {topSpacerHeight > 0 ? (
                <tr key="__top_spacer" style={{ height: `${topSpacerHeight}px` }} aria-hidden="true">
                  <td
                    colSpan={columnCount}
                    style={{
                      height: `${topSpacerHeight}px`,
                      padding: 0,
                      border: 0,
                      background: "transparent",
                    }}
                  />
                </tr>
              ) : null}
              {visibleRows.map((row, index) => (
                <tr key={row.id} ref={startIndex === 0 && index === 0 ? firstRowRef : undefined}>
                  <th scope="row" className="sticky-col">
                    <Link to={row.href}>{row.name}</Link>
                  </th>
                  {showRegion ? <td>{row.regionLabel}</td> : null}
                  {isRegionTable ? <td className="num">{formatNumber(row.sections)}</td> : null}
                  <td className={isRegionTable ? "num" : undefined}>
                    {isRegionTable
                      ? formatNumber(row.sectionsWithSac)
                      : row.hasSacChair
                        ? "Yes"
                        : "No"}
                  </td>
                  <td className={isRegionTable ? "num" : undefined}>
                    {isRegionTable
                      ? formatNumber(row.sectionsWithSsr)
                      : row.hasSsr
                        ? "Yes"
                        : "No"}
                  </td>
                  <td className="num">{formatNumber(row.members)}</td>
                  <td className="num">{formatNumber(row.branches)}</td>
                  <td className="num">{formatNumber(row.withOfficers)}</td>
                  <td className="num">{formatNumber(row.withCounselor)}</td>
                  <td className="num">{formatNumber(row.reportedEvents)}</td>
                  {standingCells(row.standings)}
                  {showRebate ? (
                    <td className={standingColumns.length > 0 ? "num after-vitality" : "num"}>{formatUsd(row.foregone)}</td>
                  ) : null}
                  <td className={immediateClass}>{formatNumber(row.immediate)}</td>
                </tr>
              ))}
              {bottomSpacerHeight > 0 ? (
                <tr key="__bottom_spacer" style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true">
                  <td
                    colSpan={columnCount}
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
              {isRegionTable ? <td className="num">{formatNumber(totals.sections)}</td> : null}
              <td className={isRegionTable ? "num" : undefined}>
                {isRegionTable
                  ? formatNumber(totals.sectionsWithSac)
                  : `${formatNumber(totals.sectionsWithSac)} / ${formatNumber(totals.sections)}`}
              </td>
              <td className={isRegionTable ? "num" : undefined}>
                {isRegionTable
                  ? formatNumber(totals.sectionsWithSsr)
                  : `${formatNumber(totals.sectionsWithSsr)} / ${formatNumber(totals.sections)}`}
              </td>
              <td className="num">{formatNumber(totals.members)}</td>
              <td className="num">{formatNumber(totals.branches)}</td>
              <td className="num">{formatNumber(totals.withOfficers)}</td>
              <td className="num">{formatNumber(totals.withCounselor)}</td>
              <td className="num">{formatNumber(totals.reportedEvents)}</td>
              {standingCells(totals.standings)}
              {showRebate ? (
                <td className={standingColumns.length > 0 ? "num after-vitality" : "num"}>{formatUsd(totals.foregone)}</td>
              ) : null}
              <td className={immediateClass}>{formatNumber(totals.immediate)}</td>
            </tr>
          </tfoot>
        ) : null}
      </table>
      </TableScroll>
    </div>
  );
}
