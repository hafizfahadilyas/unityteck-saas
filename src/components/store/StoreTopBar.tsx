import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  Search,
  Zap,
  Bell,
  Mail,
  ChevronDown,
  LogOut,
  ArrowLeft,
  Globe,
  Package,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { readAuthSession } from '../../auth/session';
import { useToast } from '../common/ToastProvider';

interface StoreTopBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  canAccessMaster?: boolean;
  onSignOut: () => void;
  onOpenStorefront?: () => void;
  onOpenProducts?: () => void;
  onCustomizeTheme?: () => void;
}

/**
 * S1 — Store Header: same Holst white bar as Master (docs/21 paired).
 * Search · Quick Actions · bell · mail · AR/EN · dark/light · avatar · Logout.
 * Brand in sidebar. Back-to-Master only when master session.
 */
export const StoreTopBar: React.FC<StoreTopBarProps> = ({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  canAccessMaster = false,
  onSignOut,
  onOpenStorefront,
  onOpenProducts,
  onCustomizeTheme,
}) => {
  const { activeStore, currentOrders, switchToMaster } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const session = readAuthSession();
  const placeholder = searchPlaceholder || t('searchStore');

  const [showQuickActions, setShowQuickActions] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifyRef = useRef<HTMLDivElement>(null);

  const displayName = session?.user?.name || activeStore.owner || activeStore.name;
  const roleLabel = useMemo(() => {
    const raw = (session?.user?.role_label || session?.user?.role || '').toLowerCase();
    if (raw.includes('super')) return t('roleSuperAdmin');
    if (raw.includes('manager')) return t('roleManager');
    if (raw.includes('owner')) return t('roleStoreOwner');
    if (raw.includes('cashier')) return t('roleCashier');
    return session?.user?.role_label || t('storeAdmin');
  }, [session, t]);
  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (displayName || activeStore.name || 'ST').slice(0, 2).toUpperCase();
  }, [displayName, activeStore.name]);

  const pending = currentOrders.filter((o) => o.status === 'pending').length;
  const notifyCount = Math.min(9, pending || currentOrders.length);

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
    const onDoc = (e: MouseEvent) => {
      if (!notifyRef.current?.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showNotifications]);

  const recentNotifications = useMemo(() => {
    const pendingOrders = currentOrders.filter((o) => o.status === 'pending');
    return (pendingOrders.length ? pendingOrders : currentOrders).slice(0, 5);
  }, [currentOrders]);

  return (
    <header
      className="h-16 border-b px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
      data-chrome="store-topbar"
    >
      <div className="flex-1 max-w-md relative min-w-0">
        <Search
          className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--muted)' }}
          aria-hidden
        />
        <input
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full ps-9 pe-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all border"
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
          aria-label={placeholder}
        />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {canAccessMaster ? (
          <button
            type="button"
            onClick={switchToMaster}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer border hover:opacity-90"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
              borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
              color: 'var(--text)',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" style={{ color: 'var(--accent)' }} />
            <span>{t('backToMaster')}</span>
          </button>
        ) : null}

        {onCustomizeTheme ? (
          <button
            type="button"
            onClick={onCustomizeTheme}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-95 hover:scale-[1.02] cursor-pointer shadow-xs text-white"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            }}
            title={isAr ? 'تخصيص الثيم ومحرر الصفحات البصري' : 'Customize Theme & Visual Page Builder'}
          >
            <Palette className="w-3.5 h-3.5 text-white" />
            <span className="inline">{isAr ? 'تخصيص الثيم' : 'Customize Theme'}</span>
          </button>
        ) : null}

        <div className="relative" ref={quickRef}>
          <button
            type="button"
            onClick={() => setShowQuickActions((v) => !v)}
            aria-expanded={showQuickActions}
            aria-haspopup="menu"
            className="flex items-center gap-2 px-3.5 py-2 text-white rounded-xl text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer active:scale-[0.98]"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Zap className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden md:inline">{t('quickActions')}</span>
            <ChevronDown
              className="w-3 h-3 opacity-80 transition-transform"
              style={{ transform: showQuickActions ? 'rotate(180deg)' : undefined }}
              aria-hidden
            />
          </button>

          {showQuickActions ? (
            <div
              role="menu"
              className="absolute end-0 mt-2 w-52 rounded-xl border py-1.5 z-40 text-xs"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              {onCustomizeTheme ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowQuickActions(false);
                    onCustomizeTheme();
                  }}
                  className="w-full px-3 py-2 text-start hover:opacity-80 flex items-center gap-2 cursor-pointer font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  <Palette className="w-4 h-4 text-emerald-600" aria-hidden />
                  <span>{isAr ? 'تخصيص الثيم والمحرر البصري' : 'Customize Theme'}</span>
                </button>
              ) : null}
              {onOpenStorefront ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowQuickActions(false);
                    onOpenStorefront();
                  }}
                  className="w-full px-3 py-2 text-start hover:opacity-80 flex items-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
                  <span>{t('navLiveStorefront')}</span>
                </button>
              ) : null}
              {onOpenProducts ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowQuickActions(false);
                    onOpenProducts();
                  }}
                  className="w-full px-3 py-2 text-start hover:opacity-80 flex items-center gap-2 cursor-pointer"
                >
                  <Package className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
                  <span>{t('navProducts')}</span>
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowQuickActions(false);
                  try {
                    const keysToRemove: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const k = localStorage.key(i);
                      if (k && (k.startsWith('unityteck_') || k.startsWith('selia_') || k.includes('theme') || k.includes('cache'))) {
                        if (!k.includes('token') && !k.includes('session')) {
                          keysToRemove.push(k);
                        }
                      }
                    }
                    keysToRemove.forEach((k) => localStorage.removeItem(k));
                    sessionStorage.clear();
                    window.dispatchEvent(new CustomEvent('unityteck-theme-settings'));
                    window.dispatchEvent(new CustomEvent('unityteck-data', { detail: { tag: `store:${activeStore.id}:all` } }));
                    toast(
                      isAr ? 'تم تنظيف الكاش بنجاح وتحديث كافة البيانات!' : 'Cache purged & live data reloaded!',
                      'success',
                    );
                  } catch {
                    toast('Cache cleared', 'success');
                  }
                }}
                className="w-full px-3 py-2 text-start hover:opacity-80 flex items-center gap-2 cursor-pointer text-amber-600"
              >
                <RefreshCw className="w-4 h-4 text-amber-500" aria-hidden />
                <span>{isAr ? 'تنظيف الكاش وتحديث' : 'Purge Cache & Refresh'}</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={notifyRef}>
          <button
            type="button"
            title={t('notifications')}
            aria-label={t('notifications')}
            aria-expanded={showNotifications}
            aria-haspopup="menu"
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 rounded-xl transition-opacity cursor-pointer hover:opacity-80"
            style={{ color: 'var(--muted)' }}
          >
            <Bell className="w-4 h-4" aria-hidden />
            {notifyCount > 0 ? (
              <span
                className="absolute top-1.5 end-1.5 min-w-4 h-4 px-0.5 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2"
                style={{
                  background: 'var(--tone-danger)',
                  borderColor: 'var(--surface)',
                }}
              >
                {notifyCount}
              </span>
            ) : null}
          </button>

          {showNotifications ? (
            <div
              role="menu"
              className="absolute end-0 mt-2 w-72 rounded-xl border py-1.5 z-40 text-xs"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div
                className="px-3 py-2 font-bold border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <span>{t('notifications')}</span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
                  {isAr ? `${pending} طلبات معلقة` : `${pending} pending orders`}
                </span>
              </div>
              {recentNotifications.length === 0 ? (
                <p className="px-3 py-4 text-center" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                </p>
              ) : (
                recentNotifications.map((o) => (
                  <div key={o.id} className="px-3 py-2 flex items-start gap-2">
                    <Package className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {isAr ? `طلب جديد ${o.orderNumber}` : `New order ${o.orderNumber}`}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>
                        {o.customerName} · {o.total.toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          title={t('messages')}
          aria-label={t('messages')}
          onClick={() =>
            toast(
              isAr ? 'لا توجد رسائل جديدة في صندوق الوارد' : 'No new messages in your inbox',
              'info',
            )
          }
          className="relative p-2 rounded-xl transition-opacity cursor-pointer hover:opacity-80"
          style={{ color: 'var(--muted)' }}
        >
          <Mail className="w-4 h-4" aria-hidden />
        </button>

        <div className="h-6 w-px hidden sm:block" style={{ background: 'var(--border)' }} aria-hidden />

        <PrefsSwitcher compact variant="default" />

        <div className="h-6 w-px hidden sm:block" style={{ background: 'var(--border)' }} aria-hidden />

        <div className="flex items-center gap-2 ps-0.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs border shrink-0 text-white"
            style={{
              background: 'var(--portal-cta)',
              borderColor: 'color-mix(in srgb, var(--portal-400) 40%, transparent)',
            }}
            aria-hidden
          >
            {initials}
          </div>
          <div className="hidden sm:block text-start leading-tight min-w-0">
            <span
              className="text-xs font-bold block truncate max-w-[8rem]"
              style={{ color: 'var(--text)' }}
            >
              {displayName}
            </span>
            <span className="text-[10px] font-medium block truncate max-w-[8rem]" style={{ color: 'var(--accent)' }}>
              {roleLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onSignOut();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-opacity hover:opacity-90 active:scale-[0.98] border"
          style={{
            background: 'color-mix(in srgb, var(--tone-danger) 12%, var(--surface))',
            borderColor: 'color-mix(in srgb, var(--tone-danger) 35%, var(--border))',
            color: 'var(--tone-danger)',
          }}
          aria-label={t('signOut')}
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden />
          <span className="hidden md:inline">{t('signOut')}</span>
        </button>
      </div>
    </header>
  );
};
