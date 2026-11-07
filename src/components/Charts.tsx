import { formatNumber } from "../domain/format";
import type { ChartPoint } from "../domain/types";

export function BarChart({ title, points, tone }: { title: string; points: ChartPoint[]; tone: "blue" | "teal" }) {
  const width = 360;
  const height = 180;
  const gap = 18;
  const max = Math.max(...points.map((point) => point.sum), 1);
  const barWidth = points.length > 0 ? (width - gap * (points.length + 1)) / points.length : 0;
  const summary = points.map((point) => `${point.label} ${formatNumber(point.sum)}`).join(", ");

  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <svg role="img" aria-label={`${title}: ${summary}`} viewBox={`0 0 ${width} ${height}`}>
        {points.map((point, index) => {
          const barHeight = Math.max((point.sum / max) * 120, point.sum > 0 ? 4 : 0);
          const x = gap + index * (barWidth + gap);
          const y = 142 - barHeight;
          const fill = point.yearToDate || tone === "teal" ? "#009CA6" : "#00629B";
          return (
            <g key={point.label}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill={fill} />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="chart-value">
                {formatNumber(point.sum)}
              </text>
              <text x={x + barWidth / 2} y={166} textAnchor="middle" className="chart-label">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function LineChart({
  title,
  points,
  tone,
}: {
  title: string;
  points: ChartPoint[];
  tone: "blue" | "teal";
}) {
  const width = 380;
  const height = 195;
  const padLeft = 48;
  const padRight = 48;
  const padTop = 32;
  const padBottom = 42;
  const plotHeight = height - padTop - padBottom;
  const baselineY = height - padBottom;

  if (points.length === 0) return null;

  const strokeColor = tone === "blue" ? "#00629B" : "#009CA6";
  const gradientId = `chart-grad-${tone}`;

  const sums = points.map((p) => p.sum);
  const minVal = Math.min(...sums);
  const maxVal = Math.max(...sums);
  const valSpan = maxVal - minVal;
  const effectiveSpan = valSpan === 0 ? (maxVal > 0 ? maxVal * 0.25 : 1) : valSpan;

  const minBound = Math.max(0, minVal - effectiveSpan * 0.35);
  const maxBound = maxVal + effectiveSpan * 0.25;
  const boundRange = Math.max(maxBound - minBound, 1);

  const coords = points.map((p, i) => {
    const x =
      points.length === 1
        ? width / 2
        : padLeft + (i / (points.length - 1)) * (width - padLeft - padRight);
    const y = padTop + plotHeight * (1 - (p.sum - minBound) / boundRange);
    return { x, y, point: p };
  });

  const areaPath =
    coords.length > 1
      ? `M ${coords[0].x} ${coords[0].y} ` +
        coords
          .slice(1)
          .map((c) => `L ${c.x} ${c.y}`)
          .join(" ") +
        ` L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`
      : "";

  const summary = points.map((point) => `${point.label} ${formatNumber(point.sum)}`).join(", ");

  return (
    <figure className="chart chart-line-figure">
      <figcaption>{title}</figcaption>
      <svg role="img" aria-label={`${title}: ${summary}`} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.16" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}

        {coords.slice(0, -1).map((start, i) => {
          const end = coords[i + 1];
          const isDashed = Boolean(end.point.yearToDate);
          return (
            <line
              key={`seg-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={strokeColor}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeDasharray={isDashed ? "5 4" : undefined}
            />
          );
        })}

        {coords.slice(0, -1).map((start, i) => {
          const end = coords[i + 1];
          const xMid = (start.x + end.x) / 2;
          const rawYMid = (start.y + end.y) / 2;
          const yMid = Math.max(padTop + 12, Math.min(baselineY - 14, rawYMid));

          const diff = end.point.sum - start.point.sum;
          const pct = start.point.sum > 0 ? (diff / start.point.sum) * 100 : 0;
          const isYtd = Boolean(end.point.yearToDate);

          const diffFormatted = `${diff >= 0 ? "+" : "−"}${formatNumber(Math.abs(diff))}`;
          const pctFormatted = isYtd
            ? `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(0)}% YTD`
            : `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`;
          const badgeText = `${diffFormatted} (${pctFormatted})`;

          const isUp = diff > 0;
          const isDown = diff < 0;

          const textColor = isYtd
            ? "#007377"
            : isUp
              ? "#007a3d"
              : isDown
                ? "#c5221f"
                : "#495057";
          const borderColor = isYtd
            ? "#bee5eb"
            : isUp
              ? "#b7eb8f"
              : isDown
                ? "#ffa39e"
                : "#e9ecef";

          const badgeW = Math.max(badgeText.length * 5.9 + 14, 76);

          return (
            <g key={`badge-${i}`} className="chart-growth-badge">
              <rect
                x={xMid - badgeW / 2}
                y={yMid - 9.5}
                width={badgeW}
                height={19}
                rx={9.5}
                fill="#ffffff"
                stroke={borderColor}
                strokeWidth="1"
              />
              <text
                x={xMid}
                y={yMid + 3.5}
                textAnchor="middle"
                fontSize="9.5"
                fontFamily="var(--font, -apple-system, BlinkMacSystemFont, sans-serif)"
                fontWeight="600"
                fill={textColor}
              >
                {badgeText}
              </text>
            </g>
          );
        })}

        {coords.map((c) => (
          <g key={c.point.label}>
            <circle
              cx={c.x}
              cy={c.y}
              r="4.5"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <text
              x={c.x}
              y={c.y - 9}
              textAnchor="middle"
              className="chart-value"
              fontWeight="700"
              fontSize="11"
            >
              {formatNumber(c.point.sum)}
            </text>
            <text
              x={c.x}
              y={174}
              textAnchor="middle"
              className="chart-label"
              fontSize="11"
              fill="var(--navy, #002855)"
            >
              {c.point.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
