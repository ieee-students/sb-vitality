import { describe, expect, it } from "vitest";
import { assessDissolution, operationalResult } from "./dissolution";
import type { YearActivity } from "./types";

function year(yearNumber: number, members: number | null, events: number | null): YearActivity {
  return { year: yearNumber, members, events };
}

describe("dissolution risk", () => {
  it("does not treat a blank as a failed year", () => {
    expect(operationalResult(null, 0)).toBe("unknown");
    expect(operationalResult(4, null)).toBe("unknown");
    expect(operationalResult(12, 4)).toBe("met");
    expect(operationalResult(11, 4)).toBe("failed");
    expect(operationalResult(12, 3)).toBe("failed");
  });

  it("flags two failed years plus a weak current year as immediate action", () => {
    const assessment = assessDissolution(
      [year(2024, 2, 1), year(2025, 3, 0)],
      year(2026, 4, 0),
    );
    expect(assessment.tier).toBe("immediate");
    expect(assessment.failedYears).toEqual([2024, 2025]);
  });

  it("keeps a two-year warning when the open year is back on track", () => {
    const assessment = assessDissolution(
      [year(2024, 4, 0), year(2025, 5, 1)],
      year(2026, 30, 6),
    );
    expect(assessment.tier).toBe("two-year-warning");
  });

  it("does not call the open year immediate when its inputs are blank", () => {
    const assessment = assessDissolution(
      [year(2024, 4, 0), year(2025, 5, 1)],
      year(2026, null, null),
    );
    expect(assessment.tier).toBe("streak-incomplete");
  });

  it("watches a single failed year", () => {
    const assessment = assessDissolution(
      [year(2024, 40, 6), year(2025, 8, 1)],
      year(2026, 14, 2),
    );
    expect(assessment.tier).toBe("one-year-watch");
  });

  it("calls three adjacent failures the activity test without saying the branch was dissolved", () => {
    const assessment = assessDissolution(
      [year(2023, 1, 0), year(2024, 2, 0), year(2025, 3, 0)],
      year(2026, 4, 0),
    );
    expect(assessment.tier).toBe("dissolution-activity-test");
    expect(assessment.detail).toContain("Notice history is not in this file");
    expect(assessment.detail.toLowerCase()).not.toContain("has been dissolved");
  });

  it("stops the streak when a year was met or the years are not adjacent", () => {
    expect(
      assessDissolution([year(2024, 20, 5), year(2025, 20, 5)], year(2026, 2, 0)).tier,
    ).toBe("on-track");
    expect(
      assessDissolution([year(2022, 1, 0), year(2024, 1, 0), year(2025, 1, 0)], year(2026, 1, 0))
        .failedYears,
    ).toEqual([2024, 2025]);
  });

  it("cannot judge a streak when the latest completed year is blank", () => {
    expect(assessDissolution([year(2024, 1, 0), year(2025, null, 5)], year(2026, 1, 0)).tier).toBe(
      "unknown",
    );
  });
});
