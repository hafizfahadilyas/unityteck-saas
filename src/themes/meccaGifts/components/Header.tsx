import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import {
  Search,
  User,
  ShoppingBag,
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
  Phone
} from 'lucide-react';
import { PRODUCTS, EIGHT_FEATURED_CATEGORIES, MECCA_WHATSAPP } from '../data/mockData';

export const Header: React.FC = () => {
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
    setIsAuthModalOpen
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const isAr = language === 'ar';
  const headerProducts = products && products.length > 0 ? products : PRODUCTS;

  const searchResults = searchQuery.trim()
    ? headerProducts.filter((p) =>
        isAr
          ? p.name.includes(searchQuery) || p.category.includes(searchQuery)
          : p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.categoryEn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Marquee Announcement Messages
  const marqueeItems = [
    {
      icon: Clock,
      text: isAr ? 'توصيل عاجل مبرد خلال 60 دقيقة في مكة المكرمة' : '60-Min Chilled Express Delivery in Mecca'
    },
    {
      icon: Truck,
      text: isAr ? 'شحن مجاني لكافة الطلبات فوق 299 ريال' : 'Free Shipping on Orders Above 299 SAR'
    },
    {
      icon: CreditCard,
      text: isAr ? 'قسّط مشترياتك على 4 دفعات بدون أي فوائد مع تابي وتمارا' : 'Split into 4 interest-free payments with Tabby & Tamara'
    },
    {
      icon: Sparkles,
      text: isAr ? 'أفخم باقات الورد الطبيعي المستورد يومياً من هولندا والإكوادور' : '100% Fresh Natural Flowers Imported Daily from Holland & Ecuador'
    }
  ];

  // 4 Primary Links with Icons
  const primaryNavLinks = [
    {
      id: 'natural',
      label: isAr ? 'باقات الورد الطبيعي' : 'Natural Flowers',
      icon: Sparkles,
      cat: 'باقات الورود الطبيعية'
    },
    {
      id: 'occasions',
      label: isAr ? 'المناسبات والهدايا' : 'Occasions & Gifts',
      icon: Gift,
      cat: 'تصنيفات حسب المناسبة'
    },
    {
      id: 'offers',
      label: isAr ? 'العروض والتخفيضات' : 'Exclusive Offers',
      icon: Percent,
      cat: 'باقات ورود طبيعية مخفضة'
    },
    {
      id: 'magazine',
      label: isAr ? 'مجلة هدايا مكة' : 'Hadaya Magazine',
      icon: BookOpen,
      action: () => {
        setCurrentPage('home');
        setTimeout(() => {
          const el = document.getElementById('magazine-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  ];

  const toggleLanguage = () => {
    setLanguage(isAr ? 'en' : 'ar');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#fbf9f4] via-[#FAF9F5] to-[#f6f2e9] backdrop-blur-md border-b border-[#e6ca98]/40 shadow-xs transition-colors duration-300">
        
        {/* 1. TOP BAR: Dark Luxury Gradient with Full White Crisp Text as requested */}
        <div className="bg-gradient-to-r from-[#05140b] via-[#0d2719] to-[#05140b] text-white text-[11px] sm:text-xs py-2.5 px-3 border-b border-[#d4af37]/35 overflow-hidden select-none shadow-inner">
          <div className="animate-marquee flex items-center gap-10 whitespace-nowrap">
            {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#f3e5ab]" />
                  <span className="font-semibold tracking-wide text-white drop-shadow-xs">{item.text}</span>
                  <span className="text-[#f3e5ab]/60 mx-2">✦</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Main Header Row - Fully Responsive & Aligned */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          
          {/* MOBILE VIEW (< lg): Perfectly Spaced 3 Zones, No Overlapping */}
          <div className="flex lg:hidden items-center justify-between gap-2 w-full">
            
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

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-[#343a40] hover:text-[#102a1c] hover:bg-[#ede9df] rounded-full transition-colors cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Mobile Center: Centered Logo & Title */}
            <div
              onClick={() => {
                setCurrentPage('home');
                setSelectedCategory(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 cursor-pointer select-none mx-auto text-center"
            >
              <img
                src="https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png"
                alt="هدايا مكة"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col text-start rtl:text-right ltr:text-left">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#102a1c] font-serif leading-none">
                  هدايا مكة
                </span>
                <span className="text-[8px] uppercase tracking-widest text-[#8c8275] font-sans font-medium mt-0.5">
                  GIFTS & FLOWERS
                </span>
              </div>
            </div>

            {/* Mobile Right: Cart + Compact Language Button */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* User Icon on Mobile */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="p-1.5 text-[#343a40] hover:text-[#102a1c] cursor-pointer"
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

              {/* Shopping Bag */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-[#102a1c] relative hover:bg-[#ede9df] rounded-full transition-colors cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#8b263e] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Compact Mobile Language Button */}
              <button
                onClick={toggleLanguage}
                className="px-2.5 py-1 rounded-full text-xs font-bold border border-[#d6cfc0] bg-white text-[#102a1c] hover:bg-[#102a1c] hover:text-white transition-all shadow-2xs cursor-pointer"
                aria-label="Toggle language"
              >
                {isAr ? 'EN' : 'عربي'}
              </button>
            </div>

          </div>

          {/* DESKTOP VIEW (lg:flex) */}
          <div className="hidden lg:flex items-center justify-between gap-6">
            
            {/* Action Icons (Left side) */}
            <div className="flex items-center gap-2.5">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-[#343a40] hover:text-[#102a1c] hover:bg-[#ede9df] rounded-full transition-colors cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* User Account / Google Sign-in */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-[#ede9df] text-[#343a40] hover:text-[#102a1c] transition-all cursor-pointer border border-transparent hover:border-[#d6cfc0]"
                aria-label="Account"
              >
                {user.isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-[#102a1c]">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold max-w-[100px] truncate text-[#102a1c]">
                      {user.name.split(' ')[0]}
                    </span>
                    <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <User className="w-5 h-5 stroke-[1.8]" />
                    <span className="text-xs font-bold">
                      {isAr ? 'دخول / Google' : 'Sign In'}
                    </span>
                  </div>
                )}
              </button>

              {/* Shopping Bag with Subtotal */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-[#343a40] hover:text-[#102a1c] bg-[#102a1c]/5 hover:bg-[#102a1c]/10 rounded-full transition-colors relative cursor-pointer"
                aria-label="Cart"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 stroke-[1.8] text-[#102a1c]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#8b263e] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold font-mono text-[#102a1c]">
                  {cartSubtotal} {isAr ? 'ر.س' : 'SAR'}
                </span>
              </button>
            </div>

            {/* Desktop Center: Brand Identity */}
            <div
              onClick={() => {
                setCurrentPage('home');
                setSelectedCategory(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-3 cursor-pointer select-none group text-center"
            >
              <img
                src="https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png"
                alt="هدايا مكة"
                className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col text-start rtl:text-right ltr:text-left">
                <span className="text-2xl font-extrabold tracking-tight text-[#102a1c] font-serif group-hover:text-[#8b263e] transition-colors leading-tight">
                  هدايا مكة
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#8c8275] font-sans font-medium">
                  GIFTS AND FLOWERS
                </span>
              </div>
            </div>

            {/* Desktop Right: Language Toggle Pill */}
            <div className="flex items-center gap-3">
              <div className="flex items-center text-xs font-semibold text-[#495057] border border-[#d8d2c4] rounded-full px-3 py-1.5 bg-white shadow-2xs">
                <button
                  onClick={() => setLanguage('ar')}
                  className={`transition-colors cursor-pointer ${isAr ? 'text-[#102a1c] font-bold' : 'text-[#868e96] hover:text-[#102a1c]'}`}
                >
                  العربية
                </button>
                <span className="mx-2 text-[#ced4da]">|</span>
                <button
                  onClick={() => setLanguage('en')}
                  className={`transition-colors cursor-pointer ${!isAr ? 'text-[#102a1c] font-bold' : 'text-[#868e96] hover:text-[#102a1c]'}`}
                >
                  English
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Primary Navigation Row (Desktop) with subtle gradient */}
        <nav className="hidden lg:block border-t border-[#eeebe3] bg-gradient-to-r from-white via-[#faf8f4] to-white relative shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center justify-center gap-3 py-1.5 text-[14.5px] font-semibold text-[#2c332d]">
              
              {/* 1. All Collections with Mega Menu Trigger */}
              <li className="relative">
                <button
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all cursor-pointer ${
                    megaMenuOpen
                      ? 'bg-[#102a1c] text-[#e6ca98] shadow-sm'
                      : 'hover:bg-[#102a1c]/5 hover:text-[#102a1c]'
                  }`}
                >
                  <Menu className="w-4 h-4" />
                  <span>{isAr ? 'كافة المجموعات' : 'All Collections'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </li>

              {/* 2. Exactly 4 Clean Primary Links with Icons */}
              {primaryNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setMegaMenuOpen(false);
                        if (item.action) {
                          item.action();
                        } else if (item.cat) {
                          navigateToCategory(item.cat);
                        }
                      }}
                      className="flex items-center gap-2 py-2 px-4 rounded-xl transition-all hover:bg-[#102a1c]/5 hover:text-[#102a1c] text-[#333a35] hover:scale-102 cursor-pointer active:scale-98"
                    >
                      <Icon className="w-4 h-4 text-[#102a1c]/70 group-hover:text-[#102a1c]" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}

              {/* 3. VIP Portal Link */}
              <li>
                <button
                  onClick={() => {
                    setMegaMenuOpen(false);
                    setCurrentPage('crm');
                  }}
                  className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all text-[#8b263e] hover:bg-[#8b263e]/10 font-bold cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  <span>{isAr ? 'بوابة VIP' : 'VIP Portal'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* MEGA MENU DROPDOWN */}
          {megaMenuOpen && (
            <div
              onMouseLeave={() => setMegaMenuOpen(false)}
              className="absolute top-full inset-x-0 bg-white border-b border-[#e8e4dc] shadow-2xl z-50 p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-200"
            >
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
                    {['باقات الورود الطبيعية', 'ورد أحمر', 'ورد أبيض', 'باقات ورود طبيعية مخفضة', 'فازات ورود طبيعية'].map((name) => (
                      <li key={name}>
                        <button
                          onClick={() => {
                            navigateToCategory(name);
                            setMegaMenuOpen(false);
                          }}
                          className="hover:text-[#102a1c] hover:font-bold transition-all text-start cursor-pointer"
                        >
                          {name}
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
                    {['ورد وشوكولاتة بلجيكية فاخرة', 'ورد و كيك', 'ورد و قهوة و حلا', 'ورود مع أسماك وعصافير'].map((name) => (
                      <li key={name}>
                        <button
                          onClick={() => {
                            navigateToCategory(name);
                            setMegaMenuOpen(false);
                          }}
                          className="hover:text-[#102a1c] hover:font-bold transition-all text-start cursor-pointer"
                        >
                          {name}
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
                    {['هدايا عيد ميلاد', 'هدايا الزواج', 'ذكرى زواج وحب', 'هدايا المواليد', 'هدايا التخرج', 'لوحات مواجيب'].map((name) => (
                      <li key={name}>
                        <button
                          onClick={() => {
                            navigateToCategory(name);
                            setMegaMenuOpen(false);
                          }}
                          className="hover:text-[#102a1c] hover:font-bold transition-all text-start cursor-pointer"
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          )}
        </nav>

        {/* 4. Instant Search Drawer Modal */}
        {searchOpen && (
          <div className="bg-white border-b border-[#e8e4dc] p-4 sm:p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder={isAr ? 'ابحث عن باقات ورد، شوكولاتة باتشي، كيك كوري، هدايا...' : 'Search for flowers, Patchi chocolates, cakes, gifts...'}
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
                      <img
                        src="https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png"
                        alt="هدايا مكة"
                        className="h-8 w-auto object-contain"
                      />
                      <div className="flex flex-col text-start">
                        <span className="font-serif font-extrabold text-lg text-[#102a1c] leading-none">هدايا مكة</span>
                        <span className="text-[9px] uppercase tracking-wider text-[#8c8275] font-sans mt-0.5">GIFTS & FLOWERS</span>
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
