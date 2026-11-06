import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Viewport overlay. Portaled so page-shell containment cannot pin the dialog to the top. */
export function EditorModal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div className="w-full flex justify-center my-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
