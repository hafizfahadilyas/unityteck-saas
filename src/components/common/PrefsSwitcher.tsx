import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Coins } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { CURRENCIES, type AppLocale, type DisplayCurrency } from '../../i18n/prefs';
import { useToast } from '../common/ToastProvider';

type PrefsSwitcherProps = {
  /** Show currency control (store / storefront). */
  showCurrency?: boolean;
  compact?: boolean;
  variant?: 'default' | 'chrome';
};

const ALL_LANGUAGES: { code: AppLocale; label: string; native: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
];

export const PrefsSwitcher: React.FC<PrefsSwitcherProps> = ({
  showCurrency = false,
  compact = false,
  variant = 'default',
}) => {
  const {
    locale,
    currency,
    setLocale,
    setCurrency,
    t,
    allowedLocales,
  } = usePrefs();
  const { toast } = useToast();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const availableLanguages = ALL_LANGUAGES.filter(
    (l) => !allowedLocales || allowedLocales.includes(l.code),
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (langOpen && !langRef.current?.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (currencyOpen && !currencyRef.current?.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [langOpen, currencyOpen]);

  const pickLocale = (next: AppLocale) => {
    if (next === locale) {
      setLangOpen(false);
      return;
    }
    // Close first so dropdown does not linger across RTL/LTR flip.
    setLangOpen(false);
    // flushSync inside setLocale → full chrome (sidebar/topbar/pages) flips in one turn.
    setLocale(next);
    // Toast language matches the NEW chrome locale only (no mix).
    window.setTimeout(() => {
      toast(next === 'ar' ? 'تم تعيين اللغة إلى العربية' : 'Language set to English', 'success');
    }, 0);
  };

  const currentLang = availableLanguages.find((l) => l.code === locale) || availableLanguages[0] || ALL_LANGUAGES[0];
  const canSwitchLang = availableLanguages.length > 1;
  const isArChrome = locale === 'ar';

  return (
    <div
      className="inline-flex items-center gap-2 relative z-20"
      role="toolbar"
      aria-label={t('language')}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Language Selector */}
      <div className="relative" ref={langRef}>
        <button
          type="button"
          onClick={() => {
            if (canSwitchLang) setLangOpen((v) => !v);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            canSwitchLang ? 'cursor-pointer hover:opacity-90 active:scale-[0.98]' : 'cursor-default opacity-90'
          }`}
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
          aria-expanded={canSwitchLang ? langOpen : undefined}
          aria-haspopup={canSwitchLang ? 'menu' : undefined}
          title={canSwitchLang ? (isArChrome ? 'اللغة' : t('language')) : `${currentLang.native}`}
          lang={locale}
        >
          <Globe className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-hidden />
          <span className="font-medium text-[11px] sm:text-xs">{currentLang.native}</span>
          {canSwitchLang ? (
            <ChevronDown
              className="w-3 h-3 opacity-60 transition-transform"
              style={{ transform: langOpen ? 'rotate(180deg)' : undefined }}
              aria-hidden
            />
          ) : null}
        </button>

        {canSwitchLang && langOpen ? (
          <div
            role="menu"
            className="absolute end-0 mt-1.5 w-36 rounded-xl border py-1 z-50 text-xs shadow-lg"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {availableLanguages.map((l) => (
              <button
                key={l.code}
                type="button"
                role="menuitem"
                onClick={() => pickLocale(l.code)}
                className="w-full px-3 py-2 text-start flex items-center justify-between cursor-pointer hover:opacity-80 transition-colors"
                style={{
                  background: locale === l.code ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                  color: locale === l.code ? 'var(--accent)' : 'var(--text)',
                  fontWeight: locale === l.code ? 700 : 500,
                }}
              >
                <span>{l.native}</span>
                {locale === l.code ? <Check className="w-3.5 h-3.5" aria-hidden /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Optional Currency Switcher for storefront/store */}
      {showCurrency ? (
        <div className="relative" ref={currencyRef}>
          <button
            type="button"
            onClick={() => setCurrencyOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <Coins className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>{currency}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {currencyOpen ? (
            <div
              className="absolute end-0 mt-1.5 w-32 rounded-xl border py-1 z-50 text-xs shadow-lg"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              {Object.keys(CURRENCIES).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCurrency(c as DisplayCurrency);
                    setCurrencyOpen(false);
                    toast(t('currencyUpdated'), 'success');
                  }}
                  className="w-full px-3 py-1.5 text-start flex items-center justify-between cursor-pointer hover:opacity-80"
                  style={{
                    color: currency === c ? 'var(--accent)' : 'var(--text)',
                    fontWeight: currency === c ? 700 : 500,
                  }}
                >
                  <span>{c}</span>
                  {currency === c ? <Check className="w-3.5 h-3.5" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
