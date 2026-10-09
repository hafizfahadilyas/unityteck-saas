import React from 'react';
import { Layers, LogOut } from 'lucide-react';
import { PrefsSwitcher } from './PrefsSwitcher';
import { StoreSwitcher } from './StoreSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';

type Props = {
  portal: 'master' | 'store';
  roleLabel?: string | null;
  showMasterChrome: boolean;
  showStoreSwitcher: boolean;
  onOpenMaster: () => void;
  onOpenStore: () => void;
  onSignOut: () => void;
};

/**
 * Locked Holst top chrome — designs/Login_UIUX
 * Lean: brand · portal · role · store switch · prefs · mode · sign out
 * No demo login / architecture / junk pills.
 */
export const HolstChromeBar: React.FC<Props> = ({
  portal,
  roleLabel,
  showMasterChrome,
  showStoreSwitcher,
  onOpenMaster,
  onOpenStore,
  onSignOut,
}) => {
  const { t } = usePrefs();

  return (
    <header
      className="holst-chrome relative z-50 px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b shrink-0 gap-2"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--portal-900) 40%, var(--portal-950)), var(--portal-950))',
        borderColor: 'var(--portal-800)',
        color: 'var(--portal-50)',
        fontFamily: 'var(--font-ui)',
        boxShadow: '0 1px 0 color-mix(in srgb, #fff 6%, transparent)',
      }}
    >
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 order-1">
        <span
          className="font-extrabold flex items-center gap-1.5 shrink-0 tracking-tight"
          style={{ color: 'var(--portal-400)' }}
        >
          <Layers className="w-4 h-4" aria-hidden />
          <span>{t('brand')}</span>
        </span>

        <span
          className="hidden sm:inline w-px h-4 shrink-0 opacity-40"
          style={{ background: 'var(--portal-400)' }}
          aria-hidden
        />

        <span
          className="hidden sm:inline text-[11px] font-semibold shrink-0"
          style={{ color: 'var(--portal-200)' }}
        >
          {portal === 'master' ? t('masterAdmin') : t('storeAdmin')}
        </span>

        {roleLabel ? (
          <span
            className="hidden md:inline px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wide shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--portal-600) 40%, transparent)',
              color: 'var(--portal-50)',
              border: '1px solid color-mix(in srgb, var(--portal-400) 35%, transparent)',
            }}
          >
            {roleLabel}
          </span>
        ) : null}

        {showStoreSwitcher ? (
          <StoreSwitcher variant="compact" className="min-w-0 max-w-[min(100%,16rem)]" />
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end order-2 ms-auto">
        <PrefsSwitcher showCurrency={portal === 'store'} compact variant="chrome" />

        {showMasterChrome ? (
          <div
            className="flex items-center p-0.5 rounded-xl border"
            role="group"
            aria-label="Portal"
            style={{
              background: 'color-mix(in srgb, var(--portal-800) 65%, transparent)',
              borderColor: 'var(--portal-800)',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenMaster();
              }}
              aria-pressed={portal === 'master'}
              className="px-2.5 py-1.5 rounded-lg font-semibold text-[10px] sm:text-[11px] cursor-pointer transition-all active:scale-[0.98]"
              style={
                portal === 'master'
                  ? { background: 'var(--portal-cta)', color: '#fff' }
                  : { color: 'var(--portal-200)' }
              }
            >
              {t('masterAdmin')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenStore();
              }}
              aria-pressed={portal === 'store'}
              className="px-2.5 py-1.5 rounded-lg font-semibold text-[10px] sm:text-[11px] cursor-pointer transition-all active:scale-[0.98]"
              style={
                portal === 'store'
                  ? { background: 'var(--portal-cta)', color: '#fff' }
                  : { color: 'var(--portal-200)' }
              }
            >
              {t('storeAdmin')}
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSignOut();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'color-mix(in srgb, #e11d48 85%, #7f1d1d)',
            color: '#fff',
          }}
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden />
          <span className="hidden sm:inline">{t('signOut')}</span>
        </button>
      </div>
    </header>
  );
};
