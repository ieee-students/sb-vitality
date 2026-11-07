import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ScopeBar mobile styles and compact toggles", () => {
  it("includes compact toggle, explanation button, and mobile styles in CSS", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

    // Desktop styles
    expect(css).toContain(".toggle-info-btn");
    expect(css).toContain(".toggle-help-text");
    expect(css).toContain(".plan-toggle-control");
    expect(css).toContain(".plan-toggle-title");

    // Mobile media query styles
    expect(css).toMatch(/@media\s*\(max-width:\s*720px\)/);
    expect(css).toContain(".plan-toggle.help-open .toggle-help-text");
  });
});

