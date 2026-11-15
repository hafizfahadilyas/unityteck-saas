/**
 * Design Studio local draft — store_id isolated, survives soft-refresh / remount.
 * Not a substitute for Save to Media; never shared across tenants.
 */

import {
  buildCanvaDesignProject,
  isCanvaDesignProject,
  type CanvaDesignProject,
  type CanvaProjectLayer,
} from './canvaDesignProject';

export const CANVA_DRAFT_VERSION = 1 as const;

export type CanvaStudioDraft = {
  version: typeof CANVA_DRAFT_VERSION;
  storeId: string;
  scope: string;
  selectedTemplateId: string | null;
  updatedAt: string;
  project: CanvaDesignProject;
};

function storageKey(storeId: string, scope: string): string {
  return `unityteck_canva_draft_v${CANVA_DRAFT_VERSION}_${storeId}_${scope}`;
}

export function canvaDraftScope(opts: {
  masterMode?: boolean;
  editorKind?: string | null;
  assetId?: string | null;
}): string {
  const portal = opts.masterMode ? 'master' : 'store';
  const kind = opts.editorKind || 'studio';
  const asset = opts.assetId || 'blank';
  return `${portal}:${kind}:${asset}`;
}

export function loadCanvaStudioDraft(
  storeId: string,
  scope: string,
): CanvaStudioDraft | null {
  if (!storeId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(storeId, scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CanvaStudioDraft;
    if (
      !parsed ||
      parsed.version !== CANVA_DRAFT_VERSION ||
      parsed.storeId !== storeId ||
      parsed.scope !== scope ||
      !isCanvaDesignProject(parsed.project)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCanvaStudioDraft(input: {
  storeId: string;
  scope: string;
  selectedTemplateId: string | null;
  project: CanvaDesignProject;
}): CanvaStudioDraft | null {
  if (!input.storeId || typeof localStorage === 'undefined') return null;
  const row: CanvaStudioDraft = {
    version: CANVA_DRAFT_VERSION,
    storeId: input.storeId,
    scope: input.scope,
    selectedTemplateId: input.selectedTemplateId,
    updatedAt: new Date().toISOString(),
    project: input.project,
  };
  try {
    localStorage.setItem(storageKey(input.storeId, input.scope), JSON.stringify(row));
    return row;
  } catch {
    return null;
  }
}

export function clearCanvaStudioDraft(storeId: string, scope: string): void {
  if (!storeId || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(storeId, scope));
  } catch {
    /* ignore */
  }
}

export function buildDraftProject(input: {
  title: string;
  width: number;
  height: number;
  category?: string;
  backdrop: string;
  customSolidColor: string;
  gradient?: CanvaDesignProject['gradient'];
  product?: CanvaDesignProject['product'];
  filters?: CanvaDesignProject['filters'];
  layers: CanvaProjectLayer[];
}): CanvaDesignProject {
  return buildCanvaDesignProject(input);
}

/** Meaningful work worth restoring (layers or non-default product hero). */
export function draftHasWork(draft: CanvaStudioDraft | null): boolean {
  if (!draft?.project) return false;
  const layers = draft.project.layers || [];
  if (layers.length > 0) return true;
  const scale = draft.project.product?.scale ?? 0;
  return scale > 0;
}
