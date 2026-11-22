/**
 * Design Studio project JSON — full round-trip (export / import).
 * Keeps layers + canvas + backdrop + filters editable after reload.
 * Optional `pages` = Canva-style multi-page (active page mirrored in top-level layers).
 */

export const CANVA_PROJECT_VERSION = 1 as const;

export type CanvaProjectLayer = {
  id: string;
  type: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  fontSize: number;
  fontColor: string;
  bgColor?: string;
  bgPadding?: number;
  borderRadius?: number;
  isBold?: boolean;
  isItalic?: boolean;
  fontWeight?: string;
  underline?: boolean;
  strikethrough?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  shapeType?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  imageUrl?: string;
  locked?: boolean;
  hidden?: boolean;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  flipH?: boolean;
  flipV?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  icon?: string;
  badgeStyle?: string;
  /** Shared id when layers are grouped together */
  groupId?: string;
  bgRemoved?: boolean;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  animIn?: string;
  animOut?: string;
  animDurationMs?: number;
  animOutDurationMs?: number;
  animDelayMs?: number;
  animEase?: string;
};

/** One page inside a multi-page Design Studio project */
export type CanvaStudioPageJson = {
  id: string;
  name: string;
  locked?: boolean;
  hidden?: boolean;
  backdrop: string;
  customSolidColor: string;
  product?: { x: number; y: number; scale: number; flipH?: boolean; flipV?: boolean };
  filters?: { brightness: number; contrast: number; saturation: number; blur: number };
  bgRemoved?: boolean;
  bgTolerance?: number;
  layers: CanvaProjectLayer[];
};

export type CanvaDesignProject = {
  version: typeof CANVA_PROJECT_VERSION;
  kind: 'unityteck-canva-studio';
  title: string;
  width: number;
  height: number;
  category?: string;
  backdrop: string;
  customSolidColor: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    c1: string;
    c2: string;
    c3: string;
  };
  product?: { x: number; y: number; scale: number; flipH?: boolean; flipV?: boolean };
  filters?: { brightness: number; contrast: number; saturation: number; blur: number };
  layers: CanvaProjectLayer[];
  /** Multi-page designs — when set, top-level layers = active page mirror */
  pages?: CanvaStudioPageJson[];
  activePageId?: string;
  exportedAt: string;
};

export function isCanvaDesignProject(raw: unknown): raw is CanvaDesignProject {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return (
    o.kind === 'unityteck-canva-studio' &&
    typeof o.width === 'number' &&
    typeof o.height === 'number' &&
    Array.isArray(o.layers)
  );
}

export function parseCanvaDesignProject(text: string): CanvaDesignProject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('PROJECT_JSON_INVALID');
  }
  if (!isCanvaDesignProject(parsed)) {
    throw new Error('PROJECT_JSON_UNSUPPORTED');
  }
  if (parsed.width < 32 || parsed.height < 32 || parsed.width > 8000 || parsed.height > 8000) {
    throw new Error('PROJECT_SIZE_INVALID');
  }
  if (parsed.layers.length > 120) {
    throw new Error('PROJECT_TOO_MANY_LAYERS');
  }
  return {
    ...parsed,
    version: CANVA_PROJECT_VERSION,
    title: String(parsed.title || 'Design').slice(0, 120),
    layers: parsed.layers.map((layer, idx) => ({
      ...layer,
      id: String(layer.id || `layer-${idx}`),
      type: String(layer.type || 'custom_text'),
      text: String(layer.text ?? ''),
      x: Number(layer.x) || 0,
      y: Number(layer.y) || 0,
      fontSize: Math.max(8, Number(layer.fontSize) || 24),
      fontColor: String(layer.fontColor || '#0f172a'),
    })),
  };
}

export function buildCanvaDesignProject(input: {
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
  pages?: CanvaStudioPageJson[];
  activePageId?: string;
}): CanvaDesignProject {
  return {
    version: CANVA_PROJECT_VERSION,
    kind: 'unityteck-canva-studio',
    title: input.title.slice(0, 120),
    width: input.width,
    height: input.height,
    category: input.category,
    backdrop: input.backdrop,
    customSolidColor: input.customSolidColor,
    gradient: input.gradient,
    product: input.product,
    filters: input.filters,
    layers: input.layers,
    ...(input.pages && input.pages.length > 0
      ? { pages: input.pages, activePageId: input.activePageId || input.pages[0]?.id }
      : {}),
    exportedAt: new Date().toISOString(),
  };
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
