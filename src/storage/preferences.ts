const KEY = "sb-vitality-ui";

interface UiPreferences {
  ignoreAnnualPlan?: boolean;
  showRebate?: boolean;
}

function readPreferences(): UiPreferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UiPreferences;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writePreferences(patch: UiPreferences): void {
  const current = readPreferences();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}

export function readIgnoreAnnualPlan(): boolean {
  return readPreferences().ignoreAnnualPlan !== false;
}

export function readShowRebate(): boolean {
  return readPreferences().showRebate === true;
}

export function writeIgnoreAnnualPlan(value: boolean): void {
  writePreferences({ ignoreAnnualPlan: value });
}

export function writeShowRebate(value: boolean): void {
  writePreferences({ showRebate: value });
}
