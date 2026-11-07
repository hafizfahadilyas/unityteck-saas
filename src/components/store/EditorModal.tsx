import React from 'react';
import { GlobalModal } from '../common/GlobalModal';

/**
 * Editor overlay used by product/theme editors.
 * Delegates to GlobalModal (portal, center, blur, scroll lock, Escape).
 */
export function EditorModal({
  onClose,
  children,
  dir,
}: {
  onClose: () => void;
  children: React.ReactNode;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <GlobalModal onClose={onClose} dir={dir} aria-label="Editor">
      {children}
    </GlobalModal>
  );
}
