import React from 'react';
import { SharedCanvaEditorPage } from './sharedCanvaPage';

export const StoreProductCardDesignEditor: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({
  onNavigateTab,
}) => <SharedCanvaEditorPage editorKind="product_card" onNavigateTab={onNavigateTab} />;
