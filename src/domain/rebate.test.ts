import { describe, expect, it } from "vitest";
import { sbAllowance, sectionStudentPortion, splitRebate } from "./rebate";

describe("student branch rebate", () => {
  it("uses the $50 base under 50 members and the $100 base at 50", () => {
    expect(sbAllowance(0)).toBe(50);
    expect(sbAllowance(20)).toBe(90);
    expect(sbAllowance(49)).toBe(148);
    expect(sbAllowance(50)).toBe(200);
    expect(sbAllowance(64)).toBe(228);
    expect(sbAllowance(null)).toBeNull();
  });

  it("pays the allowance only in good standing and leaves incomplete rows unknown", () => {
    expect(splitRebate(90, "good")).toEqual({ expectedRebate: 90, foregoneRebate: 0 });
    expect(splitRebate(90, "needs-support")).toEqual({ expectedRebate: 0, foregoneRebate: 90 });
    expect(splitRebate(90, "inactive")).toEqual({ expectedRebate: 0, foregoneRebate: 90 });
    expect(splitRebate(90, "incomplete")).toEqual({ expectedRebate: null, foregoneRebate: null });
    expect(splitRebate(null, "good")).toEqual({ expectedRebate: null, foregoneRebate: null });
  });
});

describe("section student portion", () => {
  it("is $3 per member and is not folded into the branch allowance", () => {
    expect(sectionStudentPortion(10)).toBe(30);
    expect(sectionStudentPortion(0)).toBe(0);
    expect(sectionStudentPortion(null)).toBeNull();
    expect(sectionStudentPortion(20)).not.toBe(sbAllowance(20));
  });
});
