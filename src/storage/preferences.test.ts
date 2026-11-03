import { beforeEach, describe, expect, it } from "vitest";
import {
  readIgnoreAnnualPlan,
  readShowRebate,
  writeIgnoreAnnualPlan,
  writeShowRebate,
} from "./preferences";

function installStorage(): void {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    },
  });
}

describe("ui preferences", () => {
  beforeEach(() => {
    installStorage();
  });

  it("defaults the annual plan to ignored and rebate amounts to hidden", () => {
    expect(readIgnoreAnnualPlan()).toBe(true);
    expect(readShowRebate()).toBe(false);
  });

  it("treats a missing rebate flag as hidden when an older preference is stored", () => {
    localStorage.setItem("sb-vitality-ui", JSON.stringify({ ignoreAnnualPlan: false }));
    expect(readIgnoreAnnualPlan()).toBe(false);
    expect(readShowRebate()).toBe(false);
  });

  it("keeps the other flag when one is saved", () => {
    writeIgnoreAnnualPlan(false);
    writeShowRebate(true);
    expect(readIgnoreAnnualPlan()).toBe(false);
    expect(readShowRebate()).toBe(true);

    writeIgnoreAnnualPlan(true);
    expect(readShowRebate()).toBe(true);
    expect(JSON.parse(localStorage.getItem("sb-vitality-ui") ?? "{}")).toEqual({
      ignoreAnnualPlan: true,
      showRebate: true,
    });
  });
});
