import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  Search,
  Zap,
  Bell,
  Mail,
  ChevronDown,
  Plus,
  LogOut,
  RefreshCw,
  X,
  Menu,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { readAuthSession } from '../../auth/session';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { fetchMasterNotifications } from '../../api/tenantApi';
import { formatRelativeTime } from '../../notification-system/utils/dateFilters';

interface MasterTopBarProps {
  onOpenCreateStore: () => void;
  onSignOut: () => void;
  onMobileMenuOpen?: () => void;
  onNavigateTab?: (tab: string) => void;
}

/**
 * M1 — Master Header (docs/21): one white Holst top bar.
 * Fully responsive: Search · Quick Actions · bell · mail · AR/EN · dark/light · avatar · Logout.
 * Brand lives in sidebar (M2). Strictly responsive with no horizontal overflow.
 */
export const MasterTopBar: React.FC<MasterTopBarProps> = ({
  onOpenCreateStore,
  onSignOut,
  onMobileMenuOpen,
  onNavigateTab,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    stores,
    switchToStore,
    softRefreshTenantData,
    cacheEpoch,
  } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const session = readAuthSession();

  const [showQuickActions, setShowQuickActions] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifyRef = useRef<HTMLDivElement>(null);
  const [notifyRows, setNotifyRows] = useState<Array<Record<string, unknown>>>([]);
  const [notifyNewCount, setNotifyNewCount] = useState(0);

  const displayName = session?.user?.name || t('masterAdmin');
  const roleLabel = session?.user?.role_label || t('masterAdmin');
  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase() || 'MA';
  }, [displayName]);

  const notifyCount = Math.min(99, notifyNewCount);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchMasterNotifications();
      setNotifyRows(Array.isArray(res?.data) ? res.data : []);
      setNotifyNewCount(Math.max(0, Number(res?.meta?.new) || 0));
    } catch {
      setNotifyRows([]);
      setNotifyNewCount(0);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, cacheEpoch]);

  useEffect(() => {
    if (!showQuickActions) return;
    const onDoc = (e: MouseEvent) => {
      if (!quickRef.current?.contains(e.target as Node)) {
        setShowQuickActions(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showQuickActions]);

  useEffect(() => {
    if (!showNotifications) return;
    void loadNotifications();
    const onDoc = (e: MouseEvent) => {
      if (!notifyRef.current?.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showNotifications, loadNotifications]);

  return (
    <header
      className="min-h-14 border-b px-2 sm:px-3 md:px-4 lg:px-6 flex flex-wrap items-center gap-x-2 gap-y-2 w-full bg-[var(--bg)] text-[var(--text)] border-[var(--border)] shrink-0 z-30 select-none max-lg:sticky max-lg:top-0"
      style={{
        background: 'var(--bg)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
      data-chrome="master-topbar"
    >
      {/* Row cluster: menu + search (grows) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 basis-[min(100%,16rem)] sm:basis-0">
        {onMobileMenuOpen ? (
          <button
            type="button"
            className="lg:hidden shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--input-bg)' }}
            aria-label={locale === 'ar' ? 'فتح القائمة' : 'Open menu'}
            onClick={onMobileMenuOpen}
          >
            <Menu className="w-5 h-5" aria-hidden />
          </button>
        ) : null}

        <div className="relative flex-1 min-w-0 max-w-full sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
          <Search
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
            style={{ color: 'var(--muted)' }}
            aria-hidden
          />
          <input
            type="search"
            placeholder={t('searchStores')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-8 sm:ps-9 pe-7 py-1.5 sm:py-2 rounded-xl text-xs focus:outline-none transition-all border"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--input-fg)',
              fontFamily: 'var(--font-ui)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow =
                '0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            aria-label={t('searchStores')}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-4 h-4 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label={locale === 'ar' ? 'مسح البحث' : 'Clear'}
            >
              <X className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Actions cluster — wraps cleanly; stays end-aligned */}
      <div className="flex items-center justify-end gap-1 sm:gap-1.5 md:gap-2 shrink-0 flex-wrap ms-auto">
        <div className="relative" ref={quickRef}>
          <button
            type="button"
            onClick={() => setShowQuickActions((v) => !v)}
            aria-expanded={showQuickActions}
            aria-haspopup="menu"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-white rounded-xl text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer active:scale-[0.98] shrink-0 shadow-2xs"
            style={{ background: 'var(--portal-cta)' }}
            title={t('quickActions')}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline whitespace-nowrap">{t('quickActions')}</span>
            <ChevronDown
              className="w-3 h-3 opacity-80 transition-transform shrink-0"
              style={{ transform: showQuickActions ? 'rotate(180deg)' : undefined }}
              aria-hidden
            />
          </button>

          {showQuickActions ? (
            <div
              role="menu"
              className="absolute end-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border py-1.5 z-50 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowQuickActions(false);
                  onOpenCreateStore();
                }}
                className="w-full px-3 py-2 text-start hover:opacity-80 flex items-center gap-2 cursor-pointer font-bold"
              >
                <Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
                <span>{t('createNewStoreAction')}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setShowQuickActions(false);
                  await softRefreshTenantData();
                }}
                className="w-full px-3 py-2 text-start hover:opacity-80 flex items-center gap-2 cursor-pointer font-medium"
                style={{ color: 'var(--accent)' }}
              >
                <RefreshCw className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
                <span>{locale === 'ar' ? 'مزامنة وتحديث البيانات' : 'Sync Master Data'}</span>
              </button>
              <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                {t('impersonateStore')}
              </div>
              {stores.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowQuickActions(false);
                    switchToStore(s.id);
                  }}
                  className="w-full px-3 py-1.5 text-start hover:opacity-80 flex items-center justify-between cursor-pointer gap-2"
                >
                  <span className="truncate font-medium">{getStoreDisplayName(s, locale)}</span>
                  <span className="text-[10px] font-mono shrink-0 opacity-70">{s.id}</span>
                </button>
              ))}
              {stores.length > 8 ? (
                <p className="px-3 py-1.5 text-[10px]" style={{ color: 'var(--muted)' }}>
                  +{stores.length - 8} · {t('searchStoresSwitch')}
                </p>
              ) : null}
              {stores.length === 0 ? (
                <p className="px-3 py-2 text-[10px]" style={{ color: 'var(--muted)' }}>
                  {t('noStoresMatch')}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative shrink-0" ref={notifyRef}>
          <button
            type="button"
            title={t('notifications')}
            aria-label={t('notifications')}
            aria-expanded={showNotifications}
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-1.5 sm:p-2 rounded-xl transition-opacity cursor-pointer hover:opacity-80"
            style={{ color: 'var(--muted)' }}
          >
            <Bell className="w-4 h-4" aria-hidden />
            {notifyCount > 0 && (
              <span
                className="absolute top-1 end-1 min-w-4 h-4 px-1 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 shadow-xs"
                style={{
                  background: 'var(--tone-danger)',
                  borderColor: 'var(--surface)',
                }}
              >
                {notifyCount > 9 ? '9+' : notifyCount}
              </span>
            )}
          </button>
          {showNotifications ? (
            <div
              role="menu"
              className="absolute end-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border py-2 z-50 text-xs shadow-2xl max-h-[min(24rem,70vh)] overflow-y-auto"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <div
                className="px-3 py-2 border-b flex items-center justify-between gap-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="font-bold">{t('notifications')}</span>
                {onNavigateTab ? (
                  <button
                    type="button"
                    className="text-[10px] font-semibold hover:underline"
                    style={{ color: 'var(--accent)' }}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigateTab('notifications');
                    }}
                  >
                    {t('masterAlertsCenter')}
                  </button>
                ) : null}
              </div>
              {notifyRows.length === 0 ? (
                <p className="px-3 py-6 text-center" style={{ color: 'var(--muted)' }}>
                  {t('masterNoAlerts')}
                </p>
              ) : (
                notifyRows.slice(0, 12).map((row) => {
                  const id = String(row.id || '');
                  const title = String(row.title || (isAr ? 'تنبيه' : 'Alert'));
                  const desc = String(row.description || '');
                  const at = row.created_at ? formatRelativeTime(String(row.created_at), locale) : '';
                  const isNew = String(row.status || '') === 'New';
                  return (
                    <div
                      key={id || title}
                      className="px-3 py-2 border-b last:border-b-0"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{
                            background: isNew ? 'var(--tone-danger)' : 'var(--muted)',
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] leading-snug">{title}</div>
                          {desc ? (
                            <p className="text-[10px] mt-0.5 opacity-80 line-clamp-2">{desc}</p>
                          ) : null}
                          {at ? <div className="text-[9px] mt-1 opacity-60">{at}</div> : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          title={t('messages')}
          aria-label={t('messages')}
          className="relative p-1.5 sm:p-2 rounded-xl transition-opacity cursor-pointer hover:opacity-80 shrink-0 hidden md:inline-flex items-center justify-center"
          style={{ color: 'var(--muted)' }}
        >
          <Mail className="w-4 h-4" aria-hidden />
        </button>

        <div className="h-5 w-px hidden lg:block opacity-60" style={{ background: 'var(--border)' }} aria-hidden />

        <div className="shrink-0 max-w-full">
          <PrefsSwitcher compact variant="default" />
        </div>

        <div className="h-5 w-px hidden lg:block opacity-60" style={{ background: 'var(--border)' }} aria-hidden />

        <div className="flex items-center gap-1.5 sm:gap-2 ps-0.5 min-w-0 shrink-0">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold flex items-center justify-center text-xs border shrink-0 text-white shadow-2xs"
            style={{
              background: 'var(--portal-cta)',
              borderColor: 'color-mix(in srgb, var(--portal-400) 40%, transparent)',
            }}
            aria-hidden
            title={`${displayName} · ${roleLabel}`}
          >
            {initials}
          </div>
          <div className="hidden 2xl:block text-start leading-tight min-w-0 max-w-[9rem]">
            <span className="text-xs font-bold block truncate" style={{ color: 'var(--text)' }}>
              {displayName}
            </span>
            <span className="text-[10px] font-medium block truncate" style={{ color: 'var(--accent)' }}>
              {roleLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSignOut();
          }}
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-black cursor-pointer transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95 border shrink-0 shadow-2xs"
          style={{
            background: 'color-mix(in srgb, var(--tone-danger, #ef4444) 14%, var(--surface))',
            borderColor: 'color-mix(in srgb, var(--tone-danger, #ef4444) 40%, var(--border))',
            color: 'var(--tone-danger, #ef4444)',
          }}
          aria-label={t('signOut')}
          title={locale === 'ar' ? 'تسجيل الخروج' : t('signOut')}
        >
          <LogOut className="w-3.5 h-3.5 rtl:rotate-180 shrink-0 stroke-[2.5]" aria-hidden />
        </button>
      </div>
    </header>
  );
};
