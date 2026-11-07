import { useState } from "react";
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
  const [showPlanHelp, setShowPlanHelp] = useState(false);
  const [showRebateHelp, setShowRebateHelp] = useState(false);
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
        <div className="scope-toggles" role="group" aria-label="Dashboard options">
          <div className={`plan-toggle ${showPlanHelp ? "help-open" : ""}`}>
            <label className="plan-toggle-control">
              <input
                type="checkbox"
                checked={ignoreAnnualPlan}
                aria-describedby="plan-toggle-help"
                onChange={(event) => setIgnoreAnnualPlan(event.target.checked)}
              />
              <span className="plan-toggle-title">
                <strong>{openYear} annual plan is not due yet</strong>
              </span>
            </label>
            <button
              type="button"
              className="toggle-info-btn"
              aria-expanded={showPlanHelp}
              aria-controls="plan-toggle-help"
              aria-label={`${openYear} annual plan explanation`}
              title="Explain annual plan setting"
              onClick={() => setShowPlanHelp((prev) => !prev)}
            >
              <span aria-hidden="true">ℹ</span>
            </button>
            <small
              id="plan-toggle-help"
              className="toggle-help-text"
            >
              {ignoreAnnualPlan
                ? "The open cycle is judged on members and reported events. Completed cycles still require their plan. Dissolution risk does not use the plan."
                : "The open cycle now requires the annual plan as well. Dissolution risk still does not use the plan."}
            </small>
          </div>
          <div className={`plan-toggle ${showRebateHelp ? "help-open" : ""}`}>
            <label className="plan-toggle-control">
              <input
                type="checkbox"
                checked={showRebate}
                aria-describedby="rebate-toggle-help"
                onChange={(event) => setShowRebate(event.target.checked)}
              />
              <span className="plan-toggle-title">
                <strong>Show approximate rebate information</strong>
              </span>
            </label>
            <button
              type="button"
              className="toggle-info-btn"
              aria-expanded={showRebateHelp}
              aria-controls="rebate-toggle-help"
              aria-label="Rebate information explanation"
              title="Explain rebate setting"
              onClick={() => setShowRebateHelp((prev) => !prev)}
            >
              <span aria-hidden="true">ℹ</span>
            </button>
            <small
              id="rebate-toggle-help"
              className="toggle-help-text"
            >
              Planning estimates only. They are not an official payment.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
