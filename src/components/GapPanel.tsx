import { formatNumber } from "../domain/format";
import type { CycleGapSummary, GapCounts } from "../domain/types";

export function GapPanel({
  cycleGaps,
  gaps,
  openYear = 2027,
  planExcluded = false,
}: {
  cycleGaps?: CycleGapSummary[];
  gaps?: GapCounts;
  openYear?: number;
  planExcluded?: boolean;
}) {
  const cycles = cycleGaps ?? [];
  const hasMultipleCycles = cycles.length > 1;

  // Single-year fallback when cycleGaps is not provided
  if (!hasMultipleCycles) {
    const fallbackGaps = gaps ?? {
      onlyMembers: 0,
      onlyEvents: 0,
      onlyOfficers: 0,
      onlyPlan: 0,
      missingTwo: 0,
      missingThree: 0,
      missingFour: 0,
      multiple: 0,
      incomplete: 0,
      good: 0,
    };

    const rows = [
      { label: "Under 12 members", count: fallbackGaps.onlyMembers },
      { label: "Fewer than 4 events", count: fallbackGaps.onlyEvents },
      { label: "No reported officers", count: fallbackGaps.onlyOfficers },
      ...(planExcluded ? [] : [{ label: "Annual plan not submitted", count: fallbackGaps.onlyPlan }]),
      { label: "2 requirements missing", count: fallbackGaps.missingTwo },
      ...(planExcluded
        ? [{ label: "All 3 requirements missing", count: fallbackGaps.missingThree }]
        : [
            { label: "3 requirements missing", count: fallbackGaps.missingThree },
            { label: "All 4 requirements missing", count: fallbackGaps.missingFour },
          ]),
      { label: "Incomplete data", count: fallbackGaps.incomplete },
    ];
    const max = Math.max(...rows.map((row) => row.count), 1);

    return (
      <section className="panel">
        <h2>Why branches miss {openYear}</h2>
        <p className="panel-lead">
          {planExcluded
            ? "The annual plan is excluded from this breakdown."
            : "Each branch is counted once, for the open cycle."}
        </p>
        <ul className="gap-list">
          {rows.map((row) => (
            <li key={row.label}>
              <span>{row.label}</span>
              <span className="gap-track" aria-hidden="true">
                <span className="gap-bar" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <strong>{formatNumber(row.count)}</strong>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Multi-cycle comparison table view
  type TableVal = { value: number } | { text: string; title: string };

  interface TableRowDef {
    label: string;
    getVal: (c: CycleGapSummary) => TableVal;
  }

  const tableRows: TableRowDef[] = [
    {
      label: "Under 12 members",
      getVal: (c) => ({ value: c.gaps.onlyMembers }),
    },
    {
      label: "Fewer than 4 events",
      getVal: (c) => ({ value: c.gaps.onlyEvents }),
    },
    {
      label: "No reported officers",
      getVal: (c) =>
        c.officersEvaluated
          ? { value: c.gaps.onlyOfficers }
          : { text: "N/A*", title: "Historical officer data is not in the CSV export." },
    },
    {
      label: "Annual plan not submitted",
      getVal: (c) =>
        c.planExcluded
          ? { text: "Excluded*", title: "The open cycle annual plan is excluded by the checkbox." }
          : { value: c.gaps.onlyPlan },
    },
    {
      label: "2 requirements missing",
      getVal: (c) => ({ value: c.gaps.missingTwo }),
    },
    {
      label: "3 requirements missing",
      getVal: (c) => ({ value: c.gaps.missingThree }),
    },
    {
      label: "All 4 requirements missing",
      getVal: (c) =>
        c.planExcluded || !c.officersEvaluated
          ? { text: "—", title: "Only 3 requirements are evaluated for this cycle." }
          : { value: c.gaps.missingFour },
    },
    {
      label: "Incomplete data",
      getVal: (c) => ({ value: c.gaps.incomplete }),
    },
  ];

  // Maximum value per cycle for mini progress bars
  const maxByCycle = cycles.reduce<Record<number, number>>((acc, c) => {
    const counts = [
      c.gaps.onlyMembers,
      c.gaps.onlyEvents,
      c.officersEvaluated ? c.gaps.onlyOfficers : 0,
      c.planExcluded ? 0 : c.gaps.onlyPlan,
      c.gaps.missingTwo,
      c.gaps.missingThree,
      c.planExcluded || !c.officersEvaluated ? 0 : c.gaps.missingFour,
      c.gaps.incomplete,
    ];
    acc[c.cycle.rebateYear] = Math.max(...counts, 1);
    return acc;
  }, {});

  return (
    <section className="panel">
      <h2>Why branches miss</h2>
      <p className="panel-lead">
        {planExcluded
          ? "Comparing requirement gaps across cycles. The open cycle annual plan is excluded."
          : "Comparing requirement gaps across cycles. Each branch is counted once per cycle."}
      </p>
      <div className="gap-table-wrap">
        <table className="gap-table">
          <thead>
            <tr>
              <th scope="col">Requirement</th>
              {cycles.map((c) => (
                <th key={c.cycle.rebateYear} scope="col" className="num">
                  {c.cycle.rebateYear}
                  {c.cycle.kind === "open" ? (
                    <span className="gap-year-tag"> proj</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {cycles.map((c) => {
                  const cell = row.getVal(c);
                  const year = c.cycle.rebateYear;
                  const maxVal = maxByCycle[year] ?? 1;

                  if ("text" in cell) {
                    return (
                      <td key={year} className="num na-cell" title={cell.title}>
                        {cell.text}
                      </td>
                    );
                  }

                  return (
                    <td key={year} className="num gap-cell">
                      <div className="gap-cell-content">
                        <span className="gap-cell-val">{formatNumber(cell.value)}</span>
                        <span className="gap-mini-track" aria-hidden="true">
                          <span
                            className="gap-mini-bar"
                            style={{ width: `${(cell.value / maxVal) * 100}%` }}
                          />
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="gap-footnote">
        * Historical officer data is not in the CSV export.
        {planExcluded ? ` ${openYear} annual plan is currently excluded.` : ""}
      </p>
    </section>
  );
}
