import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  Search,
  ChevronDown,
  LogOut,
  ArrowLeft,
  Globe,
  Palette,
  ExternalLink,
  Store,
  ShieldCheck,
  X,
  Copy,
  Check,
  Settings,
  Sliders,
  ReceiptText,
  Sparkles,
  Menu,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { readAuthSession } from '../../auth/session';
import { useToast } from '../common/ToastProvider';
import { preloadVisualThemeBuilder } from './visualBuilder/preloadVisualBuilder';
import { BellDropdown } from '../../notification-system';
import { getStoreDisplayOwner, shortStoreOwnerName } from '../../utils/storeLocalization';
import { buildStorefrontHomeUrl } from '../../utils/storefrontLinks';

interface StoreTopBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  canAccessMaster?: boolean;
  onSignOut: () => void;
  onOpenStorefront?: () => void;
  onOpenProducts?: () => void;
  onCustomizeTheme?: (targetThemeId?: string, targetPage?: string) => void;
  onOpenThemeCustomizer?: (sectionId?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onMobileMenuOpen?: () => void;
}

/**
 * Fully Responsive, Unified Store Header (TopBar):
 * - Fluid-width interactive search bar with Enter submit and clear button.
 * - Interactive Locked Store Identity Badge with quick info & actions popover.
 * - Responsive "Customize Theme" button (lg+ only — hidden on mobile so header stays clean).
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
  onOpenThemeCustomizer,
  onNavigateTab,
  onMobileMenuOpen,
}) => {
  const { activeStore, switchToMaster } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const session = readAuthSession();
  // Locale-locked placeholder — never leave English search text in Arabic chrome.
  const placeholder =
    searchPlaceholder ||
    (isAr ? 'ابحث في منتجات وطلبات المتجر...' : 'Search store products, orders, metrics...');

  // Popover state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const storeInfoRef = useRef<HTMLDivElement>(null);

  const [copiedId, setCopiedId] = useState(false);

  // Locale-aware short owner name for ALL stores (EN UI → English only; AR UI → Arabic only)
  const displayName = useMemo(() => {
    const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);
    const localizedOwner = shortStoreOwnerName(
      getStoreDisplayOwner(activeStore, locale) ||
        (isAr
          ? activeStore.ownerAr || activeStore.owner || ''
          : activeStore.ownerEn || activeStore.owner || ''),
    );
    const sessionName = shortStoreOwnerName((session?.user?.name || '').trim());

    if (!sessionName) {
      return (
        localizedOwner ||
        shortStoreOwnerName(
          isAr ? activeStore.nameAr || activeStore.name : activeStore.nameEn || activeStore.name,
        ) ||
        activeStore.name
      );
    }

    // Session name in the wrong script for current UI language → localized short owner
    if (!isAr && hasArabic(sessionName)) return localizedOwner || sessionName;
    if (isAr && !hasArabic(sessionName)) {
      return shortStoreOwnerName(activeStore.ownerAr || '') || localizedOwner || sessionName;
    }
    // Prefer localized short owner when session is a long store brand title
    if (localizedOwner && sessionName.length > localizedOwner.length + 8) {
      return localizedOwner;
    }
    return localizedOwner || sessionName;
  }, [session, activeStore, isAr, locale]);

  const roleLabel = useMemo(() => {
    const raw = (session?.user?.role_label || session?.user?.role || '').toLowerCase();
    if (raw.includes('super')) return t('roleSuperAdmin');
    // Store portal primary account is the store owner (auth still uses role slug "manager")
    if (raw.includes('owner') || raw.includes('manager') || raw.includes('admin')) {
      return t('roleStoreOwner');
    }
    if (raw.includes('cashier') || raw.includes('support')) return t('roleCashier');
    return session?.user?.role_label || t('roleStoreOwner');
  }, [session, t]);

  const initials = useMemo(() => {
    // Prefer Latin ownerEn so chip stays Latin letters; isolate LTR so RTL chrome
    // never visually flips AR ↔ RA. Family-name first (Al-Sulaiman + Rayan → AR).
    const latinOwner = shortStoreOwnerName((activeStore.ownerEn || '').trim());
    const source =
      (latinOwner && !/[\u0600-\u06FF]/.test(latinOwner) ? latinOwner : '') ||
      (!/[\u0600-\u06FF]/.test(displayName) ? displayName : '') ||
      displayName ||
      activeStore.nameEn ||
      activeStore.name ||
      'ST';
    const parts = source.trim().split(/\s+/).filter(Boolean);
    let letters = '';
    if (parts.length >= 2) {
      const family = parts[parts.length - 1] || '';
      const given = parts[0] || '';
      letters = `${family[0] || ''}${given[0] || ''}`;
    } else {
      letters = source.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
    }
    return (letters || 'ST').toUpperCase();
  }, [displayName, activeStore.ownerEn, activeStore.name, activeStore.nameEn]);

  // Click outside listener for all dropdowns
  useEffect(() => {
    if (!showProfileMenu && !showStoreInfo) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showProfileMenu && !profileRef.current?.contains(target)) {
        setShowProfileMenu(false);
      }
      if (showStoreInfo && !storeInfoRef.current?.contains(target)) {
        setShowStoreInfo(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showProfileMenu, showStoreInfo]);

  // Desktop-only theme CTA — never mount on phone (unity-btn-primary used to fight Tailwind `hidden`).
  const [isDesktopChrome, setIsDesktopChrome] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktopChrome(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  // Do NOT eager-preload VisualThemeBuilder / customizer — those chunks crush mobile load.
  // Prefetch only on desktop hover / pointer intent.

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
    const storeSlug =
      activeStore?.slug ||
      (activeStore?.id === 'store-coffee'
        ? 'coffee'
        : activeStore?.id === 'store-bleco'
          ? 'bleco'
          : 'flowers');
    window.open(buildStorefrontHomeUrl({ storeSlug }), '_blank', 'noopener,noreferrer');
  };

  return (
    <header
      className="min-h-14 sm:h-16 px-2 sm:px-3.5 md:px-4 flex items-center justify-between gap-1 sm:gap-2.5 w-full max-w-full min-w-0 text-[var(--text)] shrink-0 z-50 select-none isolate overflow-x-clip"
      style={{
        background: 'var(--glass-fill, var(--bg))',
        border: 'none',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
        /* Outside main scroll — keep visible on iPhone Safari (no sticky under URL bar) */
        position: 'relative',
        paddingTop: 'max(0.35rem, env(safe-area-inset-top, 0px))',
      }}
      data-chrome="store-topbar"
      data-mobile-compact="1"
    >
      {onMobileMenuOpen ? (
        <button
          type="button"
          className="lg:hidden shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--input-bg)' }}
          aria-label={isAr ? 'فتح القائمة' : 'Open menu'}
          onClick={onMobileMenuOpen}
        >
          <Menu className="w-5 h-5" aria-hidden />
        </button>
      ) : null}
      {/* 1. SEARCH BAR (Responsive fluid sizing, Enter to search, clearable) */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 min-w-0 max-w-none sm:min-w-[130px] sm:max-w-[180px] md:max-w-[220px] xl:max-w-xs relative"
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
          className="w-full ps-7 sm:ps-9 pe-6 sm:pe-7 py-1.5 sm:py-2 rounded-full text-xs focus:outline-none transition-all border"
          style={{
            background: 'var(--glass-fill-strong, var(--input-bg))',
            borderColor: 'var(--glass-border, var(--border))',
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

      {/* 2. ACTIONS — mobile default = essentials only (bell + avatar). No theme/logout clutter. */}
      <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 flex-nowrap">
        
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

        {/* STORE BADGE — md+ only (mobile: open from avatar menu to avoid header overlap) */}
        <div className="relative hidden md:block" ref={storeInfoRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(false);
              setShowStoreInfo((v) => !v);
            }}
            aria-expanded={showStoreInfo}
            aria-haspopup="dialog"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold shrink-0 cursor-pointer hover:opacity-90 transition-all shadow-2xs active:scale-[0.98]"
            style={{
              background: 'var(--glass-fill-strong, color-mix(in srgb, var(--accent) 10%, var(--surface)))',
              borderColor: 'var(--glass-border, color-mix(in srgb, var(--accent) 28%, var(--border)))',
              color: 'var(--text)',
            }}
            title={`${storeDisplayName} (${activeStore?.id}) - ${isAr ? 'انقر لعرض التفاصيل' : 'Click for store info'}`}
          >
            <Store className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate max-w-[110px] md:max-w-[130px] xl:max-w-[160px]">
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
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Store Quick Info — desktop popover */}
          {showStoreInfo && (
            <div
              role="dialog"
              aria-label={isAr ? 'معلومات المتجر' : 'Store Information'}
              className="absolute end-0 mt-2 w-72 max-w-[min(18rem,calc(100vw-1.25rem))] rounded-2xl border p-3 z-[80] text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
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

                {/* Theme shortcuts — desktop/tablet only (mobile header stays lean) */}
                {onOpenThemeCustomizer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoreInfo(false);
                      onOpenThemeCustomizer('01_store_identity');
                    }}
                    className="hidden lg:flex w-full px-3 py-2 rounded-xl text-start hover:bg-emerald-500/15 items-center justify-between cursor-pointer font-bold text-emerald-700 dark:text-emerald-300 transition-colors bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>{isAr ? 'مخصص المظهر المباشر' : 'Live Theme Customizer'}</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-black">18</span>
                  </button>
                ) : null}

                {onCustomizeTheme ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoreInfo(false);
                      onCustomizeTheme?.();
                    }}
                    className="hidden lg:flex w-full px-3 py-2 rounded-xl text-start hover:bg-slate-500/10 items-center gap-2 cursor-pointer font-bold transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{isAr ? 'محرر المظهر والصفحات' : 'Theme & Page Builder'}</span>
                  </button>
                ) : null}

                {onNavigateTab ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStoreInfo(false);
                      onNavigateTab('themes');
                    }}
                    className="hidden lg:flex w-full px-3 py-2 rounded-xl text-start hover:bg-slate-500/10 items-center gap-2 cursor-pointer font-bold transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إعدادات المظهر (١٨ شاشة تصميم)' : 'Theme Settings (18 Designs)'}</span>
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

        {/* CUSTOMIZE THEME — desktop only (never in mobile header DOM) */}
        {onCustomizeTheme && isDesktopChrome ? (
          <button
            type="button"
            data-chrome-action="customize-theme"
            onClick={() => onCustomizeTheme?.()}
            onMouseEnter={preloadVisualThemeBuilder}
            onPointerDown={preloadVisualThemeBuilder}
            onFocus={preloadVisualThemeBuilder}
            className="group relative overflow-hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:opacity-95 active:scale-[0.96] cursor-pointer select-none border shrink-0 shadow-xs unity-btn-primary"
            style={{
              borderColor: 'color-mix(in srgb, var(--portal-400) 40%, transparent)',
            }}
            title={isAr ? 'تخصيص المظهر ومحرر الصفحات البصري' : 'Customize Theme & Visual Page Builder'}
          >
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
              aria-hidden
            />
            <Palette className="w-3.5 h-3.5 text-white transition-transform duration-300 ease-out group-hover:rotate-12 shrink-0" />
            <span className="hidden 2xl:inline font-bold tracking-tight">{isAr ? 'تخصيص المظهر' : 'Customize Theme'}</span>
            <span className="inline 2xl:hidden font-bold tracking-tight">{isAr ? 'المظهر' : 'Theme'}</span>
          </button>
        ) : null}

        {/* NOTIFICATIONS BELL — essential on mobile */}
        <BellDropdown onNavigateTab={onNavigateTab} />

        {/* PREFERENCES — md+ ; mobile uses profile sheet */}
        <div className="h-4 w-px hidden xl:block opacity-40 mx-0.5" style={{ background: 'var(--border)' }} aria-hidden />
        <div className="hidden md:block shrink-0">
          <PrefsSwitcher compact variant="default" />
        </div>
        <div className="h-4 w-px hidden xl:block opacity-40 mx-0.5" style={{ background: 'var(--border)' }} aria-hidden />

        {/* 3. USER PROFILE — essential on mobile (sheet holds store + prefs + logout) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowStoreInfo(false);
              setShowProfileMenu((v) => !v);
            }}
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
              <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                {initials}
              </span>
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

          {showProfileMenu ? (
            <>
              {/* Mobile: full-width sheet + backdrop — never overlap page chrome */}
              <button
                type="button"
                className="md:hidden fixed inset-0 z-[70] bg-black/35 backdrop-blur-[1px]"
                aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
                onClick={() => setShowProfileMenu(false)}
              />
              <div
                role="menu"
                className="fixed inset-x-3 top-[max(3.75rem,calc(env(safe-area-inset-top,0px)+3.25rem))] z-[80] max-h-[min(70dvh,28rem)] overflow-y-auto overscroll-contain rounded-2xl border p-2.5 text-xs space-y-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 md:absolute md:inset-x-auto md:end-0 md:top-auto md:mt-2 md:w-64 md:max-h-none md:overflow-visible"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div className="px-3 py-2 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-1">
                  <div className="font-extrabold text-sm truncate">{displayName}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {session?.user?.email || activeStore.ownerEmail || '—'}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{roleLabel} · {storeDisplayName}</span>
                  </div>
                </div>

                <div className="md:hidden px-1 pb-1">
                  <PrefsSwitcher compact variant="default" expandInline />
                </div>

                {/* Mobile-only: store + live storefront (header stays lean) */}
                <button
                  type="button"
                  className="md:hidden w-full px-3 py-2 rounded-xl text-start font-medium hover:bg-slate-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleOpenStorefrontUrl();
                  }}
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAr ? 'زيارة المتجر المباشر' : 'Visit Live Storefront'}</span>
                </button>

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
                  className="hidden md:flex w-full px-3 py-2 rounded-xl text-start font-medium hover:bg-slate-500/10 items-center gap-2 cursor-pointer transition-colors"
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
            </>
          ) : null}
        </div>

        {/* Logout — tablet/desktop only (mobile uses profile sheet) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSignOut();
          }}
          className="hidden md:flex items-center justify-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95 border shrink-0 shadow-2xs"
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
