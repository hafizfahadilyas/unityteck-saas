import React from 'react';
import { SharedCanvaEditorPage } from './sharedCanvaPage';

export const StoreLogoDesignEditor: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({
  onNavigateTab,
}) => <SharedCanvaEditorPage editorKind="logo" onNavigateTab={onNavigateTab} />;
