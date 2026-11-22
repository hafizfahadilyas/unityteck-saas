import React from 'react';
import { CustomizerSectionForm } from '../themeCustomizer/CustomizerSectionForm';
import { coffeeCustomizerSectionForBlock } from './coffeeBuilderSectionMap';

/**
 * Page Builder → same Coffee Word panels as Theme Customizer / docs/34 refs.
 * Holst chrome via forms; HiBrew preview stays on the canvas (embedded = settings only).
 */
export function CoffeeBuilderSectionInspector({
  block,
  isAr,
}: {
  block: { type?: string; id?: string } | null | undefined;
  isAr: boolean;
}): React.ReactElement | null {
  const sectionId = coffeeCustomizerSectionForBlock(block);
  if (!sectionId) return null;

  return (
    <div
      className="coffee-builder-ref-inspector -mx-1 min-h-0"
      data-coffee-builder-section={sectionId}
      data-testid="coffee-builder-section-inspector"
    >
      <p
        className="mb-2 px-1 text-[10px] font-bold"
        style={{ color: 'var(--muted)' }}
      >
        {sectionId === '00_header_builder'
          ? isAr
            ? 'القائمة الرئيسية — إظهار/إخفاء عناصر الشريط، إضافة روابط، وتبويب القائمة الكبرى للمنتجات. مرّر أو انقر على المكائن/المطاحن في المعاينة.'
            : 'Main Menu — show/hide navbar items, add extra links, and Mega Menu products. Hover or click Machines/Mills in the preview.'
          : isAr
            ? 'لوحة إعدادات القهوة — نفس تخصيص الثيم (مرجع الواجهة)'
            : 'Coffee settings panel — same as Theme Customize (ref UI)'}
      </p>
      <CustomizerSectionForm sectionId={sectionId} isAr={isAr} liveCanvas />
    </div>
  );
}

export function coffeeBlockUsesRefInspector(block: {
  type?: string;
  id?: string;
} | null | undefined): boolean {
  return Boolean(coffeeCustomizerSectionForBlock(block));
}
