import { dissolutionLabel, standingLabel } from "../domain/format";
import type { DissolutionTier, Standing } from "../domain/types";

export function StatusPill({ standing }: { standing: Standing }) {
  return <span className={`status status-${standing}`}>{standingLabel(standing)}</span>;
}

export function RiskPill({ tier }: { tier: DissolutionTier }) {
  return <span className={`status risk-${tier}`}>{dissolutionLabel(tier)}</span>;
}
