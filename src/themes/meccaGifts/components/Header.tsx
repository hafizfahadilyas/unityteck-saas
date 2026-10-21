import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import {
  Search,
  User,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  Menu,
  X,
  Sparkles,
  Truck,
  Gift,
  Clock,
  ChevronDown,
  BookOpen,
  Percent,
  CreditCard,
  Crown,
  ChevronRight,
  ChevronLeft,
  Phone,
  Heart,
  Star,
  Flame,
  Tag,
  ShieldCheck,
  Bell,
  Megaphone,
  Globe,
} from 'lucide-react';
import { PRODUCTS, EIGHT_FEATURED_CATEGORIES, MECCA_WHATSAPP } from '../data/mockData';
import {
  HeaderCustomSettings,
  HeaderSubElementKey,
  DEFAULT_HEADER_SETTINGS,
  COFFEE_HEADER_SETTINGS,
  AUTO_HEADER_SETTINGS,
  getDefaultHeaderSettings,
} from '../../settings/headerCustomSettings';

export interface HeaderProps {
  customSettings?: HeaderCustomSettings;
  isBuilderMode?: boolean;
  selectedSubElement?: HeaderSubElementKey;
  onSelectSubElement?: (elementId: HeaderSubElementKey) => void;
}

const getHeaderIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Clock': return Clock;
    case 'Truck': return Truck;
    case 'CreditCard': return CreditCard;
    case 'Sparkles': return Sparkles;
    case 'Gift': return Gift;
    case 'Percent': return Percent;
    case 'BookOpen': return BookOpen;
    case 'Crown': return Crown;
    case 'ShoppingBag': return ShoppingBag;
    case 'ShoppingCart': return ShoppingCart;
    case 'ShoppingBasket': return ShoppingBasket;
    case 'Heart': return Heart;
    case 'Star': return Star;
    case 'Flame': return Flame;
    case 'Tag': return Tag;
    case 'ShieldCheck': return ShieldCheck;
    case 'Bell': return Bell;
    case 'Megaphone': return Megaphone;
    case 'Phone': return Phone;
    default: return Sparkles;
  }
};

export const Header: React.FC<HeaderProps> = ({
  customSettings,
  isBuilderMode,
  selectedSubElement,
  onSelectSubElement,
}) => {
  const {
    products,
    language,
    setLanguage,
    currentPage,
    setCurrentPage,
    setSelectedCategory,
    cartCount,
    cartSubtotal,
    setIsCartOpen,
    navigateToCategory,
    user,
    setIsAuthModalOpen,
    builderDevice,
  } = useApp();
  const { activeStore } = useTenant();

  const isCoffee =
    activeStore?.id === 'store-coffee' ||
    activeStore?.slug === 'coffee-store' ||
    activeStore?.slug?.includes('coffee') ||
    (activeStore?.category && activeStore.category.includes('قهوة')) ||
    (activeStore?.domain && activeStore.domain.includes('coffee'));

  const isCar =
    activeStore?.id === 'store-bleco' ||
    activeStore?.slug === 'bleco-sa' ||
    activeStore?.slug?.includes('car') ||
    activeStore?.slug?.includes('transport') ||
    (activeStore?.category && (activeStore.category.includes('سيارات') || activeStore.category.includes('تنجيد')));

  const fallbackSettings = getDefaultHeaderSettings(activeStore);
  const isMobileHeader = builderDevice === 'mobile' || builderDevice === 'tablet';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const isAr = language === 'ar';
  const headerProducts = products && products.length > 0 ? products : PRODUCTS;

  // Active settings with fallback to store-isolated default
  const cur = customSettings || fallbackSettings;
  const ann = cur.announcement || fallbackSettings.announcement;
  const logo = cur.logo || fallbackSettings.logo;
  const nav = cur.navigation || fallbackSettings.navigation;
  const act = cur.actions || fallbackSettings.actions;
  const lang = cur.language || fallbackSettings.language;
  const gen = cur.general || fallbackSettings.general;

  // Dynamic store-isolated display values (prevents Hadaya Makkah flowers leaking into Coffee / Car / Other stores)
  const isNotHadayaStore = isCoffee || isCar || (activeStore?.id && activeStore.id !== 'store-1');

  const displayTitleAr =
    isCoffee && (logo.titleAr === 'هدايا مكة' || !logo.titleAr)
      ? (activeStore?.nameAr || 'محمصة القهوة المختصة')
      : isCar && (logo.titleAr === 'هدايا مكة' || !logo.titleAr)
      ? (activeStore?.nameAr || 'مؤسسة بلاكو للتجارة')
      : isNotHadayaStore && logo.titleAr === 'هدايا مكة'
      ? (activeStore?.nameAr || activeStore?.name || logo.titleAr)
      : logo.titleAr;

  const displayTitleEn =
    isCoffee && (logo.titleEn === 'Hadaya Makkah' || !logo.titleEn)
      ? (activeStore?.nameEn || 'Specialty Coffee Roasters')
      : isCar && (logo.titleEn === 'Hadaya Makkah' || !logo.titleEn)
      ? (activeStore?.nameEn || 'Blacko Car Styling')
      : isNotHadayaStore && logo.titleEn === 'Hadaya Makkah'
      ? (activeStore?.nameEn || activeStore?.name || logo.titleEn)
      : logo.titleEn;

  const displaySubtitleAr =
    isCoffee && (logo.subtitleAr === 'GIFTS AND FLOWERS' || !logo.subtitleAr)
      ? 'ARTISAN ROASTERY & BREW'
      : isCar && (logo.subtitleAr === 'GIFTS AND FLOWERS' || !logo.subtitleAr)
      ? 'تنجيد ودعاسات السيارات الفاخرة'
      : isNotHadayaStore && logo.subtitleAr === 'GIFTS AND FLOWERS'
      ? (activeStore?.categoryAr || activeStore?.category || 'أحدث المنتجات والعروض')
      : logo.subtitleAr;

  const displaySubtitleEn =
    isCoffee && (logo.subtitleEn === 'GIFTS AND FLOWERS' || !logo.subtitleEn)
      ? 'ARTISAN ROASTERY & BREW'
      : isCar && (logo.subtitleEn === 'GIFTS AND FLOWERS' || !logo.subtitleEn)
      ? 'LUXURY CAR UPHOLSTERY & 7D MATS'
      : isNotHadayaStore && logo.subtitleEn === 'GIFTS AND FLOWERS'
      ? (activeStore?.categoryEn || activeStore?.category || 'Specialty Boutique')
      : logo.subtitleEn;

  const displayLogoUrl =
    isCoffee && (logo.imageUrl?.includes('NKOjvD') || !logo.imageUrl)
      ? (activeStore?.logo && activeStore.logo.startsWith('http') ? activeStore.logo : 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80')
      : isCar && (logo.imageUrl?.includes('NKOjvD') || !logo.imageUrl)
      ? (activeStore?.logo && activeStore.logo.startsWith('http') ? activeStore.logo : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80')
      : isNotHadayaStore && logo.imageUrl?.includes('NKOjvD')
      ? (activeStore?.logo || '')
      : (logo.imageUrl || activeStore?.logo);

  const searchResults = searchQuery.trim()
    ? headerProducts.filter((p) =>
        isAr
          ? p.name.includes(searchQuery) || p.category.includes(searchQuery)
          : p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.categoryEn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const toggleLanguage = () => {
    setLanguage(isAr ? 'en' : 'ar');
  };

  const hasFlowerMessages = ann.messages?.some(m =>
    m.textEn?.includes('Holland') ||
    m.textEn?.includes('Mecca') ||
    m.textEn?.includes('Flowers') ||
    m.textAr?.includes('هولندا') ||
    m.textAr?.includes('مكة المكرمة')
  );

  const activeMessages = (ann.messages && ann.messages.length > 0 && !(isNotHadayaStore && hasFlowerMessages))
    ? ann.messages.filter((m) => m.active)
    : fallbackSettings.announcement.messages.filter((m) => m.active);

  const hasFlowerNav = nav.links?.some(l =>
    l.labelEn?.includes('Flower') ||
    l.labelAr?.includes('ورد') ||
    l.labelEn?.includes('Bouquet') ||
    l.labelAr?.includes('باقات الورد')
  );

  const activeNavLinks = (nav.links && nav.links.length > 0 && !(isNotHadayaStore && hasFlowerNav))
    ? nav.links.filter((l) => l.active)
    : fallbackSettings.navigation.links.filter((l) => l.active);

  const allCollectionsLabel = isAr
    ? (isCoffee ? 'كافة المحاصيل والمعدات' : isCar ? 'كافة خدمات السيارات' : (nav.allCollectionsLabelAr || 'كافة المجموعات'))
    : (isCoffee ? 'All Roasts & Gear' : isCar ? 'All Auto Services' : (nav.allCollectionsLabelEn || 'All Collections'));

  const vipPortalLabel = isAr
    ? (isCoffee ? 'نادي الباريستا VIP' : isCar ? 'أسطول VIP' : (nav.vipPortalLabelAr || 'بوابة VIP'))
    : (isCoffee ? 'Barista Club VIP' : isCar ? 'VIP Fleet Portal' : (nav.vipPortalLabelEn || 'VIP Portal'));

  const searchPlaceholder = isAr
    ? (isCoffee ? 'ابحث عن محاصيل قهوة، أدوات V60، مكائن إسبريسو...' : isCar ? 'ابحث عن نوع سيارتك، خامات التنجيد، دعاسات 7D...' : (act.search?.placeholderAr || 'ابحث في المتجر...'))
    : (isCoffee ? 'Search specialty beans, V60 gear, espresso machines...' : isCar ? 'Search car model, upholstery, 7D mats...' : (act.search?.placeholderEn || 'Search products...'));

  const flowerNavLinks = [
    {
      id: 'bouquets',
      label: isAr ? 'باقات الورود الفاخرة' : 'Luxury Flower Bouquets',
      cat: 'natural-bouquets',
      icon: Sparkles,
    },
    {
      id: 'chocolates',
      label: isAr ? 'شوكولاتة بلجيكية وسويسرية' : 'Belgian & Swiss Chocolates',
      cat: 'chocolates',
      icon: Gift,
    },
    {
      id: 'offers',
      label: isAr ? 'عروض وتخفيضات حصرية' : 'Exclusive Deals & Offers',
      cat: 'offers',
      icon: Percent,
    },
    {
      id: 'catalog',
      label: isAr ? 'تصفح كافة الأقسام والمنتجات' : 'Browse All Catalog',
      action: () => setCurrentPage('catalog'),
      icon: BookOpen,
    },
  ];

  const coffeeNavLinks = [
    {
      id: 'beans',
      label: isAr ? 'حبوب القهوة المختصة' : 'Specialty Coffee Beans',
      cat: 'حبوب القهوة المختصة',
      icon: Sparkles,
    },
    {
      id: 'pourover',
      label: isAr ? 'أدوات التحضير V60' : 'Manual Pour-Over Tools',
      cat: 'أدوات التحضير المقطرة',
      icon: Gift,
    },
    {
      id: 'espresso',
      label: isAr ? 'مكائن وإكسسوارات الإسبريسو' : 'Espresso Equipment',
      cat: 'معدات الإسبريسو',
      icon: Percent,
    },
    {
      id: 'catalog',
      label: isAr ? 'تصفح كافة الأقسام والمحاصيل' : 'Browse All Roasts & Gear',
      action: () => setCurrentPage('catalog'),
      icon: BookOpen,
    },
  ];

  const primaryNavLinks = isCoffee ? coffeeNavLinks : flowerNavLinks;

  const CartIconComp = getHeaderIcon(act.cart?.icon || 'ShoppingBag');

  return (
    <>
      <header
        onClick={() => {
          if (isBuilderMode) onSelectSubElement?.('general');
        }}
        style={{
          backgroundColor: gen.bgColor,
          borderColor: gen.borderColor,
          boxShadow:
            gen.shadow === 'sm'
              ? '0 1px 3px rgba(0,0,0,0.05)'
              : gen.shadow === 'md'
              ? '0 4px 6px -1px rgba(0,0,0,0.1)'
              : gen.shadow === 'lg'
              ? '0 10px 15px -3px rgba(0,0,0,0.1)'
              : 'none',
        }}
        className={`${!isBuilderMode && gen.sticky ? 'sticky top-0 z-40' : isBuilderMode ? 'relative z-10' : 'relative z-40'} w-full ${
          gen.backdropBlur ? 'backdrop-blur-md' : ''
        } border-b transition-colors duration-300`}
      >
        
        {/* 1. TOP BAR: Announcement Bar */}
        {ann.enabled && (
          <div
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('announcement');
              }
            }}
            className={`relative group/elem-ann transition-all ${
              isBuilderMode
                ? selectedSubElement === 'announcement'
                  ? 'ring-2 ring-indigo-500 ring-inset z-20 shadow-xs'
                  : 'hover:ring-1 hover:ring-indigo-400 hover:ring-inset cursor-pointer'
                : ''
            }`}
          >
            {isBuilderMode && (
              <div
                className={`absolute top-1 start-2 z-30 px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 shadow-sm pointer-events-none transition-all ${
                  selectedSubElement === 'announcement'
                    ? 'bg-indigo-600 text-white opacity-100 ring-1 ring-white'
                    : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-ann:opacity-100'
                }`}
              >
                <Megaphone className="w-2.5 h-2.5 text-amber-300" />
                <span>
                  {selectedSubElement === 'announcement'
                    ? (isAr ? '✓ شريط الإعلانات' : '✓ Top Bar')
                    : (isAr ? 'شريط الإعلانات' : 'Top Bar')}
                </span>
              </div>
            )}
            <div
              style={{
                backgroundColor: ann.bgColor,
                color: ann.textColor,
                borderColor: ann.borderColor,
                fontSize: `${ann.fontSize}px`,
                fontFamily: ann.fontFamily,
              }}
              className="text-[11px] sm:text-xs py-2.5 px-3 border-b overflow-hidden select-none shadow-inner"
            >
              <div
                className={`animate-marquee flex items-center gap-10 whitespace-nowrap ${
                  ann.pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
                }`}
                style={{
                  animationDuration: `${ann.speed}s`,
                }}
              >
                {[...activeMessages, ...activeMessages, ...activeMessages].map((item, idx) => {
                  const Icon = getHeaderIcon(item.icon);
                  return (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-2 shrink-0">
                      <Icon className="w-3.5 h-3.5" style={{ color: ann.iconColor }} />
                      <span className="font-semibold tracking-wide drop-shadow-xs" style={{ color: ann.textColor }}>
                        {isAr ? item.textAr : item.textEn}
                      </span>
                      <span className="mx-2 opacity-60" style={{ color: ann.iconColor }}>✦</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. Main Header Row - Fully Responsive & Aligned */}
        <div
          style={{
            paddingTop: `${gen.paddingY}px`,
            paddingBottom: `${gen.paddingY}px`,
          }}
          className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8"
        >
          
          {/* MOBILE VIEW (< lg or isMobileHeader): Perfectly Spaced 3 Zones */}
          <div className={`${isMobileHeader ? 'flex' : 'flex lg:hidden'} items-center justify-between gap-2 w-full`}>
            
            {/* Mobile Left: Menu Toggle + Search */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-[#102a1c] hover:bg-[#ede9df] active:bg-[#e2dcd0] rounded-xl transition-all duration-200 cursor-pointer active:scale-95 border border-[#e8e4dc]/80 shadow-2xs"
                aria-label="Open mobile menu"
              >
                <Menu className="w-6 h-6 stroke-[2.2]" />
              </button>

              {act.search?.enabled && (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  style={{ color: act.search.iconColor }}
                  className="p-2 hover:bg-[#ede9df] rounded-full transition-colors cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 stroke-[1.8]" />
                </button>
              )}
            </div>

            {/* Mobile Center: Centered Logo & Title */}
            <div
              onClick={(e) => {
                if (isBuilderMode) {
                  e.stopPropagation();
                  onSelectSubElement?.('logo');
                } else {
                  setCurrentPage('home');
                  setSelectedCategory(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-2 cursor-pointer select-none mx-auto text-center"
            >
              {logo.mode !== 'text_only' && displayLogoUrl && (
                <img
                  src={displayLogoUrl}
                  alt={isAr ? displayTitleAr : displayTitleEn}
                  className="h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
              {logo.mode !== 'image_only' && (
                <div className="flex flex-col text-start rtl:text-right ltr:text-left">
                  <span
                    style={{
                      color: logo.titleColor,
                      fontFamily: logo.fontFamily,
                    }}
                    className="text-base sm:text-lg font-extrabold tracking-tight leading-none"
                  >
                    {isAr ? displayTitleAr : displayTitleEn}
                  </span>
                  <span
                    style={{ color: logo.subtitleColor }}
                    className="text-[8px] uppercase tracking-widest font-sans font-medium mt-0.5"
                  >
                    {isAr ? displaySubtitleAr : displaySubtitleEn}
                  </span>
                </div>
              )}
            </div>

            {/* Mobile Right: Cart + Compact Language Button */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* User Icon on Mobile */}
              {act.account?.enabled && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{ color: act.account.iconColor }}
                  className="p-1.5 cursor-pointer"
                  aria-label="Account"
                >
                  {user.isLoggedIn ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-[#102a1c]">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Shopping Bag */}
              {act.cart?.enabled && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  style={{ color: act.cart.iconColor }}
                  className="p-2 relative hover:bg-[#ede9df] rounded-full transition-colors cursor-pointer"
                  aria-label="Cart"
                >
                  <CartIconComp className="w-5 h-5 stroke-[1.8]" />
                  {cartCount > 0 && (
                    <span
                      style={{
                        backgroundColor: act.cart.badgeBg,
                        color: act.cart.badgeText,
                      }}
                      className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {/* Compact Mobile Language Button */}
              {lang.enabled && (
                <button
                  onClick={toggleLanguage}
                  style={{
                    backgroundColor: lang.bgColor,
                    borderColor: lang.borderColor,
                    color: lang.activeColor,
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-bold border transition-all shadow-2xs cursor-pointer"
                  aria-label="Toggle language"
                >
                  {isAr ? 'EN' : 'عربي'}
                </button>
              )}
            </div>

          </div>

          {/* DESKTOP VIEW (lg:flex, hidden if isMobileHeader) */}
          <div className={`${isMobileHeader ? 'hidden' : 'hidden lg:flex'} items-center justify-between gap-6`}>
            
            {/* Action Icons (Left side) */}
            <div
              onClick={(e) => {
                if (isBuilderMode) {
                  e.stopPropagation();
                  onSelectSubElement?.('actions');
                }
              }}
              className={`relative group/elem-actions transition-all flex items-center gap-2.5 ${
                isBuilderMode
                  ? selectedSubElement === 'actions'
                    ? 'ring-2 ring-indigo-500 rounded-xl p-1 bg-indigo-50/30 z-20 shadow-xs'
                    : 'hover:ring-1 hover:ring-indigo-400 rounded-xl p-1 cursor-pointer'
                  : ''
              }`}
            >
              {isBuilderMode && (
                <div
                  className={`absolute top-0.5 start-1 z-30 px-1.5 py-0.2 rounded text-[8px] font-black flex items-center gap-0.5 shadow-sm pointer-events-none transition-all ${
                    selectedSubElement === 'actions'
                      ? 'bg-indigo-600 text-white opacity-100 ring-1 ring-white'
                      : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-actions:opacity-100'
                  }`}
                >
                  <ShoppingBag className="w-2 h-2 text-amber-300" />
                  <span>{isAr ? 'الأيقونات' : 'Actions'}</span>
                </div>
              )}

              {/* Search */}
              {act.search?.enabled && (
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  style={{ color: act.search.iconColor }}
                  className="p-2 hover:bg-[#ede9df] rounded-full transition-colors cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 stroke-[1.8]" />
                </button>
              )}

              {/* User Account / Google Sign-in */}
              {act.account?.enabled && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{ color: act.account.textColor }}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-[#ede9df] transition-all cursor-pointer border border-transparent hover:border-[#d6cfc0]"
                  aria-label="Account"
                >
                  {user.isLoggedIn ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-[#102a1c]">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold max-w-[100px] truncate">
                        {user.name.split(' ')[0]}
                      </span>
                      {act.account.showVipCrown && <Crown className="w-3.5 h-3.5 text-[#d4af37]" />}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <User className="w-5 h-5 stroke-[1.8]" style={{ color: act.account.iconColor }} />
                      {act.account.showText && (
                        <span className="text-xs font-bold">
                          {isAr ? act.account.labelAr : act.account.labelEn}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )}

              {/* Shopping Bag with Subtotal */}
              {act.cart?.enabled && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  style={{ backgroundColor: act.cart.pillBg }}
                  className="flex items-center gap-2 px-3 py-1.5 hover:opacity-90 rounded-full transition-colors relative cursor-pointer"
                  aria-label="Cart"
                >
                  <div className="relative">
                    <CartIconComp className="w-5 h-5 stroke-[1.8]" style={{ color: act.cart.iconColor }} />
                    {cartCount > 0 && (
                      <span
                        style={{
                          backgroundColor: act.cart.badgeBg,
                          color: act.cart.badgeText,
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                      >
                        {cartCount}
                      </span>
                    )}
                  </div>
                  {act.cart.showSubtotal && (
                    <span
                      style={{ color: act.cart.priceColor }}
                      className="text-xs font-bold font-mono"
                    >
                      {cartSubtotal} {isAr ? 'ر.س' : 'SAR'}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Desktop Center: Brand Identity */}
            <div
              onClick={(e) => {
                if (isBuilderMode) {
                  e.stopPropagation();
                  onSelectSubElement?.('logo');
                } else {
                  setCurrentPage('home');
                  setSelectedCategory(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`relative group/elem-logo transition-all cursor-pointer select-none group text-center flex items-center gap-3 ${
                isBuilderMode
                  ? selectedSubElement === 'logo'
                    ? 'ring-2 ring-indigo-500 rounded-xl p-1 bg-indigo-50/30 z-20 shadow-xs'
                    : 'hover:ring-1 hover:ring-indigo-400 rounded-xl p-1'
                  : ''
              }`}
            >
              {isBuilderMode && (
                <div
                  className={`absolute top-0.5 start-1 z-30 px-1.5 py-0.2 rounded text-[8px] font-black flex items-center gap-0.5 shadow-sm pointer-events-none transition-all ${
                    selectedSubElement === 'logo'
                      ? 'bg-indigo-600 text-white opacity-100 ring-1 ring-white'
                      : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-logo:opacity-100'
                  }`}
                >
                  <Crown className="w-2 h-2 text-amber-300" />
                  <span>{isAr ? 'الشعار' : 'Logo'}</span>
                </div>
              )}
              {logo.mode !== 'text_only' && displayLogoUrl && (
                <img
                  src={displayLogoUrl}
                  alt={isAr ? displayTitleAr : displayTitleEn}
                  style={{ height: `${logo.logoHeight}px` }}
                  className={`w-auto object-contain transition-transform duration-300 ${
                    logo.hoverEffect === 'scale' ? 'group-hover:scale-105' : ''
                  }`}
                  referrerPolicy="no-referrer"
                />
              )}
              {logo.mode !== 'image_only' && (
                <div className="flex flex-col text-start rtl:text-right ltr:text-left">
                  <span
                    style={{
                      color: logo.titleColor,
                      fontSize: `${logo.fontSize}px`,
                      fontFamily: logo.fontFamily,
                      fontWeight: logo.fontWeight,
                    }}
                    className={`tracking-tight leading-tight transition-colors ${
                      logo.hoverEffect === 'glow'
                        ? 'group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                        : ''
                    }`}
                  >
                    {isAr ? displayTitleAr : displayTitleEn}
                  </span>
                  <span
                    style={{
                      color: logo.subtitleColor,
                      letterSpacing: logo.letterSpacing,
                    }}
                    className="text-[10px] uppercase font-sans font-medium"
                  >
                    {isAr ? displaySubtitleAr : displaySubtitleEn}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Right: Language Toggle Pill */}
            {lang.enabled && (
              <div
                onClick={(e) => {
                  if (isBuilderMode) {
                    e.stopPropagation();
                    onSelectSubElement?.('language');
                  }
                }}
                className={`relative group/elem-lang transition-all flex items-center gap-3 ${
                  isBuilderMode
                    ? selectedSubElement === 'language'
                      ? 'ring-2 ring-indigo-500 rounded-full p-1 bg-indigo-50/30 z-20 shadow-xs'
                      : 'hover:ring-1 hover:ring-indigo-400 rounded-full p-1 cursor-pointer'
                    : ''
                }`}
              >
                {isBuilderMode && (
                  <div
                    className={`absolute top-0.5 end-1 z-30 px-1.5 py-0.2 rounded text-[8px] font-black flex items-center gap-0.5 shadow-sm pointer-events-none transition-all ${
                      selectedSubElement === 'language'
                        ? 'bg-indigo-600 text-white opacity-100 ring-1 ring-white'
                        : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-lang:opacity-100'
                    }`}
                  >
                    <Globe className="w-2 h-2 text-amber-300" />
                    <span>{isAr ? 'اللغة' : 'Lang'}</span>
                  </div>
                )}
                <div
                  style={{
                    backgroundColor: lang.bgColor,
                    borderColor: lang.borderColor,
                  }}
                  className="flex items-center text-xs font-semibold border rounded-full px-3 py-1.5 shadow-2xs"
                >
                  <button
                    onClick={() => {
                      if (!isBuilderMode) setLanguage('ar');
                    }}
                    style={{
                      color: isAr ? lang.activeColor : lang.textColor,
                    }}
                    className={`transition-colors cursor-pointer ${isAr ? 'font-bold' : 'hover:opacity-80'}`}
                  >
                    العربية
                  </button>
                  <span className="mx-2 text-[#ced4da]">|</span>
                  <button
                    onClick={() => {
                      if (!isBuilderMode) setLanguage('en');
                    }}
                    style={{
                      color: !isAr ? lang.activeColor : lang.textColor,
                    }}
                    className={`transition-colors cursor-pointer ${!isAr ? 'font-bold' : 'hover:opacity-80'}`}
                  >
                    English
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* 3. Primary Navigation Row (Desktop) */}
        {nav.enabled && (
          <nav
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('navigation');
              }
            }}
            style={{
              backgroundColor: nav.bgColor,
            }}
            className={`${isMobileHeader ? 'hidden' : 'hidden lg:block'} border-t border-[#eeebe3] relative shadow-2xs transition-all ${
              isBuilderMode
                ? selectedSubElement === 'navigation'
                  ? 'ring-2 ring-indigo-500 ring-inset z-20 shadow-xs'
                  : 'hover:ring-1 hover:ring-indigo-400 hover:ring-inset cursor-pointer'
                : ''
            }`}
          >
            {isBuilderMode && (
              <div
                className={`absolute top-0.5 start-2 z-30 px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 shadow-sm pointer-events-none transition-all ${
                  selectedSubElement === 'navigation'
                    ? 'bg-indigo-600 text-white opacity-100 ring-1 ring-white'
                    : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-nav:opacity-100'
                }`}
              >
                <Menu className="w-2.5 h-2.5 text-amber-300" />
                <span>
                  {selectedSubElement === 'navigation'
                    ? (isAr ? '✓ القائمة' : '✓ Navigation')
                    : (isAr ? 'القائمة' : 'Navigation')}
                </span>
              </div>
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ul
                style={{
                  fontSize: `${nav.fontSize}px`,
                  fontFamily: nav.fontFamily,
                  fontWeight: nav.fontWeight,
                  justifyContent:
                    nav.alignment === 'start'
                      ? 'flex-start'
                      : nav.alignment === 'space-between'
                      ? 'space-between'
                      : 'center',
                }}
                className="flex items-center gap-3 py-1.5"
              >
                {/* 1. All Collections with Mega Menu Trigger */}
                {nav.showAllCollections && (
                  <li className="relative">
                    <button
                      onClick={() => !isBuilderMode && setMegaMenuOpen(!megaMenuOpen)}
                      style={{
                        backgroundColor: megaMenuOpen
                          ? nav.allCollectionsBg || '#102a1c'
                          : undefined,
                        color: megaMenuOpen
                          ? nav.allCollectionsTextColor || '#e6ca98'
                          : nav.textColor,
                      }}
                      className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all cursor-pointer ${
                        megaMenuOpen ? 'shadow-sm' : 'hover:opacity-80'
                      }`}
                    >
                      <Menu className="w-4 h-4" />
                      <span>{allCollectionsLabel}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          megaMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </li>
                )}

                {/* Primary Nav Links */}
                {activeNavLinks.map((item) => {
                    const Icon = getHeaderIcon(item.icon);
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            if (isBuilderMode) return;
                            setMegaMenuOpen(false);
                            if (item.url?.startsWith('#')) {
                              const el = document.getElementById(item.url.slice(1));
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            } else if (item.cat) {
                              navigateToCategory(item.cat);
                            }
                          }}
                          style={{
                            color: nav.textColor,
                          }}
                          className="flex items-center gap-2 py-2 px-4 rounded-xl transition-all hover:opacity-80 cursor-pointer active:scale-98"
                        >
                          <Icon className="w-4 h-4 opacity-75" />
                          <span>{isAr ? item.labelAr : item.labelEn}</span>
                        </button>
                      </li>
                    );
                  })}

                {/* VIP Portal Link */}
                {nav.showVipPortal && (
                  <li>
                    <button
                      onClick={() => {
                        if (isBuilderMode) return;
                        setMegaMenuOpen(false);
                        setCurrentPage('crm');
                      }}
                      style={{
                        color: nav.vipPortalColor,
                      }}
                      className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all font-bold cursor-pointer hover:opacity-80"
                    >
                      <Crown className="w-4 h-4 text-[#d4af37]" />
                      <span>{vipPortalLabel}</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

          {/* MEGA MENU DROPDOWN */}
          {megaMenuOpen && (
            <div
              onMouseLeave={() => setMegaMenuOpen(false)}
              className="absolute top-full inset-x-0 bg-white border-b border-[#e8e4dc] shadow-2xl z-50 p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {isCoffee ? (
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Col 1: Coffee Visual Highlights */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-[#8c8275] uppercase tracking-wider block">
                      {isAr ? 'أحدث المحاصيل والتحميص الحرفي' : 'Featured Coffee Roasts'}
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'm-cof-1', name: 'إثيوبيا يرقاتشيفي', nameEn: 'Ethiopian Yirgacheffe', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80' },
                        { id: 'm-cof-2', name: 'كولومبيا غيشا ريزيرف', nameEn: 'Colombian Geisha', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
                        { id: 'm-cof-3', name: 'أدوات V60 مقطرة', nameEn: 'V60 Pour-Over', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80' },
                        { id: 'm-cof-4', name: 'أكواب سيراميك باريستا', nameEn: 'Ceramic Cups', image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80' },
                      ].map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            navigateToCategory('حبوب القهوة المختصة');
                            setMegaMenuOpen(false);
                          }}
                          className="group/item cursor-pointer rounded-2xl overflow-hidden bg-[#2b1810] aspect-square relative shadow-xs"
                        >
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover/item:scale-108 transition-transform duration-300 filter brightness-90"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                            <span className="text-white text-[11px] font-bold leading-tight">
                              {isAr ? cat.name : cat.nameEn}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Col 2: Specialty Beans */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#102a1c] uppercase tracking-wider pb-1 border-b border-[#f0ede6] flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#c88a58]" />
                      <span>{isAr ? 'حبوب القهوة المختصة' : 'Specialty Beans'}</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[#555]">
                      {['حبوب القهوة المختصة', 'محاصيل سنجل أوريجن', 'محاصيل المعالجة المجففة', 'محاصيل المعالجة المغسولة', 'اشتراكات القهوة الدورية'].map((name) => (
                        <li key={name}>
                          <button
                            onClick={() => {
                              navigateToCategory('حبوب القهوة المختصة');
                              setMegaMenuOpen(false);
                            }}
                            className="hover:text-[#c88a58] hover:font-bold transition-all text-start cursor-pointer"
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Col 3: Pour-Over & Espresso Gear */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#102a1c] uppercase tracking-wider pb-1 border-b border-[#f0ede6] flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-[#c88a58]" />
                      <span>{isAr ? 'أدوات التحضير والمعدات' : 'Brewing & Espresso Gear'}</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[#555]">
                      {['أدوات التحضير المقطرة', 'فلاتر وأباريق ترشيح V60', 'معدات وإكسسوارات الإسبريسو', 'مطاحن القهوة الاحترافية', 'موازين ومؤقتات رقمية'].map((name) => (
                        <li key={name}>
                          <button
                            onClick={() => {
                              navigateToCategory('أدوات التحضير المقطرة');
                              setMegaMenuOpen(false);
                            }}
                            className="hover:text-[#c88a58] hover:font-bold transition-all text-start cursor-pointer"
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Col 4: Cold Brew & Lifestyle */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#102a1c] uppercase tracking-wider pb-1 border-b border-[#f0ede6] flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-[#c88a58]" />
                      <span>{isAr ? 'القهوة الباردة واللايف ستايل' : 'Cold Brew & Lifestyle'}</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[#555]">
                      {['القهوة الباردة (كولد برو)', 'أكواب سيراميك وباريستا', 'أكواب حافظة للحرارة', 'بوكسات إهداء المحامص', 'حلويات وكيك مكمل'].map((name) => (
                        <li key={name}>
                          <button
                            onClick={() => {
                              navigateToCategory('القهوة الباردة');
                              setMegaMenuOpen(false);
                            }}
                            className="hover:text-[#c88a58] hover:font-bold transition-all text-start cursor-pointer"
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Col 1: Visual Highlights */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-[#8c8275] uppercase tracking-wider block">
                      {isAr ? 'أحدث الباقات والتنسيقات' : 'Featured Floral Edits'}
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {EIGHT_FEATURED_CATEGORIES.slice(0, 4).map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            navigateToCategory(cat.name);
                            setMegaMenuOpen(false);
                          }}
                          className="group/item cursor-pointer rounded-2xl overflow-hidden bg-[#f0ece4] aspect-square relative shadow-xs"
                        >
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover/item:scale-108 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                            <span className="text-white text-[11px] font-bold leading-tight">
                              {isAr ? cat.name : cat.nameEn}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Col 2: Fresh Flowers */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#102a1c] uppercase tracking-wider pb-1 border-b border-[#f0ede6] flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{isAr ? 'الزهور والورود الطبيعية' : 'Fresh Flowers'}</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[#555]">
                      {[
                        { ar: 'باقات الورود الطبيعية', en: 'Natural Flower Bouquets' },
                        { ar: 'ورد أحمر', en: 'Red Roses' },
                        { ar: 'ورد أبيض', en: 'White Roses' },
                        { ar: 'باقات ورود طبيعية مخفضة', en: 'Discounted Bouquets' },
                        { ar: 'فازات ورود طبيعية', en: 'Natural Flower Vases' }
                      ].map((item) => (
                        <li key={item.ar}>
                          <button
                            onClick={() => {
                              navigateToCategory(isAr ? item.ar : item.en);
                              setMegaMenuOpen(false);
                            }}
                            className="hover:text-[#102a1c] hover:font-bold transition-all text-start cursor-pointer"
                          >
                            {isAr ? item.ar : item.en}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Col 3: Cakes, Sweets & Gifts */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#102a1c] uppercase tracking-wider pb-1 border-b border-[#f0ede6] flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-[#8b263e]" />
                      <span>{isAr ? 'الحلا والشوكولاتة والضيافة' : 'Sweets & Chocolates'}</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[#555]">
                      {[
                        { ar: 'ورد وشوكولاتة بلجيكية فاخرة', en: 'Roses & Belgian Chocolate' },
                        { ar: 'ورد و كيك', en: 'Roses & Cake' },
                        { ar: 'ورد و قهوة و حلا', en: 'Roses, Coffee & Sweets' },
                        { ar: 'ورود مع أسماك وعصافير', en: 'Roses with Fish & Birds' }
                      ].map((item) => (
                        <li key={item.ar}>
                          <button
                            onClick={() => {
                              navigateToCategory(isAr ? item.ar : item.en);
                              setMegaMenuOpen(false);
                            }}
                            className="hover:text-[#102a1c] hover:font-bold transition-all text-start cursor-pointer"
                          >
                            {isAr ? item.ar : item.en}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Col 4: Occasions */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#102a1c] uppercase tracking-wider pb-1 border-b border-[#f0ede6] flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{isAr ? 'المناسبات والاحتفالات' : 'Special Occasions'}</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[#555]">
                      {[
                        { ar: 'هدايا عيد ميلاد', en: 'Birthday Gifts' },
                        { ar: 'هدايا الزواج', en: 'Wedding Gifts' },
                        { ar: 'ذكرى زواج وحب', en: 'Anniversary & Romance' },
                        { ar: 'هدايا المواليد', en: 'Newborn Welcome Gifts' },
                        { ar: 'هدايا التخرج', en: 'Graduation Milestones' },
                        { ar: 'لوحات مواجيب', en: 'Mawajib Wooden Plaques' }
                      ].map((item) => (
                        <li key={item.ar}>
                          <button
                            onClick={() => {
                              navigateToCategory(isAr ? item.ar : item.en);
                              setMegaMenuOpen(false);
                            }}
                            className="hover:text-[#102a1c] hover:font-bold transition-all text-start cursor-pointer"
                          >
                            {isAr ? item.ar : item.en}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      )}

        {/* 4. Instant Search Drawer Modal */}
        {searchOpen && (
          <div className="bg-white border-b border-[#e8e4dc] p-4 sm:p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3.5 px-12 rounded-2xl bg-[#FAF9F5] border border-[#d6cfc0] focus:border-[#102a1c] focus:outline-none text-sm text-[#102a1c] shadow-inner"
                />
                <Search className="absolute top-1/2 -translate-y-1/2 rtl:right-4 ltr:left-4 w-5 h-5 text-[#8c8275]" />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute top-1/2 -translate-y-1/2 rtl:left-4 ltr:right-4 text-xs font-bold text-[#8c8275] hover:text-[#102a1c] cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>

              {/* Live Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-[#f0ede6] bg-[#FAF9F5] rounded-2xl p-2 border border-[#e8e4dc]">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        navigateToCategory(product.category);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 p-2.5 hover:bg-white rounded-xl cursor-pointer transition-colors"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-[#102a1c]">{isAr ? product.name : product.nameEn}</h4>
                        <p className="text-[11px] text-[#8c8275]">{isAr ? product.category : product.categoryEn}</p>
                      </div>
                      <span className="text-xs font-bold font-mono text-[#102a1c]">{product.price} {isAr ? 'ر.س' : 'SAR'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </header>

      {/* 5. PORTAL-BASED MOBILE HAMBURGER DRAWER (Guaranteed to open over entire screen with zero parent interference) */}
      {mobileMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] overflow-hidden select-none">
            {/* Dimmed Backdrop with Blur - Click to close smoothly */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
              aria-hidden="true"
            />

            {/* Side Drawer Container: Slides from side smoothly based on RTL / LTR */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-y-0 max-w-full flex rtl:right-0 ltr:left-0 z-[100000]"
            >
              <div className="w-[86vw] max-w-[340px] bg-gradient-to-b from-[#FAF9F5] via-[#f7f2e6] to-[#ede4ce] h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between border-l rtl:border-l-0 rtl:border-r border-[#d4af37]/40 animate-in rtl:slide-in-from-right ltr:slide-in-from-left duration-300 ease-out">
                
                <div className="space-y-4">
                  {/* Header Bar inside Drawer */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#ded7c4]">
                    <div className="flex items-center gap-2.5">
                      {displayLogoUrl && (
                        <img
                          src={displayLogoUrl}
                          alt={isAr ? displayTitleAr : displayTitleEn}
                          className="h-8 w-auto object-contain rounded-lg"
                        />
                      )}
                      <div className="flex flex-col text-start">
                        <span className="font-serif font-extrabold text-lg text-[#102a1c] leading-none">
                          {isAr ? displayTitleAr : displayTitleEn}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-[#8c8275] font-sans mt-0.5">
                          {isAr ? displaySubtitleAr : displaySubtitleEn}
                        </span>
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-9 h-9 rounded-full bg-[#102a1c]/10 hover:bg-[#102a1c] text-[#102a1c] hover:text-[#e6ca98] flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-95"
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5 stroke-[2.2]" />
                    </button>
                  </div>

                  {/* User Account / Google Sign-in Card */}
                  <div
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="p-3.5 bg-white rounded-2xl border border-[#ded7c4] flex items-center gap-3 cursor-pointer shadow-sm hover:border-[#102a1c] transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#102a1c] text-[#e6ca98] flex items-center justify-center shrink-0 shadow-xs">
                      {user.isLoggedIn ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#d4af37]">
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#102a1c] truncate">
                        {user.isLoggedIn ? user.name : (isAr ? 'تسجيل الدخول / Google' : 'Sign In')}
                      </h4>
                      <p className="text-[11px] text-[#7a7164] font-medium truncate">
                        {user.isLoggedIn ? (isAr ? 'عضوية النخبة الفاخرة' : 'VIP Member') : (isAr ? 'اضغط للمتابعة السريعة' : 'Tap to continue')}
                      </p>
                    </div>
                    <Crown className="w-4 h-4 text-[#d4af37] shrink-0" />
                  </div>

                  {/* Ultra-Readable Bold Navigation Links */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#8c8275] px-2 block mb-1">
                      {isAr ? 'القائمة الرئيسية' : 'Main Menu'}
                    </span>
                    
                    {/* Home */}
                    <button
                      onClick={() => {
                        setCurrentPage('home');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-start py-3 px-3.5 rounded-xl hover:bg-white text-[15px] font-extrabold text-[#102a1c] flex items-center justify-between transition-all cursor-pointer shadow-2xs bg-white/70 border border-[#e2dcd0]/50"
                    >
                      <span>{isAr ? 'الصفحة الرئيسية' : 'Home Page'}</span>
                      {isAr ? <ChevronLeft className="w-4 h-4 text-[#102a1c]" /> : <ChevronRight className="w-4 h-4 text-[#102a1c]" />}
                    </button>

                    {/* Primary 4 Links */}
                    {primaryNavLinks.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          if (item.action) {
                            item.action();
                          } else if (item.cat) {
                            navigateToCategory(item.cat);
                          }
                        }}
                        className="w-full text-start py-2.5 px-3.5 rounded-xl hover:bg-white text-[14.5px] font-extrabold text-[#152e20] flex items-center justify-between transition-all cursor-pointer hover:shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#102a1c]/10 text-[#102a1c] flex items-center justify-center">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        {isAr ? <ChevronLeft className="w-4 h-4 text-[#7a7164]" /> : <ChevronRight className="w-4 h-4 text-[#7a7164]" />}
                      </button>
                    ))}

                    {/* VIP Portal */}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setCurrentPage('crm');
                      }}
                      className="w-full text-start py-2.5 px-3.5 rounded-xl bg-[#8b263e]/15 hover:bg-[#8b263e]/25 text-[14.5px] font-black text-[#8b263e] flex items-center justify-between transition-all cursor-pointer mt-1 border border-[#8b263e]/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#8b263e]/25 text-[#8b263e] flex items-center justify-center">
                          <Crown className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <span>{isAr ? 'بوابة العميل VIP والطلبات' : 'VIP Portal & Orders'}</span>
                      </div>
                      {isAr ? <ChevronLeft className="w-4 h-4 text-[#8b263e]" /> : <ChevronRight className="w-4 h-4 text-[#8b263e]" />}
                    </button>
                  </div>

                  {/* Popular Categories Shortcut List */}
                  <div className="pt-2 border-t border-[#ded7c4]">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#8c8275] px-2 block mb-2">
                      {isAr ? 'أشهر الأقسام' : 'Popular Categories'}
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-extrabold text-[#1a2d21]">
                      {[
                        { name: 'باقات الورود الطبيعية', label: 'ورد طبيعي' },
                        { name: 'ورد وشوكولاتة بلجيكية فاخرة', label: 'ورد وشوكولاتة' },
                        { name: 'ورد و كيك', label: 'ورد وكيك' },
                        { name: 'فازات ورود طبيعية', label: 'فازات ورود' },
                        { name: 'هدايا رجالية', label: 'هدايا رجالية' },
                        { name: 'هدايا نسائية', label: 'هدايا نسائية' }
                      ].map((c) => (
                        <button
                          key={c.name}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigateToCategory(c.name);
                          }}
                          className="p-2.5 rounded-xl bg-white/80 hover:bg-[#102a1c] hover:text-[#e6ca98] text-start transition-all cursor-pointer truncate shadow-2xs border border-[#ded7c4]"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Mobile Drawer Bottom Area */}
                <div className="pt-4 border-t border-[#ded7c4] space-y-3">
                  {/* WhatsApp Concierge direct button */}
                  <a
                    href={`https://wa.me/${MECCA_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(
                      isAr ? 'مرحباً هدايا مكة، أود الاستفسار والمساعدة في الطلب' : 'Hello Hadaya Mecca, I need help ordering'
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{isAr ? 'محادثة المنسق المباشر (واتساب)' : 'Chat with Florist'}</span>
                  </a>

                  {/* Language switch button inside drawer */}
                  <div className="flex items-center justify-between text-xs text-[#7a7164]">
                    <span className="font-semibold">{isAr ? 'اللغة / Language:' : 'Language:'}</span>
                    <button
                      onClick={toggleLanguage}
                      className="px-3.5 py-1 rounded-full border border-[#d6cfc0] bg-white text-[#102a1c] font-black shadow-2xs"
                    >
                      {isAr ? 'English ⇄' : 'العربية ⇄'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
