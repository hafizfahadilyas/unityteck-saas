import React from 'react';
import { headingFlowStyle } from '../../../../themes/coffeeRoasters/themeFlow';

export type HeadingTagName = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const TAGS: HeadingTagName[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export function headingTag(settings: Record<string, unknown> | undefined): HeadingTagName {
  const raw = String(settings?.tag || settings?.htmlTag || settings?.level || 'h2').toLowerCase();
  return TAGS.includes(raw as HeadingTagName) ? (raw as HeadingTagName) : 'h2';
}

const SIZE: Record<HeadingTagName, { desktop: number; tablet: number; mobile: number }> = {
  h1: { desktop: 32, tablet: 28, mobile: 22 },
  h2: { desktop: 28, tablet: 24, mobile: 20 },
  h3: { desktop: 22, tablet: 20, mobile: 18 },
  h4: { desktop: 18, tablet: 17, mobile: 16 },
  h5: { desktop: 16, tablet: 15, mobile: 15 },
  h6: { desktop: 14, tablet: 14, mobile: 14 },
};

export function HeadingWidget({
  settings,
  isAr,
  device = 'desktop',
}: {
  settings?: Record<string, any>;
  isAr: boolean;
  device?: 'desktop' | 'laptop' | 'tablet' | 'mobile';
}) {
  const tag = headingTag(settings);
  const text = String(
    isAr
      ? settings?.textAr || settings?.titleAr || settings?.headingAr || settings?.text || ''
      : settings?.textEn || settings?.titleEn || settings?.headingEn || settings?.text || '',
  ).trim();
  const align = settings?.textAlign === 'center' || settings?.textAlign === 'end' || settings?.textAlign === 'start'
    ? settings.textAlign
    : 'start';
  const width = device === 'mobile' ? 'mobile' : device === 'tablet' ? 'tablet' : 'desktop';
  const fontSize = Number(settings?.fontSize || settings?.titleFontSize || SIZE[tag][width]);
  const color = typeof settings?.textColor === 'string' && settings.textColor ? settings.textColor : undefined;

  if (!text) {
    return (
      <p className="m-0 max-w-full px-4 py-3 text-xs text-slate-500 break-words">
        {isAr ? 'أضف عنواناً' : 'Add a heading'}
      </p>
    );
  }

  return React.createElement(
    tag,
    {
      className: 'm-0 max-w-full px-4 py-3 font-bold break-words',
      style: { fontSize: `${fontSize}px`, textAlign: align, color, lineHeight: 1.3, ...headingFlowStyle() },
    },
    text,
  );
}
