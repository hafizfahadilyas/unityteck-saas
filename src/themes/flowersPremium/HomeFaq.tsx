import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FLOWERS_FAQ } from './pack';

type Props = { lang: string };

export const HomeFaq: React.FC<Props> = ({ lang }) => {
  const [open, setOpen] = useState(0);
  const ar = lang === 'ar';

  return (
    <section
      className="px-4 sm:px-8 py-8 sm:py-10 border-t"
      style={{
        background: 'var(--sf-surface)',
        borderColor: 'var(--sf-border)',
        color: 'var(--sf-text)',
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'color-mix(in srgb, var(--sf-accent) 16%, transparent)', color: 'var(--sf-accent)' }}
        >
          <HelpCircle className="w-4.5 h-4.5" />
        </span>
        <div>
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            {ar ? 'الأسئلة الشائعة' : 'Frequently asked questions'}
          </h3>
          <p className="text-[11px]" style={{ color: 'var(--sf-muted)' }}>
            {ar ? 'توصيل · دفع · حساب العميل' : 'Delivery · payment · customer account'}
          </p>
        </div>
      </div>

      <div className="space-y-2 max-w-3xl">
        {FLOWERS_FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: 'var(--sf-border)',
                background: isOpen
                  ? 'color-mix(in srgb, var(--sf-accent) 8%, var(--sf-surface))'
                  : 'var(--sf-surface)',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-start cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold">{ar ? item.qAr : item.qEn}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--sf-accent)' }}
                />
              </button>
              {isOpen ? (
                <p className="px-4 pb-3 text-xs leading-relaxed" style={{ color: 'var(--sf-muted)' }}>
                  {ar ? item.aAr : item.aEn}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};
