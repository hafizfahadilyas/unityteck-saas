import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  Search,
  Zap,
  Mail,
  ChevronDown,
  LogOut,
  ArrowLeft,
  Globe,
  Package,
  RefreshCw,
  Palette,
  ExternalLink,
  Store,
  ShieldCheck,
  X,
  Copy,
  Check,
  ShoppingCart,
  Settings,
  Sliders,
  ReceiptText,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { readAuthSession } from '../../auth/session';
import { useToast } from '../common/ToastProvider';
import { preloadVisualThemeBuilder } from './visualBuilder/preloadVisualBuilder';
import { BellDropdown } from '../../notification-system';

interface StoreTopBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  canAccessMaster?: boolean;
  onSignOut: () => void;
  onOpenStorefront?: () => void;
  onOpenProducts?: () => void;
  onCustomizeTheme?: (targetThemeId?: string, targetPage?: string) => void;
  onNavigateTab?: (tab: string) => void;
}

/**
 * Fully Responsive, Unified Store Header (TopBar):
 * - Fluid-width interactive search bar with Enter submit and clear button.
 * - Interactive Locked Store Identity Badge with quick info & actions popover.
 * - Responsive "Customize Theme" button (full on xl, compact on md-lg, in menus on mobile).
 * - "Quick Actions" dropdown with direct actions (Theme, Storefront, Products, Orders, Cache Purge).
 * - Notification Bell with tabbed dropdown.
 * - Messaging button (direct link to customer inquiries/WhatsApp hub).
 * - Language switcher & Dark/Light mode toggle.
 * - User Profile avatar with info menu.
 * - Dedicated high-contrast Sign Out (Logout) button (NEVER cut off, NEVER overflows).
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
  onNavigateTab,
}) => {
  const { activeStore, switchToMaster } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const session = readAuthSession();
  const placeholder = searchPlaceholder || t('searchStore');

  // Popover state
  const [showQuickActions, setShowQuickActions] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const storeInfoRef = useRef<HTMLDivElement>(null);

  const [copiedId, setCopiedId] = useState(false);

  const displayName = session?.user?.name || activeStore.owner || activeStore.name;
  const roleLabel = useMemo(() => {
    const raw = (session?.user?.role_label || session?.user?.role || '').toLowerCase();
    if (raw.includes('super')) return t('roleSuperAdmin');
    if (raw.includes('manager')) return t('roleManager');
    if (raw.includes('owner')) return t('roleStoreOwner');
    if (raw.includes('cashier')) return t('roleCashier');
    return session?.user?.role_label || (isAr ? 'مدير المتجر' : 'Store Admin');
  }, [session, t, isAr]);

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (displayName || activeStore.name || 'ST').slice(0, 2).toUpperCase();
  }, [displayName, activeStore.name]);

  // Click outside listener for all dropdowns
  useEffect(() => {
    if (!showQuickActions && !showProfileMenu && !showStoreInfo) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showQuickActions && !quickRef.current?.contains(target)) {
        setShowQuickActions(false);
      }
      if (showProfileMenu && !profileRef.current?.contains(target)) {
        setShowProfileMenu(false);
      }
      if (showStoreInfo && !storeInfoRef.current?.contains(target)) {
        setShowStoreInfo(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showQuickActions, showProfileMenu, showStoreInfo]);

  // Eagerly prefetch theme builder after topbar mounts
  useEffect(() => {
    if (onCustomizeTheme) {
      const timer = setTimeout(() => {
        preloadVisualThemeBuilder();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onCustomizeTheme]);

  const storeDisplayName = (isAr ? activeStore?.nameAr : activeStore?.nameEn) || activeStore?.name;

  const handleCopyStoreId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(activeStore.id);
      setCopiedId(true);
      toast(isAr ? 'تم نسخ معرف المتجر بنجاح' : 'Store ID copied to clipboard', 'success');
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast(isAr ? 'تعذر النسخ' : 'Failed to copy', 'error');
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    if (onNavigateTab) {
      if (/^#?\d+/.test(query) || query.toLowerCase().includes('ord-')) {
        onNavigateTab('orders');
      } else {
        onNavigateTab('products');
      }
    }
  };

  const handleOpenStorefrontUrl = () => {
    if (onOpenStorefront) {
      onOpenStorefront();
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const storeSlug = activeStore?.slug || (activeStore?.id === 'store-coffee' ? 'coffee' : activeStore?.id === 'store-bleco' ? 'bleco' : 'flowers');
    window.open(`${origin}/?store=${storeSlug}&fullscreen=1`, '_blank', 'noopener,noreferrer');
  };

  return (
    <header
      className="h-16 border-b px-2.5 sm:px-3.5 md:px-4 flex items-center justify-between gap-1.5 sm:gap-2 w-full bg-[var(--surface)] text-[var(--text)] border-[var(--border)] shrink-0 z-30 select-none"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
      data-chrome="store-topbar"
    >
      {/* 1. SEARCH BAR (Responsive fluid sizing, Enter to search, clearable) */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 min-w-[90px] sm:min-w-[130px] md:min-w-[150px] max-w-[200px] xl:max-w-xs relative shrink"
      >
        <button
          type="submit"
          aria-label={t('searchStore')}
          className="w-4 h-4 absolute start-2.5 sm:start-3 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity hover:opacity-100 opacity-60"
          style={{ color: 'var(--muted)' }}
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden />
        </button>
        <input
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearchSubmit();
          }}
          className="w-full ps-7 sm:ps-9 pe-6 sm:pe-7 py-1.5 sm:py-2 rounded-xl text-xs focus:outline-none transition-all border"
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
        {searchValue ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="w-4 h-4 absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label={isAr ? 'مسح البحث' : 'Clear search'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </form>

      {/* 2. ACTIONS & USER TOOLS (Responsive auto-compact, never overflows) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        
        {/* Back to Master Admin (Only for Super Admin viewing store) */}
        {canAccessMaster ? (
          <button
            type="button"
            onClick={switchToMaster}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border hover:opacity-90 transition-all shrink-0 shadow-2xs"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
              borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
              color: 'var(--text)',
            }}
            title={isAr ? 'العودة للوحة الإدارة الرئيسية' : 'Return to Master Admin'}
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" style={{ color: 'var(--accent)' }} />
            <span>{t('backToMaster')}</span>
          </button>
        ) : null}

        {/* LOCKED STORE IDENTITY BADGE (Interactive Info Popover & Quick Links) */}
        <div className="relative" ref={storeInfoRef}>
          <button
            type="button"
            onClick={() => setShowStoreInfo((v) => !v)}
            aria-expanded={showStoreInfo}
            aria-haspopup="dialog"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-[11px] font-bold shrink-0 cursor-pointer hover:opacity-90 transition-all shadow-2xs active:scale-[0.98]"
            style={{
              background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
              borderColor: 'color-mix(in srgb, var(--accent) 28%, var(--border))',
              color: 'var(--text)',
            }}
            title={`${storeDisplayName} (${activeStore?.id}) - ${isAr ? 'انقر لعرض التفاصيل' : 'Click for store info'}`}
          >
            <Store className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate max-w-[70px] xs:max-w-[85px] sm:max-w-[110px] md:max-w-[130px] xl:max-w-[160px]">
              {storeDisplayName}
            </span>
            <span
              className="hidden xl:inline text-[9px] font-mono px-1 py-0.2 rounded font-black shrink-0"
              style={{
                background: 'color-mix(in srgb, currentColor 14%, transparent)',
              }}
            >
              {activeStore?.id}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 hidden sm:block" />
          </button>

          {/* Store Quick Info Popover */}
          {showStoreInfo && (
            <div
              role="dialog"
              aria-label={isAr ? 'معلومات المتجر' : 'Store Information'}
              className="absolute end-0 mt-2 w-72 rounded-2xl border p-3 z-50 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600 font-bold shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs truncate">{storeDisplayName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{activeStore.domain || `${activeStore.slug}.saudi-stores.com`}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStoreInfo(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Store Details Grid */}
              <div className="p-2 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{isAr ? 'معرف المتجر' : 'Store ID'}:</span>
                  <button
                    type="button"
                    onClick={handleCopyStoreId}
                    className="font-mono font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    title={isAr ? 'نسخ المعرف' : 'Copy ID'}
                  >
                    <span>{activeStore.id}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-70" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{isAr ? 'الخطة' : 'Plan'}:</span>
                  <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    {activeStore.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{isAr ? 'الحالة' : 'Status'}:</span>
                  <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isAr ? 'نشط وقيد التشغيل' : 'Active & Live'}
                  </span>
                </div>
              </div>

              {/* Store Quick Actions */}
              <div className="space-y-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowStoreInfo(false);
                    handleOpenStorefrontUrl();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-start hover:bg-slate-500/10 flex items-center justify-between cursor-pointer font-bold transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{isAr ? 'زيارة المتجر المباشر' : 'Visit Live Storefront'}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </button>

                {onCustomizeTheme ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoreInfo(false);
                      onCustomizeTheme?.();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-start hover:bg-slate-500/10 flex items-center gap-2 cursor-pointer font-bold text-emerald-600 dark:text-emerald-400 transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{isAr ? 'محرر الثيم والصفحات' : 'Theme & Page Builder'}</span>
                  </button>
                ) : null}

                {onNavigateTab ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoreInfo(false);
                      onNavigateTab('themes');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-start hover:bg-slate-500/10 flex items-center gap-2 cursor-pointer font-bold transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إعدادات الثيم (١٨ شاشة تصميم)' : 'Theme Settings (18 Designs)'}</span>
                  </button>
                ) : null}

                {onNavigateTab ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoreInfo(false);
                      onNavigateTab('invoices');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-start hover:bg-slate-500/10 flex items-center gap-2 cursor-pointer transition-colors font-medium"
                  >
                    <ReceiptText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'الفواتير والمستندات' : 'Invoices & Documents'}</span>
                  </button>
                ) : null}

                {onNavigateTab ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoreInfo(false);
                      onNavigateTab('settings');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-start hover:bg-slate-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isAr ? 'إعدادات المتجر' : 'Store Settings'}</span>
                  </button>
                ) : null}

                {canAccessMaster ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoreInfo(false);
                      switchToMaster();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-start hover:bg-slate-500/10 flex items-center gap-2 cursor-pointer text-indigo-600 dark:text-indigo-400 border-t pt-2"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    <span>{t('backToMaster')}</span>
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* CUSTOMIZE THEME BUTTON (Responsive: icon+text on xl+, compact on md-lg) */}
        {onCustomizeTheme ? (
          <button
            type="button"
            onClick={() => onCustomizeTheme?.()}
            onMouseEnter={preloadVisualThemeBuilder}
            onPointerDown={preloadVisualThemeBuilder}
            onFocus={preloadVisualThemeBuilder}
            className="group relative overflow-hidden hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md hover:shadow-emerald-600/30 active:scale-[0.96] cursor-pointer select-none border border-emerald-400/30 shrink-0 shadow-xs"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            }}
            title={isAr ? 'تخصيص الثيم ومحرر الصفحات البصري' : 'Customize Theme & Visual Page Builder'}
          >
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
              aria-hidden
            />
            <Palette className="w-3.5 h-3.5 text-white transition-transform duration-300 ease-out group-hover:rotate-12 shrink-0" />
            <span className="hidden 2xl:inline font-bold tracking-tight">{isAr ? 'تخصيص الثيم' : 'Customize Theme'}</span>
            <span className="inline 2xl:hidden font-bold tracking-tight">{isAr ? 'الثيم' : 'Theme'}</span>
          </button>
        ) : null}

        {/* QUICK ACTIONS DROPDOWN (Responsive label) */}
        <div className="relative" ref={quickRef}>
          <button
            type="button"
            onClick={() => setShowQuickActions((v) => !v)}
            aria-expanded={showQuickActions}
            aria-haspopup="menu"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1.5 text-white rounded-xl text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer active:scale-[0.98] shrink-0 shadow-2xs"
            style={{ background: 'var(--portal-cta)' }}
            title={t('quickActions')}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span className="hidden 2xl:inline">{t('quickActions')}</span>
            <span className="inline 2xl:hidden hidden sm:inline">{isAr ? 'إجراءات' : 'Actions'}</span>
            <ChevronDown
              className="w-3 h-3 opacity-80 transition-transform shrink-0"
              style={{ transform: showQuickActions ? 'rotate(180deg)' : undefined }}
              aria-hidden
            />
          </button>

          {showQuickActions && (
            <div
              role="menu"
              className="absolute end-0 mt-2 w-56 rounded-2xl border py-1.5 z-50 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150"
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
                  onMouseEnter={preloadVisualThemeBuilder}
                  onClick={() => {
                    setShowQuickActions(false);
                    onCustomizeTheme?.();
                  }}
                  className="w-full px-3.5 py-2.5 text-start hover:opacity-85 flex items-center gap-2.5 cursor-pointer font-bold active:scale-[0.98] transition-transform"
                  style={{ color: 'var(--accent)' }}
                >
                  <Palette className="w-4 h-4 text-emerald-600" aria-hidden />
                  <span>{isAr ? 'تخصيص الثيم والمحرر البصري' : 'Customize Theme'}</span>
                </button>
              ) : null}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowQuickActions(false);
                  handleOpenStorefrontUrl();
                }}
                className="w-full px-3.5 py-2.5 text-start hover:opacity-85 flex items-center justify-between cursor-pointer border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
                  <span>{isAr ? 'عرض المتجر المباشر' : t('navLiveStorefront')}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {onNavigateTab ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowQuickActions(false);
                      onNavigateTab('products');
                    }}
                    className="w-full px-3.5 py-2 text-start hover:opacity-85 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Package className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
                    <span>{t('navProducts')}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowQuickActions(false);
                      onNavigateTab('orders');
                    }}
                    className="w-full px-3.5 py-2 text-start hover:opacity-85 flex items-center gap-2.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
                    <span>{t('navOrders')}</span>
                  </button>
                </>
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
                className="w-full px-3.5 py-2.5 text-start hover:opacity-85 flex items-center gap-2.5 cursor-pointer text-amber-600 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <RefreshCw className="w-4 h-4 text-amber-500" aria-hidden />
                <span>{isAr ? 'تنظيف الكاش وتحديث' : 'Purge Cache & Refresh'}</span>
              </button>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS BELL */}
        <BellDropdown onNavigateTab={onNavigateTab} />

        {/* INBOX MESSAGES (Interactive direct jump to WhatsApp / Customer Hub) */}
        <button
          type="button"
          title={isAr ? 'رسائل واستفسارات العملاء' : t('messages')}
          aria-label={t('messages')}
          onClick={() => {
            if (onNavigateTab) {
              onNavigateTab('whatsapp');
            } else {
              toast(
                isAr ? 'لا توجد رسائل جديدة في صندوق الوارد' : 'No new messages in your inbox',
                'info',
              );
            }
          }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-slate-500/10 text-slate-700 dark:text-slate-200 shrink-0"
        >
          <Mail className="w-4 h-4" aria-hidden />
        </button>

        {/* PREFERENCES: LANGUAGE & THEME */}
        <div className="h-4 w-px hidden xl:block opacity-40 mx-0.5" style={{ background: 'var(--border)' }} aria-hidden />
        <div className="shrink-0">
          <PrefsSwitcher compact variant="default" />
        </div>
        <div className="h-4 w-px hidden xl:block opacity-40 mx-0.5" style={{ background: 'var(--border)' }} aria-hidden />

        {/* 3. USER PROFILE (Avatar + popover menu; text shown on 2xl+ only to prevent header overflow) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((v) => !v)}
            aria-expanded={showProfileMenu}
            className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl hover:bg-slate-500/10 transition-colors cursor-pointer text-start min-w-0 shrink-0"
            title={displayName}
          >
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold flex items-center justify-center text-xs border shrink-0 text-white shadow-2xs"
              style={{
                background: 'var(--portal-cta)',
                borderColor: 'color-mix(in srgb, var(--portal-400) 40%, transparent)',
              }}
              aria-hidden
            >
              {initials}
            </div>
            <div className="hidden 2xl:block text-start leading-tight min-w-0 max-w-[6rem] 2xl:max-w-[7.5rem]">
              <span
                className="text-xs font-bold block truncate"
                style={{ color: 'var(--text)' }}
              >
                {displayName}
              </span>
              <span className="text-[10px] font-semibold block truncate" style={{ color: 'var(--accent)' }}>
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden 2xl:block shrink-0" />
          </button>

          {showProfileMenu && (
            <div
              role="menu"
              className="absolute end-0 mt-2 w-64 rounded-2xl border p-2.5 z-50 shadow-2xl text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div className="px-3 py-2 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-1">
                <div className="font-extrabold text-sm truncate">{displayName}</div>
                <div className="text-[11px] text-slate-500 truncate">{session?.user?.email || activeStore.ownerEmail || 'admin@giftshop-sa.com'}</div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{roleLabel} · {storeDisplayName}</span>
                </div>
              </div>

              {onNavigateTab ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigateTab('settings');
                  }}
                  className="w-full px-3 py-2 rounded-xl text-start font-medium hover:bg-slate-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAr ? 'إعدادات الحساب والمتجر' : 'Settings'}</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  handleOpenStorefrontUrl();
                }}
                className="w-full px-3 py-2 rounded-xl text-start font-medium hover:bg-slate-500/10 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'عرض المتجر المباشر' : t('navLiveStorefront')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  onSignOut();
                }}
                className="w-full px-3 py-2 rounded-xl text-start font-black text-rose-600 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <LogOut className="w-4 h-4 rtl:rotate-180 text-rose-600 shrink-0" />
                <span>{isAr ? 'تسجيل الخروج من الحساب' : t('signOut')}</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. DEDICATED HIGH-CONTRAST LOGOUT BUTTON (PERMANENTLY VISIBLE & UNCLIPPED ON ALL SCREENS) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSignOut();
          }}
          className="flex items-center justify-center gap-1.5 px-2.5 sm:px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95 border shrink-0 shadow-2xs"
          style={{
            background: 'color-mix(in srgb, var(--tone-danger, #ef4444) 14%, var(--surface))',
            borderColor: 'color-mix(in srgb, var(--tone-danger, #ef4444) 40%, var(--border))',
            color: 'var(--tone-danger, #ef4444)',
          }}
          title={isAr ? 'تسجيل الخروج من الحساب' : t('signOut')}
          aria-label={t('signOut')}
        >
          <LogOut className="w-3.5 h-3.5 rtl:rotate-180 shrink-0 stroke-[2.5]" aria-hidden />
          <span className="hidden xl:inline font-black">{isAr ? 'خروج' : t('signOut')}</span>
        </button>

      </div>
    </header>
  );
};
