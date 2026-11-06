import React, { useEffect, useState } from 'react';
import { usePrefs } from '../../i18n/PrefsContext';

const BRAND_CARD_KEY = 'unityteck-sidebar-brand-card';
const BRAND_CARD_EVENT = 'unityteck-sidebar-brand-card';

function readBrandCardOpen(): boolean {
  try {
    return localStorage.getItem(BRAND_CARD_KEY) === '1';
  } catch {
    return false;
  }
}

/** Store/Master sidebar note. Hidden until toggled. Follows this store's chrome. */
export const SaudiSidebarFooter: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t, locale } = usePrefs();
  const isEn = locale === 'en';
  const [open, setOpen] = useState(readBrandCardOpen);

  useEffect(() => {
    const sync = () => setOpen(readBrandCardOpen());
    window.addEventListener(BRAND_CARD_EVENT, sync);
    return () => window.removeEventListener(BRAND_CARD_EVENT, sync);
  }, []);

  const setOpenPersist = (next: boolean) => {
    try {
      localStorage.setItem(BRAND_CARD_KEY, next ? '1' : '0');
    } catch {
      /* storage may be unavailable */
    }
    setOpen(next);
    window.dispatchEvent(new Event(BRAND_CARD_EVENT));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpenPersist(true)}
        aria-expanded={false}
        className={`${compact ? 'm-0 w-full' : 'mx-2.5 mb-2.5 self-stretch'} px-2 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer shrink-0`}
        style={{
          color: 'var(--portal-200)',
          background: 'transparent',
          border: '1px solid color-mix(in srgb, var(--portal-400) 28%, transparent)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {isEn ? 'Show platform card' : 'إظهار بطاقة المنصة'}
      </button>
    );
  }

  return (
    <div
      className={`${compact ? 'm-0 p-3 rounded-xl' : 'm-2.5 p-3 rounded-2xl'} border text-center relative overflow-hidden shrink-0`}
      style={{
        background: 'var(--chrome-sidebar-bg, linear-gradient(145deg, var(--portal-800), var(--portal-950)))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderColor: 'color-mix(in srgb, var(--portal-400) 45%, transparent)',
        fontFamily: 'var(--font-ui)',
      }}
      data-chrome="saudi-sidebar-footer"
    >
      <button
        type="button"
        onClick={() => setOpenPersist(false)}
        aria-expanded
        aria-label={isEn ? 'Hide platform card' : 'إخفاء بطاقة المنصة'}
        className="absolute top-1.5 end-1.5 z-10 px-1.5 py-0.5 rounded-md text-[9px] font-semibold cursor-pointer"
        style={{ color: '#fff', background: 'rgba(0,0,0,0.35)' }}
      >
        {isEn ? 'Hide' : 'إخفاء'}
      </button>
      <span
        className="mx-auto mb-2 block h-1 w-10 rounded-full"
        style={{ background: 'var(--portal-cta)' }}
      />
      <p className="text-[10px] font-bold text-white tracking-wide leading-snug px-1">
        {isEn ? t('saudiFooterEn') : t('saudiFooterAr')}
      </p>
      <p className="text-[9px] font-semibold mt-1 leading-snug px-1 text-white/80">
        {isEn ? 'Enterprise Multi-Store Platform' : 'منصة التجارة الإلكترونية متعددة المتاجر'}
      </p>
    </div>
  );
};
