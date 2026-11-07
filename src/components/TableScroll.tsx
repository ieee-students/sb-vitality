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
      const total = Math.ceil(headHeight + rowsHeight + footHeight + horizontalScrollbar);

      setCssVar(container, "--table-max-block-size", `${total}px`);
      setCssVar(container, "--table-head-size", `${Math.ceil(headHeight)}px`);
      setCssVar(container, "--table-foot-size", `${Math.ceil(footHeight)}px`);
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;

    const table = container.querySelector("table");
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(container);
    if (table) observer.observe(table);

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
