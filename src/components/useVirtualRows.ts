import { useEffect, useLayoutEffect, useRef, useState, type RefCallback } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface UseVirtualRowsOptions<T> {
  rows: T[];
  enabledThreshold?: number;
  defaultRowHeight?: number;
  overscan?: number;
  tableRef: React.RefObject<HTMLTableElement | null>;
  targetAnchor?: string | null;
  getAnchor?: (row: T) => string;
}

export interface VirtualRowsResult<T> {
  isVirtualized: boolean;
  visibleRows: T[];
  startIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  firstRowRef: RefCallback<HTMLTableRowElement>;
}

export function useVirtualRows<T>({
  rows,
  enabledThreshold = 40,
  defaultRowHeight = 44,
  overscan = 12,
  tableRef,
  targetAnchor,
  getAnchor,
}: UseVirtualRowsOptions<T>): VirtualRowsResult<T> {
  const isVirtualized = rows.length > enabledThreshold;
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [measuredRowHeight, setMeasuredRowHeight] = useState(defaultRowHeight);
  const rowHeightRef = useRef(defaultRowHeight);

  const firstRowRef: RefCallback<HTMLTableRowElement> = (node) => {
    if (!node || !isVirtualized) return;
    const height = node.getBoundingClientRect().height;
    if (height > 20 && Math.abs(height - rowHeightRef.current) > 2) {
      rowHeightRef.current = height;
      setMeasuredRowHeight(height);
    }
  };

  useIsomorphicLayoutEffect(() => {
    if (!isVirtualized) {
      setScrollTop(0);
      return;
    }
    const container = tableRef.current?.parentElement;
    if (!container) return;

    setViewportHeight(container.clientHeight || 600);
    setScrollTop(container.scrollTop || 0);

    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrollTop(container.scrollTop);
        setViewportHeight(container.clientHeight);
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            setViewportHeight(container.clientHeight || 600);
          })
        : null;
    if (observer) observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
    };
  }, [isVirtualized, tableRef]);

  // Handle target anchor jumping
  useEffect(() => {
    if (!targetAnchor || !isVirtualized || !getAnchor) return;
    const targetIdx = rows.findIndex((r) => getAnchor(r) === targetAnchor);
    if (targetIdx !== -1) {
      const container = tableRef.current?.parentElement;
      if (container) {
        const targetTop = Math.max(0, targetIdx * rowHeightRef.current);
        container.scrollTop = targetTop;
        setScrollTop(targetTop);
      }
    }
  }, [targetAnchor, isVirtualized, rows, getAnchor]);

  if (!isVirtualized) {
    return {
      isVirtualized: false,
      visibleRows: rows,
      startIndex: 0,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
      firstRowRef,
    };
  }

  const rowHeight = measuredRowHeight || rowHeightRef.current;
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(rows.length, startIndex + visibleCount + overscan * 2);
  const visibleRows = rows.slice(startIndex, endIndex);
  const topSpacerHeight = startIndex * rowHeight;
  const bottomSpacerHeight = Math.max(0, (rows.length - endIndex) * rowHeight);

  return {
    isVirtualized: true,
    visibleRows,
    startIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    firstRowRef,
  };
}
