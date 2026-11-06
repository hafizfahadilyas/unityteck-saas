export type FrameDevice = 'desktop' | 'tablet' | 'mobile';

export type DeviceStyle = {
  padding?: string | number;
  margin?: string | number;
  gap?: string | number;
  maxWidth?: string | number;
  fontSize?: string | number;
  align?: string;
  color?: string;
};

export type StyledBlock = {
  visible?: boolean;
  visibleDesktop?: boolean;
  visibleTablet?: boolean;
  visibleMobile?: boolean;
  style?: {
    desktop?: DeviceStyle;
    tablet?: DeviceStyle;
    mobile?: DeviceStyle;
  };
};

const FRAME_WIDTH: Record<FrameDevice, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

export function frameDevice(mode: string): FrameDevice {
  if (mode === 'mobile') return 'mobile';
  if (mode === 'tablet') return 'tablet';
  return 'desktop';
}

export function frameWidthPx(mode: string): number {
  return FRAME_WIDTH[frameDevice(mode)];
}

export function isWidgetVisibleOnDevice(block: StyledBlock, mode: string): boolean {
  if (block.visible === false) return false;
  const device = frameDevice(mode);
  if (device === 'mobile' && block.visibleMobile === false) return false;
  if (device === 'tablet' && block.visibleTablet === false) return false;
  if (device === 'desktop' && block.visibleDesktop === false) return false;
  return true;
}

export function visibleFrameBlocks<T extends StyledBlock>(blocks: T[], mode: string): T[] {
  return blocks.filter((block) => isWidgetVisibleOnDevice(block, mode));
}

function cssSize(value: string | number | undefined): string | undefined {
  if (value === undefined || value === '') return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export function deviceStyleCss(block: StyledBlock, mode: string): {
  padding?: string;
  margin?: string;
  gap?: string;
  maxWidth?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
} {
  const bucket = block.style?.[frameDevice(mode)];
  if (!bucket) return {};
  const align = bucket.align === 'left' || bucket.align === 'center' || bucket.align === 'right' || bucket.align === 'justify'
    ? bucket.align
    : undefined;
  return {
    padding: cssSize(bucket.padding),
    margin: cssSize(bucket.margin),
    gap: cssSize(bucket.gap),
    maxWidth: cssSize(bucket.maxWidth),
    fontSize: cssSize(bucket.fontSize),
    textAlign: align,
    color: bucket.color,
  };
}
