export interface NormalizedRegion {
  code: string;
  label: string;
}

export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "unknown";
}

export function normalizeRegion(raw: string): NormalizedRegion {
  const trimmed = raw.trim();
  const compact = trimmed.toUpperCase().replace(/\s+/g, " ");
  if (
    compact === "R0" ||
    compact === "R10" ||
    compact === "REGION 10" ||
    compact === "10"
  ) {
    return { code: "R10", label: "Region 10" };
  }

  const regionWord = compact.match(/^REGION\s+(\d{1,2})$/);
  const short = compact.match(/^R(\d{1,2})$/);
  const digits = compact.match(/^(\d{1,2})$/);
  const number = regionWord?.[1] ?? short?.[1] ?? digits?.[1];
  if (number) {
    const parsed = Number(number);
    if (parsed === 0 || parsed === 10) return { code: "R10", label: "Region 10" };
    return { code: `R${parsed}`, label: `Region ${parsed}` };
  }

  if (!trimmed) return { code: "UNKNOWN", label: "Unknown region" };
  return { code: compact.replace(/\s+/g, "-"), label: trimmed };
}

export function regionToParam(code: string): string {
  return code.toLowerCase();
}

export function sectionPath(regionCode: string, sectionSlug: string): string {
  return `/${regionToParam(regionCode)}/${sectionSlug}`;
}
