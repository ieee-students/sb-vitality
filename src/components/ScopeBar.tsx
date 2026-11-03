import { Link } from "react-router-dom";
import { formatWhen } from "../domain/format";
import { resolveView, scopePhrase } from "../domain/scope";
import type { Crumb, Scope } from "../domain/types";
import { useVitalityRoute } from "../routing/useVitalityRoute";
import { useAppState } from "../state/AppState";

function homeCrumbs(scope: Scope): Crumb[] {
  if (scope.level === "mga") return [{ label: "All regions", to: "/" }];
  if (scope.level === "region") return [{ label: scope.regionLabel ?? "Region", to: "/" }];
  return [{ label: scope.sectionName ?? "Section", to: "/" }];
}

export function ScopeBar() {
  const { model, stored, ignoreAnnualPlan, setIgnoreAnnualPlan, showRebate, setShowRebate } = useAppState();
  const { regionCode, sectionSlug } = useVitalityRoute();
  if (!model || !stored) return null;

  const view = resolveView(model.branches, model.scope, regionCode, sectionSlug);
  const crumbs = view.status === "ready" ? view.crumbs : homeCrumbs(model.scope);
  const openYear = model.cycles.open.rebateYear;

  return (
    <div className="scope-bar">
      <div className="scope-inner">
        <nav aria-label="Scope">
          <ol className="crumbs">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`}>
                {crumb.to ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className="scope-meta">
          {scopePhrase(model.scope, model.branches)} · Loaded {formatWhen(stored.importedAt)} ·{" "}
          {stored.fileName}
        </p>
        <div className="scope-toggles">
          <label className="plan-toggle">
            <input
              type="checkbox"
              checked={ignoreAnnualPlan}
              aria-describedby="plan-toggle-help"
              onChange={(event) => setIgnoreAnnualPlan(event.target.checked)}
            />
            <span>
              <strong>{openYear} annual plan is not due yet</strong>
              <small id="plan-toggle-help">
                {ignoreAnnualPlan
                  ? "The open cycle is judged on members and reported events. Completed cycles still require their plan. Dissolution risk does not use the plan."
                  : "The open cycle now requires the annual plan as well. Dissolution risk still does not use the plan."}
              </small>
            </span>
          </label>
          <label className="plan-toggle">
            <input
              type="checkbox"
              checked={showRebate}
              aria-describedby="rebate-toggle-help"
              onChange={(event) => setShowRebate(event.target.checked)}
            />
            <span>
              <strong>Show approximate rebate information</strong>
              <small id="rebate-toggle-help">
                Planning estimates only. They are not an official payment.
              </small>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
