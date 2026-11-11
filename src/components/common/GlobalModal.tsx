import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

export type GlobalModalProps = {
  /** When false, renders nothing. Default true for drop-in wrappers. */
  isOpen?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional dir override; omit to inherit document / parent. */
  dir?: 'rtl' | 'ltr';
  /** Extra classes on the backdrop (viewport) layer. */
  backdropClassName?: string;
  /** Classes on the centered content shell (around children). */
  contentClassName?: string;
  /** Close when backdrop is clicked (default true). */
  closeOnBackdrop?: boolean;
  /** Close on Escape (default true). */
  closeOnEscape?: boolean;
  /** Lock document body scroll while open (default true). */
  lockScroll?: boolean;
  /** Stacking order. Default above page chrome and drawers. */
  zIndexClassName?: string;
  /** Accessible name for the dialog. */
  'aria-label'?: string;
  role?: 'dialog' | 'alertdialog' | 'presentation';
};

/**
 * Viewport-centered modal shell for the store/master dashboards.
 * Portaled to document.body so page overflow / nested transforms cannot pin or clip it.
 */
export function GlobalModal({
  isOpen = true,
  onClose,
  children,
  dir,
  backdropClassName = '',
  contentClassName = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
  lockScroll = true,
  zIndexClassName = 'z-[10000]',
  'aria-label': ariaLabel,
  role = 'dialog',
}: GlobalModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || !lockScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, lockScroll]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Let FloatingPopover / city / source menus close first
      if (document.querySelector('[data-floating-popover="true"]')) return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!closeOnBackdrop) return;
    if (e.target !== e.currentTarget) return;
    // Outside click on an open portal select must not dismiss the whole modal
    if (document.querySelector('[data-floating-popover="true"]')) return;
    onClose();
  };

  // Portals escape the shell — copy Holst portal/theme so remaps + tokens apply inside modals.
  const portalAttr =
    document.documentElement.getAttribute('data-portal') ||
    document.body.getAttribute('data-portal') ||
    'store';
  const themeAttr =
    document.documentElement.getAttribute('data-theme') ||
    document.body.getAttribute('data-theme') ||
    'light';

  return createPortal(
    <div
      dir={dir}
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-3 sm:p-5 overflow-y-auto overscroll-contain bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150 ${backdropClassName}`}
      style={{ fontFamily: 'var(--font-ui, inherit)', color: 'var(--text)' }}
      onClick={handleBackdropClick}
      role="presentation"
      data-global-modal="backdrop"
      data-portal={portalAttr}
      data-theme={themeAttr}
    >
      <div
        className={`relative w-full flex justify-center my-auto max-h-[min(96dvh,100%)] ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
        role={role}
        aria-modal={role === 'dialog' || role === 'alertdialog' ? true : undefined}
        aria-label={ariaLabel || undefined}
        aria-labelledby={ariaLabel ? undefined : titleId}
        data-global-modal="panel"
      >
        {!ariaLabel && <span id={titleId} className="sr-only" />}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default GlobalModal;
