import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import {
  announcementButtonLabel,
  announcementMessageLabel,
  eligibleAnnouncements,
  type AnnouncementBarSettings,
  type AnnouncementMessage,
} from '../../settings/themeSettingsStore';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import {
  Search,
  ShoppingBag,
  User,
  Heart,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Palette
} from 'lucide-react';
import {
  StorefrontAccountMenu,
  type StorefrontAccountSection,
} from '../../../components/storefront/StorefrontAccountMenu';
import { isolateStoreProductImage } from '../../../utils/storeImageIsolation';
import { coffeeIsolatedCardImage } from '../utils/coffeeIsolatedImage';
import { normalizeFlexibleHref } from '../../settings/storeContact';

type MegaMenuKey = 'machines' | 'mills' | 'cabinets' | 'accessories' | 'offers' | 'explore' | null;

const FLOWER_ANN =
  /Use code MKS|Get 50% OFF|Makkah|Holland|Flowers|floral|bouquet|باقات|زهور/i;

function CoffeeAnnouncementStrip({
  language,
  bar,
  headerAnn,
}: {
  language: string;
  bar?: AnnouncementBarSettings | null;
  headerAnn?: { enabled?: boolean; bgColor?: string; textColor?: string; messages?: AnnouncementMessage[] } | null;
}) {
  const isAr = language === 'AR';
  const locale = isAr ? 'ar' : 'en';
  const eligible = (eligibleAnnouncements(bar || undefined, locale) || []).filter(
    (m) => !FLOWER_ANN.test(`${m.text || ''} ${m.textEn || ''} ${m.textAr || ''}`),
  );
  // DF-02 — explicit enabled:false hides; otherwise show when eligible messages exist
  const useBar = Boolean(bar && bar.enabled !== false && eligible.length > 0);
  // Prefer Word C-ANN `announcementBar` when active; headerAnn is secondary
  const useHeader = Boolean(!useBar && headerAnn?.enabled && (headerAnn?.messages?.length || 0) > 0);
  const [idx, setIdx] = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (!useBar || bar?.displayMode === 'stacked' || eligible.length < 2) return;
    if (bar?.displayMode === 'single') return;
    const ms =
      bar?.animationSpeed === 'slow' ? 7000 : bar?.animationSpeed === 'fast' ? 3000 : 5000;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % eligible.length), ms);
    return () => window.clearInterval(t);
  }, [useBar, bar?.displayMode, bar?.animationSpeed, eligible.length]);

  if (dismissed || (!useBar && !useHeader)) return null;

  const deviceHide = [
    bar?.desktopVersion === false ? '@lg:hidden' : '',
    bar?.tabletVersion === false ? '@md:@max-lg:hidden' : '',
    bar?.mobileVersion === false ? '@max-md:hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const customPx = typeof bar?.heightPx === 'number' && bar.heightPx > 0 ? bar.heightPx : undefined;
  const heightPad =
    customPx
      ? ''
      : bar?.barHeight === 'compact'
        ? 'py-1.5'
        : bar?.barHeight === 'tall'
          ? 'py-3.5'
          : 'py-2';
  const heightStyle = customPx ? { minHeight: customPx, paddingTop: 8, paddingBottom: 8 } : undefined;
  const stickyCls = bar?.stickyOnScroll ? 'sticky top-0 z-[60]' : 'relative z-50';
  const widthCls =
    bar?.contentWidth === 'boxed' ? 'max-w-6xl mx-auto w-full px-4' : 'w-full';
  const ctaLabel = announcementButtonLabel(bar, locale);
  const ctaHref = normalizeFlexibleHref(bar?.buttonLink || '');
  const showCta = Boolean(bar?.showButton && ctaLabel && ctaHref);
  const showClose = Boolean(bar?.showCloseButton);

  const renderMsgLabel = (m: AnnouncementMessage) => {
    const label = announcementMessageLabel(m, locale);
    const href = normalizeFlexibleHref(m.link);
    if (!href) return <span>{label}</span>;
    const external = /^https?:/i.test(href);
    return (
      <a
        href={href}
        className="underline underline-offset-2 hover:opacity-90"
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {label}
      </a>
    );
  };

  const renderCta = () =>
    showCta ? (
      <a
        href={ctaHref}
        className="ms-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black bg-white/15 hover:bg-white/25 border border-white/30"
        target={/^https?:/i.test(ctaHref) ? '_blank' : undefined}
        rel={/^https?:/i.test(ctaHref) ? 'noopener noreferrer' : undefined}
      >
        {ctaLabel}
      </a>
    ) : null;

  const closeBtn = showClose ? (
    <button
      type="button"
      aria-label={language === 'AR' ? 'إغلاق الإعلان' : 'Close announcement'}
      className="ms-2 p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
      onClick={() => setDismissed(true)}
    >
      ×
    </button>
  ) : null;

  if (useBar && bar?.displayMode === 'stacked') {
    return (
      <div className={`${widthCls} ${stickyCls} ${deviceHide}`} data-ann-chrome="stacked">
        {eligible.map((m) => (
          <div
            key={m.id}
            style={{
              backgroundColor: m.bgColor || bar?.bgColor || '#000000',
              color: m.textColor || bar?.textColor || '#FFFFFF',
              ...heightStyle,
            }}
            className={`${heightPad} text-xs font-bold px-4 text-center flex items-center justify-center gap-2`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            {renderMsgLabel(m)}
            {renderCta()}
            {closeBtn}
          </div>
        ))}
      </div>
    );
  }

  if (useBar) {
    const safeIdx = Math.min(idx, Math.max(eligible.length - 1, 0));
    const m = eligible[safeIdx] || eligible[0];
    const mode = bar?.displayMode || 'rotate';
    return (
      <div
        style={{
          backgroundColor: m.bgColor || bar?.bgColor || '#000000',
          color: m.textColor || bar?.textColor || '#FFFFFF',
          ...heightStyle,
        }}
        className={`${widthCls} text-xs font-bold ${heightPad} px-4 text-center transition-all duration-300 ${stickyCls} ${deviceHide} flex items-center justify-center gap-2`}
        data-ann-chrome="bar"
      >
        {mode === 'single' && eligible.length > 1 ? (
          <button
            type="button"
            aria-label={language === 'AR' ? 'الإعلان السابق' : 'Previous announcement'}
            className="p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
            onClick={() => setIdx((i) => (i - 1 + eligible.length) % eligible.length)}
          >
            <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        {renderMsgLabel(m)}
        {renderCta()}
        {mode === 'single' && eligible.length > 1 ? (
          <button
            type="button"
            aria-label={language === 'AR' ? 'الإعلان التالي' : 'Next announcement'}
            className="p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
            onClick={() => setIdx((i) => (i + 1) % eligible.length)}
          >
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
        {closeBtn}
      </div>
    );
  }

  const bg = headerAnn?.bgColor || '#000000';
  const fg = headerAnn?.textColor || '#FFFFFF';
  const text = isAr
    ? (headerAnn?.messages?.[0]?.textAr || headerAnn?.messages?.[0]?.text || '').trim()
    : (headerAnn?.messages?.[0]?.textEn || headerAnn?.messages?.[0]?.text || '').trim();
  if (!text) return null;
  return (
    <div
      style={{ backgroundColor: bg, color: fg }}
      className="w-full text-xs font-bold py-2 px-4 text-center transition-all duration-300 relative z-50 flex items-center justify-center gap-2"
      data-ann-chrome="header-fallback"
    >
      <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
      <span>{text}</span>
    </div>
  );
}

interface MegaProductItem {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  isNew: boolean;
}

export const Header: React.FC = () => {
  const {
    cartCount,
    cartBump,
    setIsMiniCartOpen,
    setIsSearchOpen,
    navigateTo,
    language,
    setLanguage,
    toggleLanguage,
    currentRoute,
    user,
    products,
    logoutUser,
  } = useCart();
  const { activeStore } = useTenant();

  // Dynamic Mega Catalog from live products (AR/EN category + name matching)
  const dynamicMegaCatalog = useMemo(() => {
    const catalog: Record<string, Record<string, MegaProductItem[]>> = {
      machines: { latest: [], pro: [], compact: [], commercial: [] },
      mills: { latest: [], electric: [], manual: [], conical: [], flat: [] },
      cabinets: { latest: [], modern: [], luxury: [], cabinets: [], corners: [] },
      accessories: { latest: [], tools: [], cups: [], boltfilters: [] },
      offers: { latest: [], bundles: [], flash: [] },
    };

    (products || []).forEach((prod) => {
      const catKey = `${prod.category || ''} ${(prod as { categoryAr?: string }).categoryAr || ''} ${prod.name || ''} ${prod.nameAr || ''}`.toLowerCase();
      const rawImg =
        prod.colors?.[0]?.image ||
        prod.images?.[0] ||
        (prod as { image?: string }).image ||
        '';
      const safeImg = isolateStoreProductImage(
        (prod as { storeId?: string }).storeId || activeStore?.id || 'store-coffee',
        rawImg,
        { fallback: true },
      );
      const primaryImg = coffeeIsolatedCardImage(prod.id, safeImg);

      const item: MegaProductItem = {
        id: prod.id,
        name: prod.name,
        nameAr: prod.nameAr || prod.name,
        image: primaryImg,
        isNew: Boolean(prod.badge || (prod.originalPrice && prod.originalPrice > prod.basePrice)),
      };

      const isMachine =
        /machine|espresso|barista|مكائن|إسبريسو|اسبريسو|قهوة/.test(catKey) &&
        !/mill|grind|مطح|cabinet|دواليب|ركن|cup|كوب|access|مستلزم/.test(catKey);
      const isMill = /mill|grind|مطح/.test(catKey);
      const isCabinet = /cabinet|corner|station|oak|دواليب|أركان|ركن/.test(catKey);
      const isAccessory = /access|cup|tool|portafilter|مستلزم|أكواب|كوب|فلتر/.test(catKey);

      if (isMachine || (!isMill && !isCabinet && !isAccessory)) {
        catalog.machines.latest.push(item);
        if (prod.basePrice > 1000 || /pro|h7a|commercial|تجار|58/.test(catKey)) {
          catalog.machines.pro.push(item);
          catalog.machines.commercial.push(item);
        } else {
          catalog.machines.compact.push(item);
        }
      }
      if (isMill) {
        catalog.mills.latest.push(item);
        catalog.mills.electric.push(item);
        if (/conical|مخروط/.test(catKey)) catalog.mills.conical.push(item);
        else if (/flat|مسطح/.test(catKey)) catalog.mills.flat.push(item);
        else {
          catalog.mills.conical.push(item);
          catalog.mills.flat.push(item);
        }
      }
      if (isCabinet) {
        catalog.cabinets.latest.push(item);
        catalog.cabinets.luxury.push(item);
        catalog.cabinets.cabinets.push(item);
        catalog.cabinets.corners.push(item);
      }
      if (isAccessory) {
        catalog.accessories.latest.push(item);
        if (/cup|كوب/.test(catKey)) catalog.accessories.cups.push(item);
        else if (/filter|فلتر|porta/.test(catKey)) catalog.accessories.boltfilters.push(item);
        else catalog.accessories.tools.push(item);
      }

      if (prod.originalPrice && prod.originalPrice > prod.basePrice) {
        catalog.offers.latest.push(item);
        catalog.offers.flash.push(item);
        catalog.offers.bundles.push(item);
      }
    });

    return catalog;
  }, [products, activeStore?.id]);

  const [headerVersion, setHeaderVersion] = useState(0);

  useEffect(() => {
    const handleSync = () => setHeaderVersion((v) => v + 1);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'UNITYTECK_PREVIEW_SYNC') handleSync();
    });
    return () => {
      window.removeEventListener('unityteck-theme-settings', handleSync);
    };
  }, []);

  const allThemeSettings = useMemo(() => {
    try {
      if (!activeStore?.id) return null;
      return resolveCoffeeThemeSettings(activeStore.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, headerVersion]);

  const headerSettings = allThemeSettings?.customHeader;
  // Header chrome uses Store Colors / page-builder tokens: --theme-header-bg / --theme-header-text.

  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey>(null);
  const [renderedMegaMenu, setRenderedMegaMenu] = useState<MegaMenuKey>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileSubNavKey, setMobileSubNavKey] = useState<MegaMenuKey | null>(null);
  const [mobileSubFilter, setMobileSubFilter] = useState<string>('latest');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('latest');
  const [isScrolled, setIsScrolled] = useState(false);
  /** Page Builder canvas — no sticky, no nested announcement, mega mounts only while open */
  const [isBuilderCanvas, setIsBuilderCanvas] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const megaMenuContainerRef = useRef<HTMLDivElement | null>(null);
  const announcementRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const node = headerRef.current || announcementRef.current;
    if (!node) return;
    const inBuilder = Boolean(
      node.closest('.coffee-builder-preview') ||
        node.closest('[data-builder-header-preview]') ||
        node.closest('#theme-builder-canvas-scroll'),
    );
    setIsBuilderCanvas(inBuilder);
  }, [headerVersion]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveMegaMenu(null);
  }, [currentRoute]);

  useEffect(() => {
    const write = () => {
      const announcement = announcementRef.current?.getBoundingClientRect().height ?? 0;
      const header = headerRef.current?.getBoundingClientRect().height ?? 0;
      const px = `${Math.round(announcement + header)}px`;
      const root = headerRef.current?.closest('.hibrew-theme-root') as HTMLElement | null;
      root?.style.setProperty('--theme-chrome-offset', px);
      document.documentElement.style.setProperty('--theme-chrome-offset', px);
    };
    write();
    const observer = new ResizeObserver(write);
    if (announcementRef.current) observer.observe(announcementRef.current);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [language, headerVersion]);

  // Track window scroll for sticky border & shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clear hover timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeAnimationTimeoutRef.current) clearTimeout(closeAnimationTimeoutRef.current);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setMobileSubNavKey(null);
      setMobileSubFilter('latest');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Rock-solid glitch-free hover handlers with smooth slide-down and automatic slide-up
  const handleNavMouseEnter = (menuKey: MegaMenuKey) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (closeAnimationTimeoutRef.current) {
      clearTimeout(closeAnimationTimeoutRef.current);
      closeAnimationTimeoutRef.current = null;
    }
    setActiveMegaMenu(menuKey);
    setRenderedMegaMenu(menuKey);
    setIsMegaMenuOpen(true);
    setActiveSubFilter('latest');
  };

  const scheduleMenuClose = (delay = 180) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      // Trigger smooth slide-up animation
      setIsMegaMenuOpen(false);

      if (closeAnimationTimeoutRef.current) {
        clearTimeout(closeAnimationTimeoutRef.current);
      }
      closeAnimationTimeoutRef.current = setTimeout(() => {
        setActiveMegaMenu(null);
        setRenderedMegaMenu(null);
      }, 300);
    }, delay);
  };

  const closeMenuImmediately = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (closeAnimationTimeoutRef.current) clearTimeout(closeAnimationTimeoutRef.current);
    setIsMegaMenuOpen(false);
    setActiveMegaMenu(null);
    setRenderedMegaMenu(null);
  };

  const isArLang = language === 'AR';
  const logoWord = headerSettings?.logo?.applyTitle
    ? ((isArLang ? headerSettings.logo.titleAr : headerSettings.logo.titleEn) || (isArLang ? 'هايبرو' : 'HIBREW'))
    : (isArLang ? 'هايبرو' : 'HIBREW');
  const logoUrl = headerSettings?.logo?.imageUrl || '';
  const uploadedLogo = headerSettings?.logo?.mode === 'image_only'
    && (logoUrl.includes('/stores/') || logoUrl.includes('?v='));
  const navLabel = (link: { labelAr?: string; labelEn?: string }) =>
    ((isArLang ? link.labelAr : link.labelEn) || '').trim();
  const navEnabled = headerSettings?.navigation?.enabled !== false;
  const showViewMoreButton = headerSettings?.navigation?.showViewMoreButton !== false;
  const viewMoreLabel = (
    isArLang
      ? headerSettings?.navigation?.viewMoreLabelAr
      : headerSettings?.navigation?.viewMoreLabelEn
  )?.trim();
  const customDesktop = (headerSettings?.navigation?.desktopLinks || [])
    .filter((link) => link.active !== false && navLabel(link));
  const customTablet = (headerSettings?.navigation?.tabletLinks || [])
    .filter((link) => link.active !== false && navLabel(link));
  const customMobile = (headerSettings?.navigation?.mobileLinks || [])
    .filter((link) => link.active !== false && navLabel(link));
  const hiddenNavKeys = new Set(
    (headerSettings?.navigation?.hiddenNavKeys || []).map((k) => String(k).toLowerCase()),
  );
  const showNavKey = (key: string) => !hiddenNavKeys.has(key.toLowerCase());
  const navLabelOverrides = headerSettings?.navigation?.navLabelOverrides || {};
  /** Locked coffee nav rename — empty override keeps HiBrew default. */
  const lockedNavLabel = (key: string, fallbackEn: string, fallbackAr: string) => {
    const o = navLabelOverrides[key] || navLabelOverrides[key.toLowerCase()];
    const custom = (isArLang ? o?.labelAr : o?.labelEn)?.trim();
    return custom || (isArLang ? fallbackAr : fallbackEn);
  };
  const extraNavLinks = (headerSettings?.navigation?.extraLinks || []).filter(
    (link) => link.active !== false && navLabel(link),
  );
  const megaMax = Math.min(12, Math.max(2, Number(headerSettings?.navigation?.menuMaxProducts) || 5));
  const megaSource = headerSettings?.navigation?.menuProductSource || 'category';
  const openShopWithHint = (hint: string) => {
    try {
      sessionStorage.setItem('unityteck-shop-cat-hint', hint);
    } catch {
      /* storage may be unavailable */
    }
    closeMenuImmediately();
    setMobileMenuOpen(false);
    navigateTo('products');
  };

  const followHeaderLink = (url?: string) => {
    closeMenuImmediately();
    setMobileMenuOpen(false);
    const value = (url || '').trim();
    if (!value || value === '/' || value === 'home') {
      navigateTo('home');
      return;
    }
    if (value === 'shop' || value === 'products') {
      navigateTo('products');
      return;
    }
    if (value === 'cart' || value === 'checkout' || value === 'reviews' || value === 'profile' || value === 'faq' || value === 'contact' || value === 'about') {
      navigateTo(value);
      return;
    }
    if (/^https?:\/\//i.test(value)) {
      window.open(value, '_blank', 'noopener,noreferrer');
      return;
    }
    // Relative / slug paths → known storefront routes
    const slug = value.replace(/^\//, '').split('?')[0].toLowerCase();
    if (slug) {
      navigateTo(slug === 'shop' ? 'products' : slug);
    }
  };

  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (closeAnimationTimeoutRef.current) {
      clearTimeout(closeAnimationTimeoutRef.current);
      closeAnimationTimeoutRef.current = null;
    }
    setIsMegaMenuOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    scheduleMenuClose(150);
  };

  const handleHeaderMouseLeave = (e: React.MouseEvent) => {
    const related = e.relatedTarget;
    if (
      megaMenuContainerRef.current &&
      related instanceof Node &&
      megaMenuContainerRef.current.contains(related)
    ) {
      return;
    }
    scheduleMenuClose(160);
  };

  // Get active products for current mega menu and sub-filter (store catalog only)
  const currentMenu = renderedMegaMenu || activeMegaMenu || 'machines';
  const megaOverrides = headerSettings?.navigation?.menuProductOverrides || {};
  const applyMegaOverride = (item: MegaProductItem): MegaProductItem => {
    const ov = megaOverrides[item.id];
    if (!ov) return item;
    return {
      ...item,
      image: (ov.image || '').trim() || item.image,
      name: (ov.nameEn || '').trim() || item.name,
      nameAr: (ov.nameAr || '').trim() || item.nameAr,
    };
  };
  const getActiveProducts = (): MegaProductItem[] => {
    const menuToUse = renderedMegaMenu || activeMegaMenu || 'machines';
    if (!menuToUse || menuToUse === 'explore') return [];
    const cat = dynamicMegaCatalog[menuToUse];
    if (!cat) return [];
    if (megaSource === 'manual') {
      const ids = (headerSettings?.navigation?.menuProductIds || []).filter(Boolean);
      // Prefer full store catalog so picks work across Machines / Accessories / etc.
      const byId = new Map<string, MegaProductItem>();
      (products || []).forEach((prod) => {
        const rawImg =
          prod.colors?.[0]?.image ||
          prod.images?.[0] ||
          (prod as { image?: string }).image ||
          '';
        const safeImg = isolateStoreProductImage(
          (prod as { storeId?: string }).storeId || activeStore?.id || 'store-coffee',
          rawImg,
          { fallback: true },
        );
        byId.set(prod.id, {
          id: prod.id,
          name: prod.name,
          nameAr: prod.nameAr || prod.name,
          image: coffeeIsolatedCardImage(prod.id, safeImg),
          isNew: Boolean(prod.badge || (prod.originalPrice && prod.originalPrice > prod.basePrice)),
        });
      });
      Object.values(cat).flat().forEach((p) => {
        if (!byId.has(p.id)) byId.set(p.id, p);
      });
      const picked = ids
        .map((id) => {
          const row = byId.get(id);
          return row ? applyMegaOverride(row) : null;
        })
        .filter((p): p is MegaProductItem => Boolean(p));
      if (picked.length) return picked.slice(0, megaMax);
    }
    if (megaSource === 'latest') {
      return (cat.latest || []).slice(0, megaMax).map(applyMegaOverride);
    }
    const bucket = cat[activeSubFilter] || cat.latest || [];
    return bucket.slice(0, megaMax).map(applyMegaOverride);
  };

  const activeProducts = getActiveProducts();

  return (
    <>
      {/* 0. PROMO BAR — Word C-ANN. Skip inside Page Builder (own announcement block). */}
      {!isBuilderCanvas ? (
        <div data-customize-section="C-ANN" ref={announcementRef}>
          <CoffeeAnnouncementStrip
            language={language}
            bar={allThemeSettings?.announcementBar}
            headerAnn={headerSettings?.announcement}
          />
        </div>
      ) : (
        <div ref={announcementRef} className="hidden" aria-hidden />
      )}

      {/* MAIN HEADER — builder: relative + isolated mega dropdown (no sticky overlap) */}
      <header
        ref={headerRef}
        data-theme-sticky-chrome
        data-customize-section="00_header_builder"
        data-builder-header={isBuilderCanvas ? '1' : '0'}
        data-mega-open={isMegaMenuOpen ? '1' : '0'}
        className={`${isBuilderCanvas ? 'relative' : 'sticky top-0'} z-50 w-full border-b border-neutral-200/80 transition-all duration-200 isolate ${
          isScrolled && !isBuilderCanvas ? 'shadow-[0_2px_15px_rgba(0,0,0,0.06)]' : ''
        } ${isMegaMenuOpen ? 'z-[70]' : ''}`}
        style={{ backgroundColor: 'var(--theme-header-bg, #FFFFFF)', color: 'var(--theme-header-text, #111111)' }}
        onMouseLeave={handleHeaderMouseLeave}
      >
        {/* Nav row stays above mega panel so dropdown never paints over logo/links */}
        <div
          className="max-w-[1440px] mx-auto px-3 sm:px-6 @lg:px-8 h-16 flex items-center justify-between gap-2 relative z-30 min-w-0 overflow-visible"
          style={{ backgroundColor: 'var(--theme-header-bg, #FFFFFF)', color: 'var(--theme-header-text, #111111)' }}
          data-header-nav-row="1"
        >
          {/* 1. Desktop Left: Brand Logo — container queries so Page Builder canvas width (not window) drives layout */}
          <div className="hidden @lg:flex items-center shrink-0 z-20 relative isolate" onMouseEnter={() => scheduleMenuClose(80)}>
            <button
              type="button"
              onClick={() => {
                closeMenuImmediately();
                setMobileMenuOpen(false);
                navigateTo('home');
              }}
              className="flex items-center gap-1.5 sm:gap-2 group focus:outline-hidden cursor-pointer text-start tracking-tight font-black text-xl sm:text-2xl font-sans text-black uppercase shrink-0 relative z-20 bg-[color:var(--theme-header-bg,#FFFFFF)]"
              title={logoWord}
            >
              {uploadedLogo ? (
                <img src={logoUrl} alt={logoWord} className="h-5 w-auto max-w-[120px] object-contain" />
              ) : (
                <>
                  <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-black shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <span className="tracking-tighter font-extrabold text-[19px] sm:text-[22px]">{logoWord}</span>
                </>
              )}
            </button>
          </div>

          {/* 1. Mobile Left: Hamburger + Cart + Search (Exact match with Image) */}
          <div className="flex @lg:hidden items-center gap-1 sm:gap-2 shrink-0">
            {/* Hamburger Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMegaMenu(null);
                setMobileMenuOpen((prev) => !prev);
              }}
              className="p-1.5 text-neutral-900 hover:text-black cursor-pointer active:scale-95 transition-transform"
              aria-label={language === 'AR' ? 'فتح القائمة' : 'Toggle Menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 stroke-[2]" /> : <Menu className="w-5 h-5 stroke-[2]" />}
            </button>

            {/* Shopping Bag with Badge */}
            <button
              id="header-mobile-cart-btn"
              type="button"
              onClick={() => {
                setActiveMegaMenu(null);
                setMobileMenuOpen(false);
                setIsMiniCartOpen(true);
              }}
              className="relative p-1.5 text-neutral-900 hover:text-black cursor-pointer active:scale-95 transition-transform"
              aria-label={language === 'AR' ? 'السلة' : 'Cart'}
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 -end-0.5 bg-black text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Search */}
            <button
              type="button"
              onClick={() => {
                setActiveMegaMenu(null);
                setMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="p-1.5 text-neutral-900 hover:text-black cursor-pointer active:scale-95 transition-transform"
              aria-label={language === 'AR' ? 'بحث' : 'Search'}
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>

          {/* 2b. Tablet custom links (md–lg) when merchant set tabletLinks */}
          {customTablet.length > 0 ? (
            <nav
              className={`hidden @md:flex @lg:hidden items-center justify-center flex-1 min-w-0 mx-2 gap-2 text-[12px] font-normal text-neutral-800 h-16 overflow-x-auto no-scrollbar ${
                navEnabled ? '' : 'invisible pointer-events-none'
              }`}
              data-main-menu-tablet={navEnabled ? 'on' : 'off'}
              aria-hidden={!navEnabled}
            >
              {customTablet.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => followHeaderLink(link.url)}
                  className="py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap text-neutral-700 hover:text-black font-normal"
                >
                  <span>{navLabel(link)}</span>
                </button>
              ))}
            </nav>
          ) : null}

          {/* 2. Center: Desktop Nav Items (Flex in-flow layout ensuring zero overlap in both RTL Arabic and LTR English) */}
          <nav
            className={`${customTablet.length > 0 ? 'hidden @lg:flex' : 'hidden @md:flex @lg:flex'} items-center justify-center flex-1 min-w-0 mx-2 @lg:mx-3 @xl:mx-4 gap-1.5 @lg:gap-2 @xl:gap-3 text-[12px] @lg:text-[12.5px] @xl:text-[13px] font-normal text-neutral-800 min-h-16 py-1 overflow-x-auto no-scrollbar relative z-10 leading-normal ${
              navEnabled ? '' : 'invisible pointer-events-none'
            }`}
            data-main-menu={navEnabled ? 'on' : 'off'}
            aria-hidden={!navEnabled}
          >
            {customDesktop.length > 0 ? customDesktop.map((link) => (
              <div key={link.id} className="relative h-full flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
                <button
                  type="button"
                  onClick={() => followHeaderLink(link.url)}
                  className="py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap text-neutral-700 hover:text-black font-normal"
                >
                  <span>{navLabel(link)}</span>
                </button>
              </div>
            )) : (
            <>
            {/* 0. Shop (المتجر) */}
            {showNavKey('shop') ? (
            <div className="relative h-full flex items-center shrink-0 ps-0.5" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                type="button"
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 px-1.5 transition-colors cursor-pointer relative whitespace-nowrap ${
                  currentRoute === 'products'
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black font-normal'
                }`}
              >
                <span className="relative z-[1]">{lockedNavLabel('shop', 'Shop', 'المتجر')}</span>
                {currentRoute === 'products' && (
                  <span className="absolute bottom-0 start-1.5 end-1.5 h-[2px] bg-black rounded-full pointer-events-none" />
                )}
              </button>
            </div>
            ) : null}

            {/* 1. Machines (مكائن القهوة) — Page Builder: click pins mega (hover can miss narrow canvas) */}
            {showNavKey('machines') ? (
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('machines')}
            >
              <button
                type="button"
                onClick={(e) => {
                  if (isBuilderCanvas) {
                    e.preventDefault();
                    handleNavMouseEnter('machines');
                    return;
                  }
                  openShopWithHint('machines');
                }}
                className={`py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'machines' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span className="relative z-[1]">{lockedNavLabel('machines', 'Machines', 'المكائن')}</span>
                {activeMegaMenu === 'machines' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 start-1 end-1 h-[2px] bg-black rounded-full pointer-events-none" />
                )}
              </button>
            </div>
            ) : null}

            {/* 2. Mills (مطاحن القهوة) */}
            {showNavKey('mills') ? (
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('mills')}
            >
              <button
                type="button"
                onClick={(e) => {
                  if (isBuilderCanvas) {
                    e.preventDefault();
                    handleNavMouseEnter('mills');
                    return;
                  }
                  openShopWithHint('mills');
                }}
                className={`py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'mills' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span className="relative z-[1]">{lockedNavLabel('mills', 'Mills', 'المطاحن')}</span>
                {activeMegaMenu === 'mills' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 start-1 end-1 h-[2px] bg-black rounded-full pointer-events-none" />
                )}
              </button>
            </div>
            ) : null}

            {/* 3. Cabinets (أركان ودواليب القهوة) */}
            {showNavKey('cabinets') ? (
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('cabinets')}
            >
              <button
                type="button"
                onClick={(e) => {
                  if (isBuilderCanvas) {
                    e.preventDefault();
                    handleNavMouseEnter('cabinets');
                    return;
                  }
                  openShopWithHint('cabinets');
                }}
                className={`py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'cabinets' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span className="relative z-[1]">{lockedNavLabel('cabinets', 'Coffee Bars', 'أركان ودواليب القهوة')}</span>
                {activeMegaMenu === 'cabinets' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 start-1 end-1 h-[2px] bg-black rounded-full pointer-events-none" />
                )}
              </button>
            </div>
            ) : null}

            {/* 4. Accessories (المستلزمات والأكواب) */}
            {showNavKey('accessories') ? (
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('accessories')}
            >
              <button
                type="button"
                onClick={(e) => {
                  if (isBuilderCanvas) {
                    e.preventDefault();
                    handleNavMouseEnter('accessories');
                    return;
                  }
                  openShopWithHint('accessories');
                }}
                className={`py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'accessories' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span className="relative z-[1]">{lockedNavLabel('accessories', 'Accessories', 'الأكواب والمستلزمات')}</span>
                {activeMegaMenu === 'accessories' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 start-1 end-1 h-[2px] bg-black rounded-full pointer-events-none" />
                )}
              </button>
            </div>
            ) : null}

            {/* 5. Offers (العروض والباقات) */}
            {showNavKey('offers') ? (
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('offers')}
            >
              <button
                type="button"
                onClick={(e) => {
                  if (isBuilderCanvas) {
                    e.preventDefault();
                    handleNavMouseEnter('offers');
                    return;
                  }
                  openShopWithHint('offers');
                }}
                className={`py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'offers' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span className="relative z-[1]">{lockedNavLabel('offers', 'HiBrew CHOICE', 'العروض والباقات')}</span>
                {activeMegaMenu === 'offers' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 start-1 end-1 h-[2px] bg-black rounded-full pointer-events-none" />
                )}
              </button>
            </div>
            ) : null}

            {/* 6. Smart AI Tech */}
            {showNavKey('ai') ? (
            <div className="h-full flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                onClick={() => {
                  closeMenuImmediately();
                  const el = document.getElementById('machine-story-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigateTo('home');
                }}
                className="py-2 inline-flex items-center gap-1 text-neutral-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{lockedNavLabel('ai', 'AI', 'الذكاء الاصطناعي')}</span>
                <Sparkles className="w-3.5 h-3.5 text-[color:var(--theme-accent,#C88A58)] fill-[color:var(--theme-accent,#C88A58)]/20" />
              </button>
            </div>
            ) : null}

            {/* 7. Business */}
            {showNavKey('business') ? (
            <div className="h-full hidden @xl:flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className="py-2 text-neutral-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{lockedNavLabel('business', 'Business', 'قطاع الأعمال')}</span>
              </button>
            </div>
            ) : null}

            {/* 8. Support */}
            {showNavKey('support') ? (
            <div className="h-full hidden @xl:flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('reviews');
                }}
                className="py-2 text-neutral-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{lockedNavLabel('support', 'Support', 'الدعم والضمان')}</span>
              </button>
            </div>
            ) : null}

            {/* Merchant extra links — keep locked mega items; append only */}
            {extraNavLinks.map((link) => (
              <div
                key={link.id}
                className="relative h-full flex items-center shrink-0"
                onMouseEnter={() => scheduleMenuClose(80)}
              >
                <button
                  type="button"
                  onClick={() => followHeaderLink(link.url)}
                  className="py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap text-neutral-700 hover:text-black font-normal"
                >
                  <span>{navLabel(link)}</span>
                </button>
              </div>
            ))}
            </>
            )}
          </nav>

          {/* 3. Desktop Right: Search, Wishlist, Cart, Profile, Store Pill, Language */}
          <div className="hidden @lg:flex items-center gap-1.5 sm:gap-3 @xl:gap-4 shrink-0 z-10" onMouseEnter={() => scheduleMenuClose(80)}>
            {/* Search Icon */}
            {headerSettings?.actions?.search?.enabled !== false && (
              <button
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  setMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="p-1.5 text-neutral-800 hover:text-black transition-colors cursor-pointer"
                title="Search"
                aria-label={language === 'AR' ? 'بحث' : 'Search'}
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>
            )}

            {/* Wishlist — hidden until real wishlist API exists (no fake navigate-to-shop) */}
            {false && headerSettings?.actions?.wishlist?.enabled !== false && (
              <button
                type="button"
                onClick={() => undefined}
                className="p-1.5 text-neutral-800 hover:text-red-500 transition-colors cursor-pointer"
                title={language === 'AR' ? 'قائمة الرغبات والمفضلة' : 'Wishlist'}
                aria-label={language === 'AR' ? 'المفضلة' : 'Wishlist'}
              >
                <Heart className="w-5 h-5 stroke-[1.8]" />
              </button>
            )}

            {/* Cart Icon with badge & Flying Cart Destination */}
            {headerSettings?.actions?.cart?.enabled !== false && (
              <button
                id="header-cart-btn"
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  setMobileMenuOpen(false);
                  setIsMiniCartOpen(true);
                }}
                className={`relative p-1.5 text-neutral-800 hover:text-black transition-all duration-300 cursor-pointer ${
                  cartBump ? 'scale-135 text-black' : 'scale-100'
                }`}
                title={language === 'AR' ? 'سلة التسوق' : 'Cart'}
                aria-label={language === 'AR' ? 'سلة التسوق' : 'Cart'}
              >
                <ShoppingBag
                  className={`w-5 h-5 stroke-[1.8] transition-transform duration-300 ${
                    cartBump ? 'scale-125 stroke-[2.2]' : ''
                  }`}
                />
                {cartCount > 0 && (
                  <span
                    className={`absolute -top-0.5 -end-0.5 bg-black text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                      cartBump
                        ? 'scale-135 bg-emerald-600 shadow-lg ring-2 ring-emerald-300'
                        : 'scale-100'
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Icon + account dropdown (store-scoped) */}
            {headerSettings?.actions?.account?.enabled !== false && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMegaMenu(null);
                    setMobileMenuOpen(false);
                    setAccountMenuOpen((v) => !v);
                  }}
                  className="p-1.5 text-neutral-800 hover:text-black transition-colors cursor-pointer"
                  title={language === 'AR' ? 'حساب العميل' : 'User Profile'}
                  aria-label={language === 'AR' ? 'الحساب' : 'Account'}
                  aria-expanded={accountMenuOpen}
                >
                  <User className="w-5 h-5 stroke-[1.8]" />
                </button>
                <StorefrontAccountMenu
                  open={accountMenuOpen}
                  onClose={() => setAccountMenuOpen(false)}
                  isAr={language === 'AR'}
                  isLoggedIn={Boolean(user.isLoggedIn)}
                  onLogin={() => navigateTo('profile')}
                  onLogout={() => {
                    try {
                      sessionStorage.removeItem('coffee_profile_section');
                    } catch {
                      /* ignore */
                    }
                    logoutUser();
                  }}
                  onNavigate={(section: StorefrontAccountSection) => {
                    try {
                      sessionStorage.setItem('coffee_profile_section', section);
                    } catch {
                      /* ignore */
                    }
                    navigateTo('profile');
                  }}
                />
              </div>
            )}

            {/* Store Pill Button (Desktop only) */}
            <button
              type="button"
              onClick={() => {
                setActiveMegaMenu(null);
                setMobileMenuOpen(false);
                navigateTo('products');
              }}
              className="hidden @xl:inline-flex items-center justify-center px-4 py-1 rounded-full border border-neutral-300 hover:border-black text-[12px] font-medium text-neutral-800 hover:text-black transition-colors cursor-pointer"
            >
              {lockedNavLabel('shop', 'Shop', 'المتجر')}
            </button>

            {/* Language Switcher (EN | AR) */}
            <div className="flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full border border-neutral-200/90 bg-neutral-50/80 text-neutral-800 transition-colors shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  language === 'EN'
                    ? 'font-bold text-white bg-black shadow-xs'
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-200/60'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('AR')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  language === 'AR'
                    ? 'font-bold text-white bg-black shadow-xs'
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-200/60'
                }`}
                title="التحويل للغة العربية"
              >
                AR
              </button>
            </div>
          </div>

          {/* 3. Mobile Right: Brand Logo & Language Switcher (Exact match with Image) */}
          <div className="flex @lg:hidden items-center gap-2 shrink-0 z-10">
            {/* Language Toggle on Mobile */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'AR' ? 'EN' : 'AR')}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-800 cursor-pointer active:scale-95"
              title={language === 'AR' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
            >
              {language === 'AR' ? 'EN' : 'AR'}
            </button>

            {/* Mobile Brand Logo */}
            <button
              type="button"
              onClick={() => {
                closeMenuImmediately();
                setMobileMenuOpen(false);
                navigateTo('home');
              }}
              className="flex items-center gap-1.5 font-black text-base sm:text-lg font-sans text-black uppercase cursor-pointer"
              title={logoWord}
            >
              {uploadedLogo ? (
                <img src={logoUrl} alt={logoWord} className="h-4 w-auto max-w-[96px] object-contain" />
              ) : (
                <>
                  <svg className="w-4 h-4 text-black shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <span className="tracking-tight font-extrabold text-[16px] sm:text-[18px]">{logoWord}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE QUICK NAVIGATION BAR (Visible on mobile below main header bar) */}
        {currentRoute !== 'product-detail' && currentRoute !== 'product-buy' && (
          <div className="@lg:hidden w-full border-t border-neutral-100 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ backgroundColor: 'var(--theme-header-bg, #FFFFFF)' }}>
            {showNavKey('home') ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('home');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                currentRoute === 'home' && !mobileMenuOpen
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lockedNavLabel('home', 'Home', 'الرئيسية')}
            </button>
            ) : null}

            {showNavKey('shop') ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('products');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                currentRoute === 'products' && !mobileMenuOpen
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lockedNavLabel('shop', 'Shop', 'المتجر')}
            </button>
            ) : null}

            {showNavKey('machines') ? (
            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('machines');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'machines'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lockedNavLabel('machines', 'Machines', 'المكائن')}
            </button>
            ) : null}

            {showNavKey('mills') ? (
            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('mills');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'mills'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lockedNavLabel('mills', 'Mills', 'المطاحن')}
            </button>
            ) : null}

            {showNavKey('cabinets') ? (
            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('cabinets');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'cabinets'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lockedNavLabel('cabinets', 'Coffee Bars', 'أركان القهوة')}
            </button>
            ) : null}

            {showNavKey('accessories') ? (
            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('accessories');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'accessories'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lockedNavLabel('accessories', 'Accessories', 'الأكواب والمستلزمات')}
            </button>
            ) : null}

            {showNavKey('offers') ? (
            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('offers');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'offers'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lockedNavLabel('offers', 'Offers', 'العروض والباقات')}
            </button>
            ) : null}

            {showNavKey('support') ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('reviews');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                currentRoute === 'reviews' && !mobileMenuOpen
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lockedNavLabel('support', 'Reviews', 'التقييمات والدعم')}
            </button>
            ) : null}

            {extraNavLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => followHeaderLink(link.url)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                {navLabel(link)}
              </button>
            ))}
          </div>
        )}

        {/* 3. DESKTOP MEGA DROPDOWN — mount only while open (closed DOM = zero logo/nav bleed) */}
        {isMegaMenuOpen ? (
          <>
        <div
          data-mega-menu-backdrop="on"
          className={`hidden @lg:block ${isBuilderCanvas ? 'absolute inset-x-0 top-16 bottom-0' : 'fixed inset-x-0 bottom-0 top-16'} bg-black/20 backdrop-blur-[2px] z-20`}
          onMouseEnter={() => scheduleMenuClose(50)}
          onClick={closeMenuImmediately}
          aria-hidden
        />

        <div
          ref={megaMenuContainerRef}
          data-mega-menu-panel="on"
          className="hidden @lg:block absolute top-full left-0 right-0 w-full bg-white border-b border-neutral-200/80 shadow-[0_20px_45px_rgba(0,0,0,0.10)] z-20 max-h-[min(78vh,620px)] overflow-y-auto overflow-x-hidden animate-honor-mega"
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          <div className="absolute -top-2 left-0 right-0 h-3 bg-transparent pointer-events-auto" aria-hidden />

            {/* PRODUCTS MEGA MENU */}
            <div className="w-full flex flex-col items-center pt-4 sm:pt-5 pb-6 sm:pb-8 px-3 sm:px-6">
                {/* Top Sub-category Tabs (Centered, Pure Text Links, Crisp Spacing) */}
                <div className="flex items-center justify-center gap-5 sm:gap-8 pb-4 sm:pb-5 text-[13px] sm:text-[13.5px] flex-wrap" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeSubFilter === 'latest'}
                    onClick={() => setActiveSubFilter('latest')}
                    className={`transition-colors cursor-pointer ${
                      activeSubFilter === 'latest'
                        ? 'text-black font-semibold'
                        : 'text-[#666666] hover:text-black font-normal'
                    }`}
                  >
                    {language === 'AR' ? 'أحدث المنتجات' : 'Latest Product'}
                  </button>

                  {currentMenu === 'machines' && (
                    <>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'pro'}
                        onClick={() => setActiveSubFilter('pro')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'pro'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة باريستا برو' : 'HiBrew Barista Pro Series'}
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'compact'}
                        onClick={() => setActiveSubFilter('compact')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'compact'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة المكائن المدمجة' : 'HiBrew Compact Series'}
                      </button>
                      {(dynamicMegaCatalog.machines.commercial?.length || 0) > 0 ? (
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'commercial'}
                        onClick={() => setActiveSubFilter('commercial')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'commercial'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة 58 مم التجارية' : 'HiBrew Commercial 58mm Series'}
                      </button>
                      ) : null}
                    </>
                  )}

                  {currentMenu === 'mills' && (
                    <>
                      {(dynamicMegaCatalog.mills.conical?.length || 0) > 0 ? (
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'conical'}
                        onClick={() => setActiveSubFilter('conical')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'conical'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'مطاحن التروس المخروطية' : 'Conical Burr Series'}
                      </button>
                      ) : null}
                      {(dynamicMegaCatalog.mills.flat?.length || 0) > 0 ? (
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'flat'}
                        onClick={() => setActiveSubFilter('flat')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'flat'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'مطاحن التروس المسطحة' : 'Flat Burr Series'}
                      </button>
                      ) : null}
                    </>
                  )}

                  {currentMenu === 'cabinets' && (
                    <>
                      {(dynamicMegaCatalog.cabinets.cabinets?.length || 0) > 0 ? (
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'cabinets'}
                        onClick={() => setActiveSubFilter('cabinets')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'cabinets'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة دواليب القهوة الفاخرة' : 'Artisan Cabinet Series'}
                      </button>
                      ) : null}
                      {(dynamicMegaCatalog.cabinets.corners?.length || 0) > 0 ? (
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'corners'}
                        onClick={() => setActiveSubFilter('corners')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'corners'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة محطات وأركان الباريستا' : 'Barista Station Series'}
                      </button>
                      ) : null}
                    </>
                  )}

                  {currentMenu === 'accessories' && (
                    <>
                      {(dynamicMegaCatalog.accessories.boltfilters?.length || 0) > 0 ? (
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'boltfilters'}
                        onClick={() => setActiveSubFilter('boltfilters')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'boltfilters'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة البورتافلتر 58مم' : 'Boltfilter 58mm Series'}
                      </button>
                      ) : null}
                      {(dynamicMegaCatalog.accessories.cups?.length || 0) > 0 ? (
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'cups'}
                        onClick={() => setActiveSubFilter('cups')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'cups'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة الأكواب السيراميك' : 'Ceramic Cup Series'}
                      </button>
                      ) : null}
                      {(dynamicMegaCatalog.accessories.tools?.length || 0) > 0 ? (
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'tools'}
                        onClick={() => setActiveSubFilter('tools')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'tools'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة أدوات الباريستا' : 'Barista Tools Series'}
                      </button>
                      ) : null}
                    </>
                  )}

                  {currentMenu === 'offers' && (dynamicMegaCatalog.offers.bundles?.length || 0) > 0 ? (
                    <button
                      role="tab"
                      aria-selected={activeSubFilter === 'bundles'}
                      onClick={() => setActiveSubFilter('bundles')}
                      className={`transition-colors cursor-pointer ${
                        activeSubFilter === 'bundles'
                          ? 'text-black font-semibold'
                          : 'text-[#666666] hover:text-black font-normal'
                      }`}
                    >
                      {language === 'AR' ? 'باقات المحطة المتكاملة' : 'Complete Kit Bundles'}
                    </button>
                  ) : null}
                </div>

                {/* 5 Columns Product Cards Grid (Compact & Sleek Sizing with Bottom Gap) */}
                <div
                  key={`${currentMenu}-${activeSubFilter}`}
                  className="grid grid-cols-2 sm:grid-cols-3 @lg:grid-cols-5 gap-3 sm:gap-3.5 @lg:gap-4.5 w-full items-stretch justify-center"
                >
                  {activeProducts.map((prod, idx) => {
                    const animClass =
                      idx === 0
                        ? 'animate-honor-card-1'
                        : idx === 1
                        ? 'animate-honor-card-2'
                        : idx === 2
                        ? 'animate-honor-card-3'
                        : idx === 3
                        ? 'animate-honor-card-4'
                        : 'animate-honor-card-5';

                    return (
                      <div
                        key={prod.name}
                        onClick={() => {
                          closeMenuImmediately();
                          navigateTo('product-detail', prod.id);
                        }}
                        className={`bg-[#F7F7F8] hover:bg-[#EFEFF2] rounded-[18px] p-3.5 sm:p-4 flex flex-col items-center justify-between text-center transition-all duration-200 cursor-pointer group shadow-none hover:shadow-2xs min-h-[210px] sm:min-h-[225px] border-none ${animClass}`}
                      >
                        {/* Product Image */}
                        <div className="w-full h-26 sm:h-30 @lg:h-32 flex items-center justify-center mb-2 overflow-hidden bg-transparent">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="max-h-full max-w-full object-contain bg-transparent group-hover:scale-105 transition-transform duration-300 ease-out"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Details: New Label + Product Title */}
                        <div className="w-full flex flex-col items-center text-center">
                          <span className={`text-[11px] font-medium text-[#0066CC] min-h-[16px] mb-0.5 leading-none text-center ${prod.isNew ? 'opacity-100' : 'opacity-0'}`}>
                            {language === 'AR' ? 'جديد' : 'New'}
                          </span>
                          <h4 className="text-[12.5px] sm:text-[13px] font-normal text-[#111111] leading-snug line-clamp-2 text-center group-hover:text-black transition-colors min-h-[34px] flex items-center justify-center">
                            {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Pill Buttons — keep clear gap from mega panel bottom border */}
                <div className="flex items-center justify-center gap-3.5 mt-5 mb-1 sm:mb-2">
                  {showViewMoreButton ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeMenuImmediately();
                        const moreUrl = (headerSettings?.navigation?.viewMoreUrl || '').trim();
                        if (moreUrl) {
                          followHeaderLink(moreUrl);
                          return;
                        }
                        navigateTo('products');
                      }}
                      className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#D2D2D7] hover:border-black text-[12.5px] font-normal text-[#111111] bg-white transition-all duration-200 cursor-pointer shadow-none hover:shadow-2xs"
                      data-nav-view-more="on"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-[#111111]" />
                      <span>
                        {viewMoreLabel ||
                          (language === 'AR' ? 'عرض المزيد من المنتجات' : 'More Products')}
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
          </div>
          </>
        ) : null}

        {/* 4. HONOR MOBILE DRILLDOWN SLIDE NAVIGATION */}
        {mobileMenuOpen && (
          <div className="@lg:hidden absolute top-full left-0 right-0 w-full max-w-full h-[calc(100vh-4rem)] max-h-[calc(100dvh-4rem)] bg-white z-[100] border-t border-neutral-200 shadow-[0_25px_50px_rgba(0,0,0,0.22)] overflow-y-auto overflow-x-hidden overscroll-contain text-neutral-800 animate-honor-mega" data-mobile-nav="panel" data-theme-menu="mobile">
            {/* LEVEL 1: Primary Category List */}
            {!mobileSubNavKey ? (
              <div className="p-4 sm:p-6 pb-24 space-y-4">
                {/* Search Bar */}
                <div
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-neutral-100 text-neutral-500 text-xs font-semibold cursor-pointer"
                >
                  <Search className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span>{language === 'AR' ? 'ابحث عن آلة، مطحنة، أو بورتافلتر...' : 'Search machines, mills, boltfilters...'}</span>
                </div>

                {/* Main Drilldown Navigation Items */}
                <div className="space-y-2" data-mobile-nav-list="primary">
                  {customMobile.length > 0 ? customMobile.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => followHeaderLink(link.url)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                    >
                      <span className="min-w-0 break-words text-start">{navLabel(link)}</span>
                      {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />}
                    </button>
                  )) : (
                  <>
                  {/* 0. Home */}
                  {showNavKey('home') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('home');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('home', 'Home', 'الرئيسية')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 0b. Shop */}
                  {showNavKey('shop') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('products');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('shop', 'Shop', 'المتجر')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 1. Machines */}
                  {showNavKey('machines') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('machines');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('machines', 'Machines', 'مكائن القهوة')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 2. Mills */}
                  {showNavKey('mills') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('mills');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('mills', 'Mills', 'مطاحن القهوة')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 3. Cabinets */}
                  {showNavKey('cabinets') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('cabinets');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('cabinets', 'Coffee Bars & Cabinets', 'أركان ودواليب القهوة')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 4. Accessories */}
                  {showNavKey('accessories') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('accessories');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('accessories', 'Accessories & Cups', 'الأكواب والمستلزمات')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 5. HiBrew CHOICE (Offers) */}
                  {showNavKey('offers') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('offers');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('offers', 'HiBrew CHOICE Offers', 'عروض وباقات هايبرو')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 6. All Products Store */}
                  {showNavKey('shop') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('products');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('shop', 'Store - All Products', 'المتجر - جميع المنتجات')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 7. Smart AI Tech & Craft */}
                  {showNavKey('ai') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const el = document.getElementById('machine-story-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else navigateTo('home');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{lockedNavLabel('ai', 'AI & Craft Engineering', 'الذكاء الاصطناعي وهندسة الآلة')}</span>
                      <Sparkles className="w-3.5 h-3.5 text-[color:var(--theme-accent,#C88A58)] fill-[color:var(--theme-accent,#C88A58)]/20" />
                    </span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 8. Reviews & Support */}
                  {showNavKey('support') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('reviews');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{lockedNavLabel('support', 'Support & Customer Reviews', 'الدعم والضمان وتجارب العملاء')}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                  ) : null}

                  {/* 9. Account */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('profile');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{user.isLoggedIn ? user.name : language === 'AR' ? 'حسابي / تسجيل الدخول' : 'Account / Login'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {extraNavLinks.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => followHeaderLink(link.url)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                    >
                      <span className="min-w-0 break-words text-start">{navLabel(link)}</span>
                      {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />}
                    </button>
                  ))}
                  </>
                  )}
                </div>

                {/* Bottom Language & Store */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-semibold">
                    {language === 'AR' ? 'اللغة:' : 'Language:'}
                  </span>
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className="px-4 py-1.5 rounded-full bg-black text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer"
                  >
                    {language === 'AR' ? 'الإنجليزية' : 'العربية'}
                  </button>
                </div>
              </div>
            ) : (
              /* LEVEL 2: Sub-Menu Drilldown */
              <div className={`p-4 sm:p-6 pb-24 space-y-4 ${language === 'AR' ? 'animate-mobile-subnav-rtl' : 'animate-mobile-subnav-ltr'}`}>
                {/* Back Button & Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setMobileSubNavKey(null)}
                    className="flex items-center gap-1 text-sm font-bold text-neutral-900 hover:text-black cursor-pointer"
                  >
                    {language === 'AR' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    <span>{language === 'AR' ? 'رجوع للقائمة' : 'Back'}</span>
                  </button>
                  <h4 className="text-sm font-bold text-neutral-950">
                    {mobileSubNavKey === 'machines'
                      ? lockedNavLabel('machines', 'Machines', 'المكائن')
                      : mobileSubNavKey === 'mills'
                      ? lockedNavLabel('mills', 'Mills', 'المطاحن')
                      : mobileSubNavKey === 'cabinets'
                      ? lockedNavLabel('cabinets', 'Cabinets & Corners', 'الدواليب والأركان')
                      : mobileSubNavKey === 'accessories'
                      ? lockedNavLabel('accessories', 'Accessories & Cups', 'المستلزمات والأكواب')
                      : lockedNavLabel('offers', 'HiBrew CHOICE', 'عروض وباقات هايبرو')}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                    aria-label={language === 'AR' ? 'إغلاق القائمة' : 'Close Menu'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-Category Filter Pills on Mobile */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setMobileSubFilter('latest')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      mobileSubFilter === 'latest' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {language === 'AR' ? 'أحدث المنتجات' : 'Latest'}
                  </button>

                  {mobileSubNavKey === 'machines' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('pro')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'pro' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'باريستا برو' : 'Barista Pro'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('compact')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'compact' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'المكائن المدمجة' : 'Compact'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('commercial')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'commercial' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? '58 مم التجارية' : 'Commercial 58mm'}
                      </button>
                    </>
                  )}

                  {mobileSubNavKey === 'mills' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('conical')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'conical' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'التروس المخروطية' : 'Conical Burr'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('flat')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'flat' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'التروس المسطحة' : 'Flat Burr'}
                      </button>
                    </>
                  )}

                  {mobileSubNavKey === 'cabinets' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('cabinets')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'cabinets' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'دواليب القهوة' : 'Cabinets'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('corners')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'corners' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'أركان الباريستا' : 'Barista Stations'}
                      </button>
                    </>
                  )}

                  {mobileSubNavKey === 'accessories' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('boltfilters')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'boltfilters' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'البورتافلتر 58مم' : 'Boltfilters 58mm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('cups')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'cups' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'الأكواب السيراميك' : 'Ceramic Cups'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('tools')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'tools' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'أدوات الباريستا' : 'Barista Tools'}
                      </button>
                    </>
                  )}

                  {mobileSubNavKey === 'offers' && (
                    <button
                      type="button"
                      onClick={() => setMobileSubFilter('bundles')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                        mobileSubFilter === 'bundles' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {language === 'AR' ? 'باقات المحطة المتكاملة' : 'Complete Bundles'}
                    </button>
                  )}
                </div>

                {/* Product Grid in Mobile Drilldown */}
                <div className="grid grid-cols-2 gap-3">
                  {(dynamicMegaCatalog[mobileSubNavKey || 'machines']?.[mobileSubFilter] || dynamicMegaCatalog[mobileSubNavKey || 'machines']?.latest || []).map(prod => (
                    <div
                      key={prod.name}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigateTo('product-detail', prod.id);
                      }}
                      className="bg-[#F7F7F8] active:bg-[#EFEFF2] rounded-[16px] p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-2xs"
                    >
                      <div className="w-full h-24 flex items-center justify-center mb-2 bg-transparent p-1">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="max-h-full max-w-full object-contain bg-transparent"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className={`text-[10px] font-medium text-[#0066CC] min-h-[15px] ${prod.isNew ? 'opacity-100' : 'opacity-0'}`}>
                        {language === 'AR' ? 'جديد' : 'New'}
                      </span>
                      <h5 className="text-xs font-medium text-neutral-900 line-clamp-2 mt-0.5 leading-snug">
                        {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                      </h5>
                    </div>
                  ))}
                </div>

                {/* Action: View All */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('products');
                    }}
                    className="w-full py-3 bg-black text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'عرض المزيد من المنتجات' : 'More Products'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 5. Mobile-only backdrop (desktop mega mounts its own backdrop while open) */}
      {mobileMenuOpen ? (
        <div
          className="@lg:hidden fixed inset-0 top-16 bg-black/25 backdrop-blur-[1px] z-40"
          onClick={() => {
            closeMenuImmediately();
            setMobileMenuOpen(false);
          }}
        />
      ) : null}
    </>
  );
};
