import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";

export const VISIBLE_TABLE_ROWS = 10;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function setCssVar(element: HTMLElement, name: string, value: string) {
  if (element.style.getPropertyValue(name) !== value) {
    element.style.setProperty(name, value);
  }
}

export function TableScroll({
  captionId,
  rowCount,
  maxVisibleRows,
  children,
}: {
  captionId: string;
  rowCount: number;
  maxVisibleRows?: number;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const capped = maxVisibleRows != null && rowCount > maxVisibleRows;

  useIsomorphicLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (!capped || maxVisibleRows == null) {
      container.style.removeProperty("--table-max-block-size");
      container.style.removeProperty("--table-head-size");
      container.style.removeProperty("--table-foot-size");
      return;
    }

    let lastInlineSize = -1;
    let frame = 0;

    const measure = () => {
      const table = container.querySelector("table");
      if (!table) return;
      const thead = table.tHead;
      const tbody = table.tBodies[0];
      const tfoot = table.tFoot;
      if (!tbody || tbody.rows.length <= maxVisibleRows) {
        container.style.removeProperty("--table-max-block-size");
        return;
      }

      const dataRows = tbody.querySelectorAll<HTMLTableRowElement>("tr:not([aria-hidden='true'])");
      if (dataRows.length === 0) return;
      const count = Math.min(dataRows.length, maxVisibleRows);

      const headHeight = thead ? thead.getBoundingClientRect().height : 0;
      const footHeight = tfoot ? tfoot.getBoundingClientRect().height : 0;
      const firstRowTop = dataRows[0].getBoundingClientRect().top;
      const lastVisibleRowBottom = dataRows[count - 1].getBoundingClientRect().bottom;
      const rowsHeight = Math.max(0, lastVisibleRowBottom - firstRowTop);
      const horizontalScrollbar = Math.max(0, container.offsetHeight - container.clientHeight);

      const roundedHead = Math.round(headHeight);
      const roundedFoot = Math.round(footHeight);
      const roundedRows = Math.round(rowsHeight);
      const total = roundedHead + roundedRows + roundedFoot + horizontalScrollbar;

      const currentVal = parseFloat(container.style.getPropertyValue("--table-max-block-size"));
      if (Number.isNaN(currentVal) || Math.abs(currentVal - total) > 1) {
        setCssVar(container, "--table-max-block-size", `${total}px`);
      }
      setCssVar(container, "--table-head-size", `${roundedHead}px`);
      setCssVar(container, "--table-foot-size", `${roundedFoot}px`);
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
  }, [capped, maxVisibleRows, rowCount]);

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      className={capped ? "table-scroll table-scroll-capped" : "table-scroll"}
    >
      {children}
    </div>
  );
}
