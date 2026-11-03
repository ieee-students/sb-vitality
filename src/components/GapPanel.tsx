import { formatNumber } from "../domain/format";
import type { GapCounts } from "../domain/types";

export function GapPanel({
  gaps,
  openYear,
  planExcluded,
}: {
  gaps: GapCounts;
  openYear: number;
  planExcluded: boolean;
}) {
  const rows = [
    { label: "Members only", count: gaps.onlyMembers },
    { label: "Events only", count: gaps.onlyEvents },
    { label: "Officers only", count: gaps.onlyOfficers },
    ...(planExcluded ? [] : [{ label: "Annual plan only", count: gaps.onlyPlan }]),
    { label: "More than one requirement", count: gaps.multiple },
    { label: "Incomplete data", count: gaps.incomplete },
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
