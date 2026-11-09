import React from 'react';
import { SharedCanvaEditorPage } from './editors/sharedCanvaPage';

export interface StoreCanvaStudioProps {
  onNavigateTab?: (tab: string) => void;
}

/** Full multi-category design studio (all templates + imports). */
export const StoreCanvaStudio: React.FC<StoreCanvaStudioProps> = ({ onNavigateTab }) => (
  <SharedCanvaEditorPage onNavigateTab={onNavigateTab} />
);
