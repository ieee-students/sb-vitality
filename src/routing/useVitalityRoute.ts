import { useLocation } from "react-router-dom";

export function useVitalityRoute(): { regionCode?: string; sectionSlug?: string } {
  const { pathname } = useLocation();
  const [regionCode, sectionSlug] = pathname.split("/").filter(Boolean);
  if (!regionCode || regionCode === "how-to-export") return {};
  return { regionCode, sectionSlug };
}

export function appBasename(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}
