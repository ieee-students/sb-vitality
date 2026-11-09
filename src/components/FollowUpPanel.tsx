import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { formatNumber, formatUsd } from "../domain/format";
import { anchorFor } from "../domain/metrics";
import { sectionPath } from "../domain/regions";
import type { ActItem, BranchEvaluation, DissolutionTier, ScopeLevel } from "../domain/types";
import { RiskPill } from "./StatusPill";
import { VISIBLE_TABLE_ROWS } from "./TableScroll";

export const VISIBLE_FOLLOWUP_ITEMS = VISIBLE_TABLE_ROWS;

const TILES: { tier: DissolutionTier; label: string }[] = [
  { tier: "immediate", label: "Immediate action" },
  { tier: "two-year-warning", label: "Two-year warning" },
  { tier: "one-year-watch", label: "One-year watch" },
  { tier: "dissolution-activity-test", label: "Activity test met" },
];

type FollowUpTab = "risk" | "act";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function setCssVar(element: HTMLElement, name: string, value: string) {
  if (element.style.getPropertyValue(name) !== value) {
    element.style.setProperty(name, value);
  }
}

function FollowUpListScroll({
  labelId,
  itemCount,
  maxVisibleItems = VISIBLE_FOLLOWUP_ITEMS,
  children,
}: {
  labelId: string;
  itemCount: number;
  maxVisibleItems?: number;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const capped = itemCount > maxVisibleItems;

  useIsomorphicLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (!capped) {
      container.style.removeProperty("--followup-max-block-size");
      return;
    }

    let lastInlineSize = -1;
    let frame = 0;

    const measure = () => {
      const list = container.querySelector("ul, ol");
      if (!list || list.children.length <= maxVisibleItems) {
        container.style.removeProperty("--followup-max-block-size");
        return;
      }
      const firstTop = list.children[0].getBoundingClientRect().top;
      const lastVisibleBottom = list.children[maxVisibleItems - 1].getBoundingClientRect().bottom;
      const computed = window.getComputedStyle(container);
      const paddingBlock =
        (Number.parseFloat(computed.paddingTop) || 0) +
        (Number.parseFloat(computed.paddingBottom) || 0);
      const borderBlock = Math.max(0, container.offsetHeight - container.clientHeight);
      const rowsHeight = Math.max(0, lastVisibleBottom - firstTop);
      const total = Math.round(rowsHeight + paddingBlock + borderBlock);

      const currentVal = parseFloat(container.style.getPropertyValue("--followup-max-block-size"));
      if (Number.isNaN(currentVal) || Math.abs(currentVal - total) > 1) {
        setCssVar(container, "--followup-max-block-size", `${total}px`);
      }
    };

    measure();
    lastInlineSize = container.clientWidth;

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const currentWidth = entry?.contentRect?.width ?? container.clientWidth;
      if (lastInlineSize >= 0 && Math.abs(currentWidth - lastInlineSize) < 1) {
        return;
      }
      lastInlineSize = currentWidth;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [capped, maxVisibleItems, itemCount, children]);

  return (
    <div
      ref={scrollRef}
      tabIndex={capped ? 0 : undefined}
      role={capped ? "region" : undefined}
      aria-labelledby={capped ? labelId : undefined}
      className={capped ? "followup-scroll followup-scroll-capped" : "followup-scroll"}
    >
      {children}
    </div>
  );
}

export function FollowUpPanel({
  counts,
  urgent,
  acts,
  level,
  showRebate,
  defaultTab = "risk",
  onSelectAnchor,
}: {
  counts: Record<DissolutionTier, number>;
  urgent: BranchEvaluation[];
  acts: ActItem[];
  level: ScopeLevel;
  showRebate: boolean;
  defaultTab?: FollowUpTab;
  onSelectAnchor?: (anchorId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<FollowUpTab>(defaultTab);
  const headingId = useId();
  const riskTabId = useId();
  const actTabId = useId();
  const riskPanelId = useId();
  const actPanelId = useId();
  const riskTabRef = useRef<HTMLButtonElement>(null);
  const actTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showRebate) {
      setActiveTab("risk");
    }
  }, [showRebate]);

  const currentTab: FollowUpTab = showRebate ? activeTab : "risk";

  function selectTab(next: FollowUpTab, focus = false) {
    setActiveTab(next);
    if (!focus) return;
    if (next === "risk") riskTabRef.current?.focus();
    else actTabRef.current?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!showRebate) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(currentTab === "risk" ? "act" : "risk", true);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab("risk", true);
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab("act", true);
    }
  }

  const riskBody = (
    <>
      <p className="panel-lead">
        Membership and meetings only. A branch is on this list when completed years were missed. The annual
        plan is not part of the test, and this file does not show whether a delinquency notice was sent.
      </p>
      <div className="risk-grid">
        {TILES.map((tile) => (
          <article key={tile.tier}>
            <h3>{tile.label}</h3>
            <p>{formatNumber(counts[tile.tier])}</p>
          </article>
        ))}
      </div>
      {counts["streak-incomplete"] > 0 ? (
        <p className="panel-lead">
          {formatNumber(counts["streak-incomplete"])} more{" "}
          {counts["streak-incomplete"] === 1 ? "branch has" : "branches have"} a multi-year failure with
          incomplete data for this year.
        </p>
      ) : null}
      {urgent.length === 0 ? (
        <p>No branches in this view are on the dissolution watchlist.</p>
      ) : (
        <>
          <FollowUpListScroll labelId={showRebate ? riskTabId : headingId} itemCount={urgent.length}>
            {/* Safari strips list semantics when list-style: none or grid is applied without role="list" */}
            <ul className="urgent-list" role="list">
              {urgent.map((item) => {
                const anchor = anchorFor(item.branch);
                const sectionHref = `${sectionPath(item.branch.regionCode, item.branch.sectionSlug)}#${anchor}`;
                return (
                  <li key={`${item.branch.spoid}-${item.branch.schoolName}`}>
                    <div className="urgent-head">
                      <div className="urgent-title-group">
                        <a
                          href={`#${anchor}`}
                          className="urgent-link"
                          onClick={() => onSelectAnchor?.(anchor)}
                        >
                          {item.branch.schoolName}
                        </a>
                        <span>
                          {level === "section" ? (
                            item.branch.sectionName
                          ) : (
                            <Link to={sectionHref}>{item.branch.sectionName}</Link>
                          )} · {item.branch.regionLabel}
                        </span>
                      </div>
                      <RiskPill tier={item.dissolution.tier} />
                    </div>
                    <p className="urgent-detail">{item.dissolution.detail}</p>
                  </li>
            );
              })}
          </ul>
        </FollowUpListScroll>
      {urgent.length > VISIBLE_FOLLOWUP_ITEMS ? (
        <p className="followup-scroll-note">
          Showing {VISIBLE_FOLLOWUP_ITEMS} at a time — scroll to see all {formatNumber(urgent.length)}{" "}
          branches on the watchlist.
        </p>
      ) : null}
    </>
  )
}
    </>
  );

const actBody = (
  <>
    <p className="panel-lead">
      Student branches with the largest approximate rebate at risk in this view.
    </p>
    {acts.length === 0 ? (
      <p>No known branch rebate is at risk in this view.</p>
    ) : (
      <>
        <FollowUpListScroll labelId={actTabId} itemCount={acts.length}>
          <ol className="act-list" role="list">
            {acts.map((item) => (
              <li key={item.id}>
                {item.href.startsWith("#") ? (
                  <a
                    href={item.href}
                    onClick={() => onSelectAnchor?.(item.href.slice(1))}
                  >
                    {item.title}
                  </a>
                ) : (
                  <Link to={item.href}>{item.title}</Link>
                )}
                <span>{item.subtitle}</span>
                <strong>{formatUsd(item.foregone)}</strong>
                <em>
                  {formatNumber(item.attention)}{" "}
                  {item.attention === 1 ? "branch" : "branches"} not in good standing
                </em>
              </li>
            ))}
          </ol>
        </FollowUpListScroll>
        {acts.length > VISIBLE_FOLLOWUP_ITEMS ? (
          <p className="followup-scroll-note">
            Showing {VISIBLE_FOLLOWUP_ITEMS} at a time — scroll to see all {formatNumber(acts.length)}{" "}
            {level === "section" ? "schools" : "sections"}.
          </p>
        ) : null}
      </>
    )}
  </>
);

if (!showRebate) {
  return (
    <section className="panel">
      <h2 id={headingId}>Dissolution risk</h2>
      {riskBody}
    </section>
  );
}

return (
  <section className="panel">
    <div className="followup-toolbar">
      <h2 id={headingId}>Follow-up actions</h2>
      <div role="tablist" aria-labelledby={headingId} className="followup-tabs">
        <button
          ref={riskTabRef}
          id={riskTabId}
          type="button"
          role="tab"
          className="followup-tab"
          aria-selected={currentTab === "risk"}
          aria-controls={riskPanelId}
          tabIndex={currentTab === "risk" ? 0 : -1}
          onClick={() => selectTab("risk")}
          onKeyDown={handleTabKeyDown}
        >
          <span>Dissolution risk</span>
          <span className="sr-only"> (</span>
          <span className="followup-count">{formatNumber(urgent.length)}</span>
          <span className="sr-only">)</span>
        </button>
        <button
          ref={actTabRef}
          id={actTabId}
          type="button"
          role="tab"
          className="followup-tab"
          aria-selected={currentTab === "act"}
          aria-controls={actPanelId}
          tabIndex={currentTab === "act" ? 0 : -1}
          onClick={() => selectTab("act")}
          onKeyDown={handleTabKeyDown}
        >
          <span>Where to act</span>
          <span className="sr-only"> (</span>
          <span className="followup-count">{formatNumber(acts.length)}</span>
          <span className="sr-only">)</span>
        </button>
      </div>
    </div>
    {currentTab === "risk" ? (
      <div role="tabpanel" id={riskPanelId} aria-labelledby={riskTabId}>
        {riskBody}
      </div>
    ) : (
      <div role="tabpanel" id={actPanelId} aria-labelledby={actTabId}>
        {actBody}
      </div>
    )}
  </section>
);
}
