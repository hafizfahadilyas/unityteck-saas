import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type FloatingPopoverAlign = 'start' | 'end';

export type PopoverPlacement = {
  left: number;
  /** Distance from viewport top when opening below the trigger. */
  top?: number;
  /** Distance from viewport bottom when opening above the trigger (pins bottom edge). */
  bottom?: number;
  maxHeight: number;
  placement: 'below' | 'above';
};

/**
 * Anchor a dropdown to its trigger.
 * Prefer below; if the viewport is too short underneath, pin above with CSS `bottom`
 * so the panel never floats mid-screen from an oversized estimated height.
 * Pass preferBelow to always open under the trigger (scroll inside) — toolbar
 * Filter/Sort menus must not flip upward over the page.
 */
/** Dropdowns show full content when possible; scroll only past this viewport share. */
export const DROPDOWN_VIEWPORT_MAX_RATIO = 0.85;

export function placePopoverBelow(
  el: HTMLElement | null,
  width: number,
  alignEnd: boolean,
  gap = 8,
  estimatedHeight = 280,
  preferBelow = false,
): PopoverPlacement | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const viewportCap = Math.max(160, Math.floor(vh * DROPDOWN_VIEWPORT_MAX_RATIO));

  const left = alignEnd
    ? Math.max(8, Math.min(rect.right - width, vw - width - 8))
    : Math.max(8, Math.min(rect.left, vw - width - 8));

  const belowTop = rect.bottom + gap;
  const spaceBelow = vh - belowTop - 8;
  const spaceAbove = rect.top - gap - 8;
  // Content size for flip decisions — maxHeight itself uses full available space
  // so short menus never get an artificial 220–320px clip.
  const needed = Math.max(96, Math.min(estimatedHeight, viewportCap));
  const minComfortable = 120;

  // Prefer above when the full panel cannot fit below but fits better above.
  // preferBelow = never flip / never bottom-pin — always open under the trigger (scroll inside).
  const placeAbove =
    !preferBelow &&
    spaceAbove >= Math.min(needed, minComfortable) &&
    (spaceBelow < needed || spaceBelow < minComfortable) &&
    spaceAbove > spaceBelow;

  if (placeAbove) {
    return {
      // CSS fixed `bottom` = distance from viewport bottom → panel bottom sits just above trigger
      bottom: Math.max(8, vh - rect.top + gap),
      left,
      maxHeight: Math.min(viewportCap, Math.max(96, spaceAbove)),
      placement: 'above',
    };
  }

  return {
    top: belowTop,
    left,
    // Full available room under the trigger — overflowY on the panel scrolls only if needed.
    maxHeight: Math.min(viewportCap, Math.max(80, spaceBelow)),
    placement: 'below',
  };
}

type AnchorRef = { readonly current: HTMLElement | null };

type FloatingPopoverProps = {
  open: boolean;
  anchorRef: AnchorRef;
  onClose: () => void;
  width?: number;
  align?: FloatingPopoverAlign;
  /** Rough panel height for flip / maxHeight; refined after mount via measurement. */
  estimatedHeight?: number;
  /** Keep panel under the trigger even near viewport bottom (scroll inside). */
  preferBelow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  /** Extra elements that count as "inside" (e.g. nested menus). */
  contentRef?: AnchorRef;
};

/**
 * Body-portal dropdown — never clipped by AdminPageShell overflow.
 * Opens under the trigger (smooth dropdown); flips above only when needed,
 * always pinned to the button edge (no mid-screen overlay float).
 * z-index sits ABOVE GlobalModal (z-10000) so selects work inside modals.
 */
export const FloatingPopover: React.FC<FloatingPopoverProps> = ({
  open,
  anchorRef,
  onClose,
  width = 256,
  align = 'end',
  estimatedHeight = 280,
  preferBelow = false,
  className = '',
  style,
  children,
  contentRef,
}) => {
  const [pos, setPos] = useState<PopoverPlacement | null>(null);
  const internalRef = React.useRef<HTMLDivElement>(null);
  const panelRef = contentRef ?? internalRef;
  const measuredHeightRef = React.useRef(estimatedHeight);

  const updatePos = React.useCallback(() => {
    const h = measuredHeightRef.current || estimatedHeight;
    setPos(placePopoverBelow(anchorRef.current, width, align === 'end', 8, h, preferBelow));
  }, [anchorRef, width, align, estimatedHeight, preferBelow]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      measuredHeightRef.current = estimatedHeight;
      return;
    }
    updatePos();
  }, [open, updatePos, estimatedHeight]);

  // After paint, measure real panel height and re-anchor (keeps pin tight to the button).
  useLayoutEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node) return;

    const apply = () => {
      // Measure natural content height without the current maxHeight clamp
      // (otherwise menus stay half-open forever: height measured == capped maxHeight).
      const prevMax = node.style.maxHeight;
      const prevOverflow = node.style.overflowY;
      node.style.maxHeight = 'none';
      node.style.overflowY = 'visible';
      const h = Math.ceil(node.scrollHeight) || estimatedHeight;
      node.style.maxHeight = prevMax;
      node.style.overflowY = prevOverflow;
      if (Math.abs(h - measuredHeightRef.current) < 2) return;
      measuredHeightRef.current = h;
      updatePos();
    };

    apply();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    ro?.observe(node);
    return () => ro?.disconnect();
  }, [open, updatePos, estimatedHeight, panelRef]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePos();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    // Capture-phase close. Never preventDefault.
    // - Click inside GlobalModal panel (e.g. City after Gender): allow the event
    //   through so the next control still receives onClick.
    // - Click on modal backdrop / page chrome: stopPropagation so the parent
    //   GlobalModal does not dismiss on the same gesture.
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
      const el = target as HTMLElement | null;
      const insideModalPanel =
        typeof el?.closest === 'function' && !!el.closest('[data-global-modal="panel"]');
      if (!insideModalPanel) {
        e.stopPropagation();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('click', handleOutside, true);
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('click', handleOutside, true);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [open, onClose, anchorRef, panelRef]);

  if (!open || !pos || typeof document === 'undefined') return null;

  const origin =
    pos.placement === 'above'
      ? align === 'end'
        ? 'bottom right'
        : 'bottom left'
      : align === 'end'
        ? 'top right'
        : 'top left';

  return createPortal(
    <div
      ref={panelRef as React.RefObject<HTMLDivElement>}
      data-floating-popover="true"
      className={`fixed z-[11000] max-w-[calc(100vw-1rem)] overscroll-contain animate-in fade-in zoom-in-95 duration-150 ${className}`.trim()}
      style={{
        left: pos.left,
        width,
        maxHeight: pos.maxHeight,
        // Scroll only when content truly exceeds available viewport space.
        overflowY: measuredHeightRef.current > pos.maxHeight + 2 ? 'auto' : 'visible',
        // Clear the unused edge so flip below↔above never leaves a stuck offset
        top: pos.top ?? 'auto',
        bottom: pos.bottom ?? 'auto',
        transformOrigin: origin,
        ...style,
      }}
      role="listbox"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
};
