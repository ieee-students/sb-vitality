import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { appBasename } from "./useVitalityRoute";

describe("app basename", () => {
  it("keeps the trailing slash so the home link matches the Vite base", () => {
    expect(appBasename()).toBe("/sb-vitality/");
  });
});

describe("GitHub Pages deep links", () => {
  it("keeps the sb-vitality segment in the 404 redirect and restores it in the app", () => {
    const fallback = readFileSync(resolve(process.cwd(), "public/404.html"), "utf8");
    const index = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(fallback).toContain("pathSegmentsToKeep = 1");
    expect(index).toContain('location.search[1] === "/"');
  });
});
