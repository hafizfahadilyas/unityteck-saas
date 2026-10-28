import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';
import {
  Search,
  ShoppingBag,
  User,
  Heart,
  MessageCircle,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  LayoutGrid,
  Columns,
  Sparkles,
  ArrowRight,
  Palette
} from 'lucide-react';

type MegaMenuKey = 'machines' | 'mills' | 'cabinets' | 'accessories' | 'offers' | 'explore' | null;

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
    countryNoticeVisible,
    dismissCountryNotice,
    language,
    setLanguage,
    toggleLanguage,
    currentRoute,
    user,
    products
  } = useCart();

  // Dynamic Mega Catalog computed from live products (100% PNG & auto-updating from Dashboard)
  const dynamicMegaCatalog = useMemo(() => {
    const catalog: Record<string, Record<string, MegaProductItem[]>> = {
      machines: { latest: [], pro: [], compact: [] },
      mills: { latest: [], electric: [], manual: [] },
      cabinets: { latest: [], modern: [], luxury: [] },
      accessories: { latest: [], tools: [], cups: [] },
      offers: { latest: [], bundles: [], flash: [] },
    };

    (products || []).forEach((prod) => {
      const catKey = (prod.category || 'machines').toLowerCase();
      const primaryImg =
        prod.colors?.[0]?.image ||
        prod.images?.[0] ||
        (prod as any).image ||
        '/src/assets/images/hibrew_h7a_flagship_machine.png';

      const item: MegaProductItem = {
        id: prod.id,
        name: prod.name,
        nameAr: prod.nameAr || prod.name,
        image: primaryImg,
        isNew: Boolean(prod.badge || (prod.originalPrice && prod.originalPrice > prod.basePrice)),
      };

      if (catKey.includes('machine') || catKey === 'machines') {
        catalog.machines.latest.push(item);
        if (prod.basePrice > 1000) {
          catalog.machines.pro.push(item);
        } else {
          catalog.machines.compact.push(item);
        }
      } else if (catKey.includes('mill') || catKey.includes('grind') || catKey === 'mills') {
        catalog.mills.latest.push(item);
        catalog.mills.electric.push(item);
      } else if (catKey.includes('cabinet') || catKey.includes('corner') || catKey === 'cabinets') {
        catalog.cabinets.latest.push(item);
        catalog.cabinets.luxury.push(item);
      } else if (catKey.includes('access') || catKey.includes('cup') || catKey === 'accessories') {
        catalog.accessories.latest.push(item);
        catalog.accessories.tools.push(item);
      }

      if (prod.originalPrice && prod.originalPrice > prod.basePrice) {
        catalog.offers.latest.push(item);
        catalog.offers.flash.push(item);
      }
    });

    return catalog;
  }, [products]);

  const { activeStore } = useTenant();
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
      return readAllThemeSettings(activeStore?.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, headerVersion]);

  const headerSettings = allThemeSettings?.customHeader;

  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey>(null);
  const [renderedMegaMenu, setRenderedMegaMenu] = useState<MegaMenuKey>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubNavKey, setMobileSubNavKey] = useState<MegaMenuKey | null>(null);
  const [mobileSubFilter, setMobileSubFilter] = useState<string>('latest');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('latest');
  const [isScrolled, setIsScrolled] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const megaMenuContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Get active products for current mega menu and sub-filter
  const currentMenu = renderedMegaMenu || activeMegaMenu || 'machines';
  const getActiveProducts = (): MegaProductItem[] => {
    const menuToUse = renderedMegaMenu || activeMegaMenu || 'machines';
    if (!menuToUse || menuToUse === 'explore') return [];
    const cat = dynamicMegaCatalog[menuToUse];
    if (!cat) return [];
    return cat[activeSubFilter] || cat['latest'] || [];
  };

  const activeProducts = getActiveProducts();

  return (
    <>
      {/* 0. PROMO ANNOUNCEMENT BAR (If enabled in theme customizer) */}
      {(headerSettings?.announcement?.enabled || allThemeSettings?.announcementBar?.enabled) && (
        <div
          style={{
            backgroundColor: headerSettings?.announcement?.bgColor || allThemeSettings?.announcementBar?.bgColor || '#000000',
            color: headerSettings?.announcement?.textColor || allThemeSettings?.announcementBar?.textColor || '#FFFFFF',
          }}
          className="w-full text-xs font-bold py-2 px-4 text-center transition-all duration-300 relative z-50 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>
            {language === 'AR'
              ? (headerSettings?.announcement?.messages?.[0]?.textAr || allThemeSettings?.announcementBar?.messages?.[0]?.text || 'شحن سريع لجميع مدن المملكة | ضمان سنتين معتمد')
              : (headerSettings?.announcement?.messages?.[0]?.textEn || allThemeSettings?.announcementBar?.messages?.[0]?.text || 'Express delivery across KSA | 2-Year Official Saudi Warranty')}
          </span>
        </div>
      )}

      {/* 1. TOP BAR (Honor Style Country/Region Selector Bar) */}
      {countryNoticeVisible && (
        <div className="w-full bg-[#f7f7f8] border-b border-neutral-200/70 text-[12px] text-neutral-600 py-1.5 px-4 sm:px-6 lg:px-8 transition-all duration-300 overflow-hidden">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="truncate block font-normal text-neutral-700">
                {language === 'AR'
                  ? 'اختر دولتك أو منطقتك للاطلاع على المحتوى المخصص والشراء مباشرة مع الشحن الفوري بالمملكة.'
                  : 'Choose your country or region to see content related to you and shop directly with express KSA delivery.'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 bg-white px-3 py-0.5 rounded-full border border-neutral-300/80 text-[11px] font-medium text-neutral-800 shadow-2xs">
                <span>{language === 'AR' ? 'المملكة العربية السعودية / العربية' : 'Saudi Arabia / English'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </div>

              <button
                onClick={dismissCountryNotice}
                className="px-3.5 py-0.5 rounded-full bg-black text-white text-[11px] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              >
                {language === 'AR' ? 'متابعة' : 'Continue'}
              </button>

              <button
                onClick={dismissCountryNotice}
                className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer shrink-0"
                title="Close"
                aria-label="Close region selector"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER NAVIGATION BAR (Sticky Fixed on Scroll with Honor Slim Profile & Perfect Center Alignment) */}
      <header
        className={`sticky top-0 z-50 w-full bg-white text-neutral-900 border-b border-neutral-200/80 transition-all duration-200 ${
          isScrolled ? 'shadow-[0_2px_15px_rgba(0,0,0,0.06)]' : ''
        }`}
        onMouseLeave={handleHeaderMouseLeave}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative bg-white z-50">
          {/* 1. Desktop Left: Brand Logo */}
          <div className="hidden lg:flex items-center shrink-0 z-10" onMouseEnter={() => scheduleMenuClose(80)}>
            <button
              type="button"
              onClick={() => {
                closeMenuImmediately();
                setMobileMenuOpen(false);
                navigateTo('home');
              }}
              className="flex items-center gap-1.5 sm:gap-2 group focus:outline-hidden cursor-pointer text-start tracking-tight font-black text-xl sm:text-2xl font-sans text-black uppercase shrink-0"
              title="HiBrew Coffee Official Store KSA"
            >
              <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-black shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" />
                <path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="tracking-tighter font-extrabold text-[19px] sm:text-[22px]">{language === 'AR' ? 'هايبرو' : 'HIBREW'}</span>
            </button>
          </div>

          {/* 1. Mobile Left: Hamburger + Cart + Search (Exact match with Image) */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-2 shrink-0">
            {/* Hamburger Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMegaMenu(null);
                setMobileMenuOpen((prev) => !prev);
              }}
              className="p-1.5 text-neutral-900 hover:text-black cursor-pointer active:scale-95 transition-transform"
              aria-label="Toggle Menu"
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
              aria-label="Cart"
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
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>

          {/* 2. Center: Desktop Nav Items (Flex in-flow layout ensuring zero overlap in both RTL Arabic and LTR English) */}
          <nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-2 lg:mx-3 xl:mx-4 2xl:mx-6 gap-2 lg:gap-2.5 xl:gap-3.5 2xl:gap-5 text-[12px] lg:text-[12.5px] xl:text-[13px] 2xl:text-[13.5px] font-normal text-neutral-800 h-16 whitespace-nowrap">
            {/* 0. Shop (المتجر) */}
            <div className="relative h-full flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                type="button"
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 px-1 transition-colors cursor-pointer relative whitespace-nowrap ${
                  currentRoute === 'products'
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black font-normal'
                }`}
              >
                <span>{language === 'AR' ? 'المتجر' : 'Shop'}</span>
                {currentRoute === 'products' && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 1. Machines (مكائن القهوة) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('machines')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'machines' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'المكائن' : 'Machines'}</span>
                {activeMegaMenu === 'machines' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 2. Mills (مطاحن القهوة) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('mills')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'mills' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'المطاحن' : 'Mills'}</span>
                {activeMegaMenu === 'mills' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 3. Cabinets (أركان ودواليب القهوة) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('cabinets')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'cabinets' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'أركان ودواليب القهوة' : 'Coffee Bars'}</span>
                {activeMegaMenu === 'cabinets' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 4. Accessories (المستلزمات والأكواب) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('accessories')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'accessories' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'الأكواب والمستلزمات' : 'Accessories'}</span>
                {activeMegaMenu === 'accessories' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 5. Offers (العروض والباقات) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('offers')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'offers' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'العروض والباقات' : 'HiBrew CHOICE'}</span>
                {activeMegaMenu === 'offers' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 6. Smart AI Tech */}
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
                <span>{language === 'AR' ? 'الذكاء الاصطناعي' : 'AI'}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#2563eb] fill-[#2563eb]/20" />
              </button>
            </div>

            {/* 7. Business */}
            <div className="h-full hidden xl:flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className="py-2 text-neutral-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{language === 'AR' ? 'قطاع الأعمال' : 'Business'}</span>
              </button>
            </div>

            {/* 8. Support */}
            <div className="h-full hidden xl:flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('reviews');
                }}
                className="py-2 text-neutral-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{language === 'AR' ? 'الدعم والضمان' : 'Support'}</span>
              </button>
            </div>
          </nav>

          {/* 3. Desktop Right: Search, Wishlist, Cart, WhatsApp, Profile, Store Pill, Language */}
          <div className="hidden lg:flex items-center gap-1.5 sm:gap-3 xl:gap-4 shrink-0 z-10" onMouseEnter={() => scheduleMenuClose(80)}>
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
                aria-label="Search"
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>
            )}

            {/* Wishlist Heart Icon */}
            {headerSettings?.actions?.wishlist?.enabled !== false && (
              <button
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  setMobileMenuOpen(false);
                  navigateTo('products');
                }}
                className="p-1.5 text-neutral-800 hover:text-red-500 transition-colors cursor-pointer"
                title={language === 'AR' ? 'قائمة الرغبات والمفضلة' : 'Wishlist'}
                aria-label="Wishlist"
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
                title="Cart"
                aria-label="Cart"
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

            {/* WhatsApp Chat Icon */}
            {headerSettings?.actions?.whatsapp?.enabled !== false && (
              <button
                type="button"
                onClick={() => {
                  const rawPhone =
                    headerSettings?.actions?.whatsapp?.phoneNumber ||
                    (activeStore as any)?.whatsapp ||
                    activeStore?.phone ||
                    '+966549876543';
                  const cleanPhone = rawPhone.replace(/\D/g, '') || '966549876543';
                  window.open(`https://wa.me/${cleanPhone}`, '_blank');
                }}
                className="p-1.5 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer relative"
                title={language === 'AR' ? 'تواصل معنا مباشرة عبر واتساب' : 'Chat on WhatsApp'}
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5 stroke-[2] text-emerald-600" />
              </button>
            )}

            {/* Profile Icon */}
            {headerSettings?.actions?.account?.enabled !== false && (
              <button
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  setMobileMenuOpen(false);
                  navigateTo('profile');
                }}
                className="p-1.5 text-neutral-800 hover:text-black transition-colors cursor-pointer"
                title="User Profile"
                aria-label="Account"
              >
                <User className="w-5 h-5 stroke-[1.8]" />
              </button>
            )}

            {/* Store Pill Button (Desktop only) */}
            <button
              type="button"
              onClick={() => {
                setActiveMegaMenu(null);
                setMobileMenuOpen(false);
                navigateTo('products');
              }}
              className="hidden xl:inline-flex items-center justify-center px-4 py-1 rounded-full border border-neutral-300 hover:border-black text-[12px] font-medium text-neutral-800 hover:text-black transition-colors cursor-pointer"
            >
              {language === 'AR' ? 'المتجر' : 'Shop'}
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
          <div className="flex lg:hidden items-center gap-2 shrink-0 z-10">
            {/* Language Toggle on Mobile */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'AR' ? 'EN' : 'AR')}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-800 cursor-pointer active:scale-95"
              title="Toggle Language"
            >
              {language === 'AR' ? 'EN' : 'عربي'}
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
              title="HiBrew Coffee Official Store KSA"
            >
              <svg className="w-4 h-4 text-black shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" />
                <path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="tracking-tight font-extrabold text-[16px] sm:text-[18px]">
                {language === 'AR' ? 'هايبرو' : 'HIBREW'}
              </span>
            </button>
          </div>
        </div>

        {/* MOBILE QUICK NAVIGATION BAR (Visible on mobile below main header bar) */}
        {currentRoute !== 'product-detail' && currentRoute !== 'product-buy' && (
          <div className="lg:hidden w-full bg-white border-t border-neutral-100 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
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
              {language === 'AR' ? 'الرئيسية' : 'Home'}
            </button>

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
              {language === 'AR' ? 'المتجر' : 'Shop'}
            </button>

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
              {language === 'AR' ? 'المكائن' : 'Machines'}
            </button>

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
              {language === 'AR' ? 'المطاحن' : 'Mills'}
            </button>

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
              {language === 'AR' ? 'أركان القهوة' : 'Coffee Bars'}
            </button>

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
              {language === 'AR' ? 'الأكواب والمستلزمات' : 'Accessories'}
            </button>

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
              {language === 'AR' ? 'العروض والباقات' : 'Offers'}
            </button>

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
              {language === 'AR' ? 'التقييمات والدعم' : 'Reviews'}
            </button>
          </div>
        )}

        {/* 3. DESKTOP MEGA MENU DROPDOWN PANEL & BACKDROP (Smooth Slide-In & Slide-Out on Hover & Leave) */}
        {/* Backdrop Overlay: Smooth fade, covers page below header, mouseleave/click closes menu */}
        <div
          className={`hidden lg:block fixed inset-x-0 bottom-0 top-16 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ease-out z-40 ${
            isMegaMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onMouseEnter={() => scheduleMenuClose(50)}
          onClick={closeMenuImmediately}
        />

        {/* Dropdown Panel: Smooth slide down on hover, automatic slide UP on mouse leave */}
        <div
          ref={megaMenuContainerRef}
          className={`hidden lg:block absolute top-full left-0 right-0 w-full bg-white border-b border-neutral-200/80 shadow-[0_20px_45px_rgba(0,0,0,0.10)] z-50 max-h-[calc(100vh-120px)] overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isMegaMenuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto visible'
              : 'opacity-0 -translate-y-5 pointer-events-none invisible'
          }`}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          {/* Seamless Hover Bridge: Prevents any hover gap */}
          <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent pointer-events-auto" />

            {/* PRODUCTS MEGA MENU */}
            <div className="w-full flex flex-col items-center">
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
                    </>
                  )}

                  {currentMenu === 'mills' && (
                    <>
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
                    </>
                  )}

                  {currentMenu === 'cabinets' && (
                    <>
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
                    </>
                  )}

                  {currentMenu === 'accessories' && (
                    <>
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
                    </>
                  )}

                  {currentMenu === 'offers' && (
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
                  )}
                </div>

                {/* 5 Columns Product Cards Grid (Compact & Sleek Sizing with Bottom Gap) */}
                <div
                  key={`${currentMenu}-${activeSubFilter}`}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 lg:gap-4.5 w-full items-stretch justify-center"
                >
                  {activeProducts.slice(0, 5).map((prod, idx) => {
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
                        <div className="w-full h-26 sm:h-30 lg:h-32 flex items-center justify-center mb-2 overflow-hidden">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 ease-out"
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

                {/* Bottom Action Pill Buttons */}
                <div className="flex items-center justify-center gap-3.5 mt-5">
                  <button
                    onClick={() => {
                      closeMenuImmediately();
                      navigateTo('products');
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#D2D2D7] hover:border-black text-[12.5px] font-normal text-[#111111] bg-white transition-all duration-200 cursor-pointer shadow-none hover:shadow-2xs"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-[#111111]" />
                    <span>{language === 'AR' ? 'عرض المزيد من المنتجات' : 'More Products'}</span>
                  </button>

                  <button
                    onClick={() => {
                      closeMenuImmediately();
                      const el = document.getElementById('machine-story-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else navigateTo('products');
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#D2D2D7] hover:border-black text-[12.5px] font-normal text-[#111111] bg-white transition-all duration-200 cursor-pointer shadow-none hover:shadow-2xs"
                  >
                    <Columns className="w-3.5 h-3.5 text-[#111111]" />
                    <span>{language === 'AR' ? 'مقارنة المواصفات' : 'Compare'}</span>
                  </button>
                </div>
              </div>
          </div>

        {/* 4. HONOR MOBILE DRILLDOWN SLIDE NAVIGATION */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 w-full h-[calc(100vh-4rem)] max-h-[calc(100dvh-4rem)] bg-white z-[100] border-t border-neutral-200 shadow-[0_25px_50px_rgba(0,0,0,0.22)] overflow-y-auto overscroll-contain text-neutral-800 animate-honor-mega">
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
                <div className="space-y-2">
                  {/* 0. Home */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('home');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'الرئيسية' : 'Home'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 0b. Shop */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('products');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'المتجر' : 'Shop'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 1. Machines */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('machines');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'مكائن القهوة' : 'Machines'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 2. Mills */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('mills');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'مطاحن القهوة' : 'Mills'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 3. Cabinets */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('cabinets');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'أركان ودواليب القهوة' : 'Coffee Bars & Cabinets'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 4. Accessories */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('accessories');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'الأكواب والمستلزمات' : 'Accessories & Cups'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 5. HiBrew CHOICE (Offers) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('offers');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'عروض وباقات هايبرو' : 'HiBrew CHOICE Offers'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 6. All Products Store */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('products');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'المتجر - جميع المنتجات' : 'Store - All Products'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 7. Smart AI Tech & Craft */}
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
                      <span>{language === 'AR' ? 'الذكاء الاصطناعي وهندسة الآلة' : 'AI & Craft Engineering'}</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#2563eb] fill-[#2563eb]/20" />
                    </span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 8. Reviews & Support */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('reviews');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'الدعم والضمان وتجارب العملاء' : 'Support & Customer Reviews'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

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
                    {language === 'AR' ? 'English' : 'العربية'}
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
                      ? language === 'AR' ? 'المكائن' : 'Machines'
                      : mobileSubNavKey === 'mills'
                      ? language === 'AR' ? 'المطاحن' : 'Mills'
                      : mobileSubNavKey === 'cabinets'
                      ? language === 'AR' ? 'الدواليب والأركان' : 'Cabinets & Corners'
                      : mobileSubNavKey === 'accessories'
                      ? language === 'AR' ? 'المستلزمات والأكواب' : 'Accessories & Cups'
                      : language === 'AR' ? 'عروض وباقات هايبرو' : 'HiBrew CHOICE'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                    aria-label="Close Menu"
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
                      <div className="w-full h-24 flex items-center justify-center mb-2 bg-white rounded-lg p-1 border border-neutral-100/60">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="max-h-full max-w-full object-contain"
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

      {/* 5. BACKDROP OVERLAY (Strictly positioned UNDER Header & Mega Menu so no darkening over navbar!) */}
      <div
        className={`fixed inset-0 top-16 bg-black/25 backdrop-blur-[1px] transition-opacity duration-300 ease-out z-40 ${
          activeMegaMenu || mobileMenuOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={() => {
          setActiveMegaMenu(null);
          setMobileMenuOpen(false);
        }}
      />
    </>
  );
};
