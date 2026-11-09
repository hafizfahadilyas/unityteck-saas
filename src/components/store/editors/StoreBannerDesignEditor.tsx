import React from 'react';
import { SharedCanvaEditorPage } from './sharedCanvaPage';

export const StoreBannerDesignEditor: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({
  onNavigateTab,
}) => <SharedCanvaEditorPage editorKind="banner" onNavigateTab={onNavigateTab} />;
