import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Moon, Sun, Coins } from 'lucide-react';
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
    theme,
    locale,
    currency,
    setTheme,
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

  const isDark = theme === 'dark';

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
    setLocale(next);
    setLangOpen(false);
    const msgs: Record<AppLocale, string> = {
      en: 'Language set to English',
      ar: 'تم تعيين اللغة إلى العربية',
    };
    toast(msgs[next], 'success');
  };

  const currentLang = availableLanguages.find((l) => l.code === locale) || availableLanguages[0] || ALL_LANGUAGES[0];
  const canSwitchLang = availableLanguages.length > 1;

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
          title={canSwitchLang ? t('language') : `${currentLang.native}`}
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

      {/* Light / Dark Mode Toggle (Dual Sun / Moon Icons matching screenshot) */}
      <div
        className="flex items-center p-0.5 rounded-xl border"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (isDark) {
              setTheme('light');
              toast(t('themeUpdated'), 'success');
            }
          }}
          title={t('light')}
          aria-label={t('light')}
          className="p-1.5 rounded-lg transition-all cursor-pointer"
          style={{
            background: !isDark ? 'var(--portal-cta)' : 'transparent',
            color: !isDark ? '#FFFFFF' : 'var(--muted)',
            boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          <Sun className="w-3.5 h-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isDark) {
              setTheme('dark');
              toast(t('themeUpdated'), 'success');
            }
          }}
          title={t('dark')}
          aria-label={t('dark')}
          className="p-1.5 rounded-lg transition-all cursor-pointer"
          style={{
            background: isDark ? 'var(--portal-cta)' : 'transparent',
            color: isDark ? '#FFFFFF' : 'var(--muted)',
            boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          <Moon className="w-3.5 h-3.5" aria-hidden />
        </button>
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
