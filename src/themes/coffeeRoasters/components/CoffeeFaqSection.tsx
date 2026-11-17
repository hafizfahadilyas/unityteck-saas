import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { bi, type FaqSettings } from '../../settings/coffeeModularSettings';
import {
  faqShowsOnDevice,
  visibleFaqItems,
  type FaqPreviewDevice,
} from './coffeeFaqLogic';

export const CoffeeFaqSection: React.FC<{
  settings: FaqSettings | null | undefined;
  lang?: 'ar' | 'en';
  device?: FaqPreviewDevice;
}> = ({ settings, lang = 'en', device = 'desktop' }) => {
  const isAr = lang === 'ar';
  const items = useMemo(() => visibleFaqItems(settings), [settings]);
  const [openIds, setOpenIds] = useState<string[]>([]);

  useEffect(() => {
    if (!items.length) {
      setOpenIds([]);
      return;
    }
    if (settings?.openFirstByDefault !== false) {
      setOpenIds([items[0].id]);
    } else {
      setOpenIds([]);
    }
  }, [items, settings?.openFirstByDefault]);

  if (!faqShowsOnDevice(settings, device)) return null;
  if (!items.length) return null;

  const padY = settings?.sectionPaddingY ?? 48;
  const gap = settings?.itemGapPx ?? 12;
  const multi = settings?.allowMultipleOpen === true;

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const isOpen = prev.includes(id);
      if (multi) {
        return isOpen ? prev.filter((x) => x !== id) : [...prev, id];
      }
      return isOpen ? [] : [id];
    });
  };

  return (
    <section
      data-customize-section="C-FAQ"
      className="w-full max-w-[900px] mx-auto px-4 lg:px-8"
      style={{
        paddingTop: (settings?.spacingTopPx || 0) + padY,
        paddingBottom: (settings?.spacingBottomPx || 0) + padY,
      }}
    >
      <div className="text-center space-y-2 mb-6">
        {settings?.showBadge !== false && (settings?.badgeEn || settings?.badgeAr) ? (
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-neutral-600">
            {bi(lang, settings.badgeEn, settings.badgeAr)}
          </div>
        ) : null}
        {settings?.showTitle !== false && (settings?.titleEn || settings?.titleAr) ? (
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            {bi(lang, settings.titleEn, settings.titleAr)}
          </h2>
        ) : null}
        {settings?.showDescription !== false && (settings?.descriptionEn || settings?.descriptionAr) ? (
          <p className="text-sm text-neutral-500">{bi(lang, settings.descriptionEn, settings.descriptionAr)}</p>
        ) : null}
      </div>

      <div className="space-y-0" style={{ gap }}>
        {items.map((it) => {
          const open = openIds.includes(it.id);
          const q = bi(lang, it.qEn, it.qAr);
          const a = bi(lang, it.aEn, it.aAr);
          return (
            <div
              key={it.id}
              className="rounded-2xl border border-neutral-100 bg-[#F8F9FA] overflow-hidden mb-3"
              style={{ marginBottom: gap }}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-start"
                onClick={() => toggle(it.id)}
                aria-expanded={open}
              >
                <span className="flex items-start gap-2 min-w-0">
                  <HelpCircle className="w-4 h-4 mt-0.5 shrink-0 text-neutral-400" />
                  <span className="font-bold text-sm text-neutral-900 break-words">{q}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open ? (
                <div className="px-4 pb-4 pt-0 text-sm text-neutral-600 leading-relaxed break-words">
                  {a || (
                    <span className="text-neutral-400">
                      {isAr ? 'لا إجابة بعد' : 'No answer yet'}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};
