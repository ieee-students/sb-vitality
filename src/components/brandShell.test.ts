import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppStateProvider } from "../state/AppState";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MetaNav } from "./MetaNav";

describe("IEEE global brand shell", () => {
  it("renders all required IEEE MetaNav links", () => {
    const html = renderToStaticMarkup(createElement(MetaNav));
    expect(html).toContain('href="https://www.ieee.org/index.html"');
    expect(html).toContain('href="https://www.ieeexplore.ieee.org/Xplore/guesthome.jsp"');
    expect(html).toContain('href="https://standards.ieee.org/"');
    expect(html).toContain('href="https://spectrum.ieee.org/"');
    expect(html).toContain('href="https://www.ieee.org/sitemap.html"');
    expect(html).toContain('href="https://www.ieee.org/membership/join/index.html?WT.mc_id=hc_join"');
    expect(html).toContain('href="https://www.ieee.org/give"');
  });

  it("renders the SB Vitality × IEEE Students brand lockup in Header", () => {
    const html = renderToStaticMarkup(
      createElement(
        AppStateProvider,
        null,
        createElement(MemoryRouter, { initialEntries: ["/"] }, createElement(Header)),
      ),
    );
    expect(html).toContain("SB Vitality");
    expect(html).toContain("/sb-vitality/ieee-students.png");
    expect(html).toContain('alt="IEEE Students"');
  });

  it("renders all mandatory IEEE compliance footer links and charity statement", () => {
    const html = renderToStaticMarkup(createElement(Footer));
    const currentYear = String(new Date().getFullYear());
    expect(html).toContain("http://www.ieee.org/index.html");
    expect(html).toContain("http://www.ieee.org/sitemap.html");
    expect(html).toContain("http://www.ieee.org/about/contact_center/index.html");
    expect(html).toContain("http://www.ieee.org/accessibility_statement.html");
    expect(html).toContain("http://www.ieee.org/p9-26.html");
    expect(html).toContain("http://ieee-ethics-reporting.org/");
    expect(html).toContain("http://www.ieee.org/security_privacy.html");
    expect(html).toContain("https://www.ieee.org/about/help/site-terms-conditions.html");
    expect(html).toContain("https://www.ieee.org/about/feedback-ieee-site.html");
    expect(html).toContain(`Copyright ${currentYear} IEEE - All rights reserved.`);
    expect(html).toContain("advancing technology for the benefit of humanity.");
  });

  it("wires official IEEE favicons and webmanifest in index.html", () => {
    const index = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/site.webmanifest"), "utf8")) as {
      icons: Array<{ src: string }>;
      theme_color: string;
    };
    expect(index).toContain('href="/apple-touch-icon.png"');
    expect(index).toContain('href="/favicon-32x32.png"');
    expect(index).toContain('href="/favicon-16x16.png"');
    expect(index).toContain('href="/favicon.ico"');
    expect(index).toContain('href="/site.webmanifest"');
    expect(index).toContain('href="/safari-pinned-tab.svg"');
    expect(index).toContain('content="/mstile-150x150.png"');
    expect(index).not.toContain("%BASE_URL%");
    expect(index).toContain('content="#00629b"');
    expect(manifest.theme_color).toBe("#00629b");
    expect(manifest.icons.map((icon) => icon.src)).toEqual([
      "./android-chrome-192x192.png",
      "./android-chrome-512x512.png",
    ]);
  });
});

