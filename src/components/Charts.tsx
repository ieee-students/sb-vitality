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
