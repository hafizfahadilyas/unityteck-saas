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
 */
export function placePopoverBelow(
  el: HTMLElement | null,
  width: number,
  alignEnd: boolean,
  gap = 8,
  estimatedHeight = 280,
): PopoverPlacement | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const left = alignEnd
    ? Math.max(8, Math.min(rect.right - width, vw - width - 8))
    : Math.max(8, Math.min(rect.left, vw - width - 8));

  const belowTop = rect.bottom + gap;
  const spaceBelow = vh - belowTop - 8;
  const spaceAbove = rect.top - gap - 8;
  const needed = Math.max(96, Math.min(estimatedHeight, vh - 16));
  /** Keep opening under the button whenever there is usable room; scroll inside if taller. */
  const minComfortable = 120;

  const placeAbove =
    spaceBelow < minComfortable && spaceAbove > spaceBelow && spaceAbove >= 96;

  if (placeAbove) {
    return {
      // CSS fixed `bottom` = distance from viewport bottom → panel bottom sits just above trigger
      bottom: Math.max(8, vh - rect.top + gap),
      left,
      maxHeight: Math.min(needed, Math.max(96, spaceAbove)),
      placement: 'above',
    };
  }

  return {
    top: belowTop,
    left,
    maxHeight: Math.min(Math.max(needed, 96), Math.max(96, spaceBelow)),
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
 */
export const FloatingPopover: React.FC<FloatingPopoverProps> = ({
  open,
  anchorRef,
  onClose,
  width = 256,
  align = 'end',
  estimatedHeight = 280,
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
    setPos(placePopoverBelow(anchorRef.current, width, align === 'end', 8, h));
  }, [anchorRef, width, align, estimatedHeight]);

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
      const h = Math.ceil(node.getBoundingClientRect().height) || estimatedHeight;
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
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
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
      className={`fixed z-[9999] max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150 ${className}`.trim()}
      style={{
        left: pos.left,
        width,
        maxHeight: pos.maxHeight,
        // Clear the unused edge so flip below↔above never leaves a stuck offset
        top: pos.top ?? 'auto',
        bottom: pos.bottom ?? 'auto',
        transformOrigin: origin,
        ...style,
      }}
      role="listbox"
    >
      {children}
    </div>,
    document.body,
  );
};
