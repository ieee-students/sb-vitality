import { CsvFormatError } from "./errors";
import { normalizeRegion, regionToParam, sectionPath } from "./regions";
import type { Branch, Crumb, Scope } from "./types";

export function detectScope(branches: Branch[]): Scope {
  if (branches.length === 0) {
    throw new CsvFormatError("This CSV has no student branch rows.");
  }

  const sectionKeys = new Set(branches.map((branch) => `${branch.regionCode}\u0000${branch.sectionName}`));
  const regionCodes = new Set(branches.map((branch) => branch.regionCode));
  if (sectionKeys.size === 1) {
    const branch = branches[0];
    return {
      level: "section",
      regionCode: branch.regionCode,
      regionLabel: branch.regionLabel,
      sectionName: branch.sectionName,
      sectionSlug: branch.sectionSlug,
    };
  }
  if (regionCodes.size === 1) {
    const branch = branches[0];
    return {
      level: "region",
      regionCode: branch.regionCode,
      regionLabel: branch.regionLabel,
      sectionName: null,
      sectionSlug: null,
    };
  }
  return {
    level: "mga",
    regionCode: null,
    regionLabel: null,
    sectionName: null,
    sectionSlug: null,
  };
}

export function scopePhrase(scope: Scope, branches: Branch[]): string {
  if (scope.level === "mga") {
    const regions = new Set(branches.map((branch) => branch.regionCode)).size;
    return `MGA file · ${regions} ${regions === 1 ? "region" : "regions"}`;
  }
  if (scope.level === "region") return `Region file · ${scope.regionLabel}`;
  return `Section file · ${scope.sectionName}`;
}

export interface ReadyView {
  status: "ready";
  level: Scope["level"];
  title: string;
  branches: Branch[];
  regionCode: string | null;
  regionLabel: string | null;
  sectionName: string | null;
  sectionSlug: string | null;
  crumbs: Crumb[];
}

export interface BlockedView {
  status: "outside-file" | "missing";
  message: string;
  backTo: string;
  backLabel: string;
}

export type ViewResolution = ReadyView | BlockedView;

function outside(scope: Scope): BlockedView {
  const message =
    scope.level === "section"
      ? `This file only includes ${scope.sectionName} in ${scope.regionLabel}.`
      : scope.level === "region"
        ? `This file only includes ${scope.regionLabel}.`
        : "That page is outside this file.";
  return {
    status: "outside-file",
    message,
    backTo: "/",
    backLabel: "Back to your file",
  };
}

export function resolveView(
  branches: Branch[],
  scope: Scope,
  regionParam?: string,
  sectionParam?: string,
): ViewResolution {
  if (!regionParam) {
    if (scope.level === "mga") {
      return {
        status: "ready",
        level: "mga",
        title: "All regions",
        branches,
        regionCode: null,
        regionLabel: null,
        sectionName: null,
        sectionSlug: null,
        crumbs: [{ label: "All regions", to: null }],
      };
    }
    if (scope.level === "region") {
      const regionBranches = branches.filter((branch) => branch.regionCode === scope.regionCode);
      return {
        status: "ready",
        level: "region",
        title: scope.regionLabel ?? "Region",
        branches: regionBranches,
        regionCode: scope.regionCode,
        regionLabel: scope.regionLabel,
        sectionName: null,
        sectionSlug: null,
        crumbs: [{ label: scope.regionLabel ?? "Region", to: null }],
      };
    }
    const sectionBranches = branches.filter(
      (branch) => branch.regionCode === scope.regionCode && branch.sectionSlug === scope.sectionSlug,
    );
    return {
      status: "ready",
      level: "section",
      title: scope.sectionName ?? "Section",
      branches: sectionBranches,
      regionCode: scope.regionCode,
      regionLabel: scope.regionLabel,
      sectionName: scope.sectionName,
      sectionSlug: scope.sectionSlug,
      crumbs: [{ label: scope.sectionName ?? "Section", to: null }],
    };
  }

  const wanted = normalizeRegion(regionParam);
  const regionBranches = branches.filter((branch) => branch.regionCode === wanted.code);
  if (scope.level === "section" && scope.regionCode !== wanted.code) return outside(scope);
  if (scope.level === "region" && scope.regionCode !== wanted.code) return outside(scope);
  if (regionBranches.length === 0) {
    if (scope.level !== "mga") return outside(scope);
    return {
      status: "missing",
      message: "That region isn't in this file.",
      backTo: "/",
      backLabel: "All regions",
    };
  }

  const regionLabel = regionBranches[0].regionLabel;
  const regionTo = `/${regionToParam(wanted.code)}`;

  if (!sectionParam) {
    if (scope.level === "section") return outside(scope);
    const crumbs: Crumb[] =
      scope.level === "mga"
        ? [
            { label: "All regions", to: "/" },
            { label: regionLabel, to: null },
          ]
        : [{ label: regionLabel, to: null }];
    return {
      status: "ready",
      level: "region",
      title: regionLabel,
      branches: regionBranches,
      regionCode: wanted.code,
      regionLabel,
      sectionName: null,
      sectionSlug: null,
      crumbs,
    };
  }

  const sectionBranches = regionBranches.filter(
    (branch) => branch.sectionSlug.toLowerCase() === sectionParam.toLowerCase(),
  );
  if (sectionBranches.length === 0) {
    if (scope.level === "section") return outside(scope);
    return {
      status: "missing",
      message: "That section isn't in this file.",
      backTo: regionTo,
      backLabel: regionLabel,
    };
  }
  if (scope.level === "section" && scope.sectionSlug !== sectionBranches[0].sectionSlug) {
    return outside(scope);
  }

  const sectionName = sectionBranches[0].sectionName;
  const sectionSlug = sectionBranches[0].sectionSlug;
  const crumbs: Crumb[] =
    scope.level === "mga"
      ? [
          { label: "All regions", to: "/" },
          { label: regionLabel, to: regionTo },
          { label: sectionName, to: null },
        ]
      : scope.level === "region"
        ? [
            { label: regionLabel, to: regionTo },
            { label: sectionName, to: null },
          ]
        : [{ label: sectionName, to: null }];

  return {
    status: "ready",
    level: "section",
    title: sectionName,
    branches: sectionBranches,
    regionCode: wanted.code,
    regionLabel,
    sectionName,
    sectionSlug,
    crumbs,
  };
}

export function canonicalRegionParam(regionParam: string): string {
  return regionToParam(normalizeRegion(regionParam).code);
}

export { sectionPath };
