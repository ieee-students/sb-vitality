import { describe, expect, it } from "vitest";
import { normalizeRegion, slugify } from "./regions";

describe("regions", () => {
  it("treats R0 as Region 10", () => {
    expect(normalizeRegion("R0")).toEqual({ code: "R10", label: "Region 10" });
    expect(normalizeRegion("r10")).toEqual({ code: "R10", label: "Region 10" });
    expect(normalizeRegion("Region 10")).toEqual({ code: "R10", label: "Region 10" });
    expect(normalizeRegion("R7")).toEqual({ code: "R7", label: "Region 7" });
    expect(normalizeRegion("")).toEqual({ code: "UNKNOWN", label: "Unknown region" });
  });

  it("slugifies section names", () => {
    expect(slugify("Saudi Arabia Section")).toBe("saudi-arabia-section");
    expect(slugify("St. Mary's Section")).toBe("st-mary-s-section");
  });
});
