import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HelpPage } from "../pages/HelpPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { AppStateProvider } from "../state/AppState";
import { ExportSteps } from "./ExportSteps";

describe("ExportSteps and HelpPage", () => {
  it("links to the Student Branch Vitality Dashboard and omits MGA SAC SB Vitality Report", () => {
    const stepsHtml = renderToStaticMarkup(createElement(ExportSteps));
    expect(stepsHtml).toContain(
      'href="https://app.smartsheet.com/b/publish?EQBCT=d178a832bd6042259336792c9175f706"',
    );
    expect(stepsHtml).not.toContain("d17a8a32bd6042259336792c9175f706");
    expect(stepsHtml).not.toContain("b2ea86b9-e778-4cb3-b56f-2abe4e3f7037");
    expect(stepsHtml).not.toContain("MGA SAC SB Vitality Report");
  });

  it("renders HelpPage and OnboardingPage without MGA SAC SB Vitality Report references", () => {
    const helpHtml = renderToStaticMarkup(
      createElement(
        AppStateProvider,
        null,
        createElement(MemoryRouter, { initialEntries: ["/how-to-export"] }, createElement(HelpPage)),
      ),
    );
    const onboardingHtml = renderToStaticMarkup(
      createElement(
        AppStateProvider,
        null,
        createElement(MemoryRouter, { initialEntries: ["/"] }, createElement(OnboardingPage)),
      ),
    );

    expect(helpHtml).toContain('class="help-actions"');
    expect(helpHtml).not.toContain("MGA SAC SB Vitality Report");
    expect(helpHtml).not.toContain("b2ea86b9-e778-4cb3-b56f-2abe4e3f7037");
    expect(helpHtml).not.toContain("—");
    expect(onboardingHtml).not.toContain("MGA SAC SB Vitality Report");
    expect(onboardingHtml).not.toContain("b2ea86b9-e778-4cb3-b56f-2abe4e3f7037");
    expect(onboardingHtml).not.toContain("—");
  });

  it("spaces the back button below the export steps in CSS", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
    expect(css).toMatch(/\.help-actions\s*\{\s*margin-top:\s*1\.5rem;\s*\}/);
  });
});

