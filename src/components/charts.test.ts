import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarChart, LineChart } from "./Charts";
import type { ChartPoint } from "../domain/types";

describe("LineChart", () => {
  const memberPoints: ChartPoint[] = [
    { label: "Dec 2024", sum: 208836, missing: 0, yearToDate: false },
    { label: "Dec 2025", sum: 195202, missing: 0, yearToDate: false },
    { label: "Current", sum: 172141, missing: 0, yearToDate: false },
  ];

  const eventPoints: ChartPoint[] = [
    { label: "2024", sum: 22832, missing: 0, yearToDate: false },
    { label: "2025", sum: 24795, missing: 0, yearToDate: false },
    { label: "2026 YTD", sum: 13642, missing: 0, yearToDate: true },
  ];

  it("renders line chart with points and segment growth badges", () => {
    const html = renderToStaticMarkup(
      createElement(LineChart, {
        title: "Student members",
        points: memberPoints,
        tone: "blue",
      }),
    );

    expect(html).toContain("Student members");
    expect(html).toContain("Dec 2024");
    expect(html).toContain("Dec 2025");
    expect(html).toContain("Current");
    expect(html).toContain("208,836");
    expect(html).toContain("195,202");
    expect(html).toContain("172,141");

    // Growth deltas on segments:
    // Dec 2024 -> Dec 2025: -13,634 (-6.5%)
    expect(html).toContain("−13,634");
    expect(html).toContain("−6.5%");

    // Dec 2025 -> Current: -23,061 (-11.8%)
    expect(html).toContain("−23,061");
    expect(html).toContain("−11.8%");
  });

  it("renders positive growth badges and marks year-to-date segments", () => {
    const html = renderToStaticMarkup(
      createElement(LineChart, {
        title: "Reported events",
        points: eventPoints,
        tone: "teal",
      }),
    );

    expect(html).toContain("Reported events");
    expect(html).toContain("2024");
    expect(html).toContain("2025");
    expect(html).toContain("2026 YTD");

    // 2024 -> 2025: +1,963 (+8.6%)
    expect(html).toContain("+1,963");
    expect(html).toContain("+8.6%");

    // 2025 -> 2026 YTD: dashed stroke and YTD tag
    expect(html).toContain("stroke-dasharray=\"5 4\"");
    expect(html).toContain("YTD");
  });

  it("handles a single point safely", () => {
    const html = renderToStaticMarkup(
      createElement(LineChart, {
        title: "Single Year",
        points: [{ label: "2026", sum: 500, missing: 0, yearToDate: false }],
        tone: "blue",
      }),
    );

    expect(html).toContain("Single Year");
    expect(html).toContain("500");
  });

  it("returns null for empty points", () => {
    const html = renderToStaticMarkup(
      createElement(LineChart, {
        title: "Empty",
        points: [],
        tone: "blue",
      }),
    );

    expect(html).toBe("");
  });
});

describe("BarChart backwards-compatibility", () => {
  it("renders a bar chart figure with rects", () => {
    const html = renderToStaticMarkup(
      createElement(BarChart, {
        title: "Legacy members",
        points: [
          { label: "Dec 2024", sum: 100, missing: 0, yearToDate: false },
          { label: "Dec 2025", sum: 120, missing: 0, yearToDate: false },
        ],
        tone: "blue",
      }),
    );

    expect(html).toContain("Legacy members");
    expect(html).toContain("100");
    expect(html).toContain("120");
    expect(html).toContain("<rect");
  });
});
