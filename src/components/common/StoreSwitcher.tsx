import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, Store } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { readAuthSession } from '../../auth/session';
import type { Store as StoreType } from '../../types';
import { getStoreDisplayName } from '../../utils/storeLocalization';

type StoreSwitcherProps = {
  /** compact = global chrome / sidebar; panel = top bar */
  variant?: 'compact' | 'panel';
  className?: string;
};

function filterStores(list: StoreType[], query: string): StoreType[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q),
  );
}

export const StoreSwitcher: React.FC<StoreSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { stores, activeStore, switchToStore, canAccessMaster, mode } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const session = readAuthSession();
  const visibleStores = useMemo(() => {
    // Multi-tenant isolation: Only Super Admin in Master Portal mode can switch across all stores.
    // In any store dashboard view, visibleStores is strictly locked to [activeStore].
    if (!canAccessMaster || mode !== 'master') {
      return [activeStore];
    }
    return stores.length > 0 ? stores : [activeStore];
  }, [canAccessMaster, mode, stores, activeStore]);

  const filtered = useMemo(
    () => filterStores(visibleStores, query),
    [visibleStores, query],
  );

  const canOpen = canAccessMaster && mode === 'master' && visibleStores.length > 1;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const triggerStyle =
    variant === 'panel'
      ? {
          background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
          borderColor: 'color-mix(in srgb, var(--accent) 28%, var(--border))',
          color: 'var(--text)',
        }
      : {
          background: 'color-mix(in srgb, var(--portal-800) 55%, transparent)',
          borderColor: 'color-mix(in srgb, var(--portal-400) 25%, transparent)',
          color: '#F2FBF8',
        };

  if (visibleStores.length === 0) return null;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => (canOpen ? setOpen((v) => !v) : undefined)}
        className={`flex items-center gap-2 max-w-[min(100%,20rem)] px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-opacity ${
          canOpen ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
        }`}
        style={triggerStyle}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={getStoreDisplayName(activeStore, locale)}
      >
        <Store className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="truncate">{getStoreDisplayName(activeStore, locale)}</span>
        <span
          className="hidden sm:inline text-[9px] font-mono px-1 py-0.5 rounded opacity-80 shrink-0"
          style={{
            background: 'color-mix(in srgb, currentColor 12%, transparent)',
          }}
        >
          {activeStore.id}
        </span>
        {canAccessMaster && (
          <span className="text-[9px] opacity-70 shrink-0 hidden md:inline">
            {t('platformStoresCount').replace('{n}', String(stores.length))}
          </span>
        )}
        {canOpen && (
          <ChevronDown
            className="w-3 h-3 shrink-0 opacity-70 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          />
        )}
      </button>

      {open && canOpen && (
        <div
          role="listbox"
          className="absolute start-0 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border shadow-xl z-50 overflow-hidden"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <div
            className="px-3 py-2 border-b text-[10px] font-bold uppercase tracking-wide flex items-center justify-between"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <span>{isAr ? 'التبديل بين المتاجر والأنشطة' : 'Switch Store / Merchant'}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono">
              {visibleStores.length} {isAr ? 'متاجر' : 'stores'}
            </span>
          </div>

          {(canAccessMaster || visibleStores.length > 4) && (
            <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchStoresSwitch')}
                  className="w-full ps-8 pe-2 py-2 text-xs rounded-xl border outline-none focus:ring-2"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                />
              </div>
            </div>
          )}

          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center" style={{ color: 'var(--muted)' }}>
                {t('noStoresMatch')}
              </li>
            ) : (
              filtered.map((s) => {
                const active = s.id === activeStore.id;
                return (
                  <li key={s.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        switchToStore(s.id);
                        setOpen(false);
                        setQuery('');
                      }}
                      className="w-full px-3 py-2.5 text-start flex items-center gap-2.5 hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] cursor-pointer transition-colors"
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
                        style={{
                          background: active
                            ? 'var(--portal-cta)'
                            : 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
                          color: active ? '#fff' : 'var(--text)',
                        }}
                      >
                        {s.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{getStoreDisplayName(s, locale)}</div>
                        <div
                          className="text-[10px] truncate flex items-center gap-1.5 flex-wrap"
                          style={{ color: 'var(--muted)' }}
                        >
                          <span className="font-mono">{s.id}</span>
                          <span>·</span>
                          <span className="capitalize">{s.plan}</span>
                          <span>·</span>
                          <span>{s.status}</span>
                        </div>
                      </div>
                      {active && (
                        <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
