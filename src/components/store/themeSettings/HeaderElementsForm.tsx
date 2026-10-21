import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  Heart,
  User,
  Phone,
  MessageCircle,
  Plus,
  Trash2,
  Sliders,
  Palette,
  Layout,
  ExternalLink,
  ChevronDown,
  Megaphone,
  Truck,
  CreditCard,
  Clock,
  Gift,
  Percent,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
} from '../../../themes/settings/themeSettingsStore';
import {
  type HeaderCustomSettings,
  getDefaultHeaderSettings,
  type HeaderAnnouncementMessage,
  type HeaderNavLink,
} from '../../../themes/settings/headerCustomSettings';

const ANNOUNCEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Truck,
  CreditCard,
  Clock,
  Gift,
  Percent,
};

export const HeaderElementsForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [headerSettings, setHeaderSettings] = useState<HeaderCustomSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.customHeader || getDefaultHeaderSettings(activeStore);
  });

  const [activeSubTab, setActiveSubTab] = useState<'icons' | 'logo' | 'navigation' | 'announcement' | 'style'>('icons');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Sync if store changes
  useEffect(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    setHeaderSettings(full.customHeader || getDefaultHeaderSettings(activeStore));
  }, [activeStore.id]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.customHeader = headerSettings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات الهيدر بنجاح' : 'Header settings saved successfully', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 250);
  };

  const handleReset = () => {
    const fresh = getDefaultHeaderSettings(activeStore);
    setHeaderSettings(fresh);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.customHeader = fresh;
    writeAllThemeSettings(activeStore.id, full);
    toast(isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Reset to default header settings', 'info');
  };

  const toggleTrack = (on: boolean) =>
    `w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
      on ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
    }`;

  // Safe action icon objects with fallback defaults
  const actions = headerSettings.actions;
  const wishlist = actions.wishlist || {
    enabled: true,
    iconColor: '#e11d48',
    badgeBg: '#e11d48',
    badgeText: '#ffffff',
    showBadgeCount: true,
  };
  const whatsapp = actions.whatsapp || {
    enabled: true,
    phoneNumber: '9668008440443',
    tooltipAr: 'تواصل مباشر مع المتجر',
    tooltipEn: 'Live Store WhatsApp',
    iconColor: '#25D366',
    pulseAnimation: true,
  };
  const cartAction = actions.cart;
  const accountAction = actions.account;
  const searchAction = actions.search;

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Layout className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black truncate">
              {isAr ? 'مخصص عناصر الهيدر والشعار' : 'Header, Logo & Action Icons'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {isAr
                ? 'تخصيص الشعار، أيقونات الهارت والسلة والواتساب والروابط'
                : 'Customize logo, heart wishlist, cart, whatsapp and nav links'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 transition-transform active:scale-95"
        >
          {savedFlash ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saving ? (isAr ? 'حفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم!' : 'Saved!') : (isAr ? 'حفظ' : 'Save')}</span>
        </button>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold">
        {[
          { id: 'icons', labelAr: 'أيقونات الإجراءات', labelEn: 'Action Icons', icon: Heart },
          { id: 'logo', labelAr: 'الشعار والهوية', labelEn: 'Logo & Title', icon: Palette },
          { id: 'navigation', labelAr: 'روابط القائمة', labelEn: 'Nav Links', icon: Sliders },
          { id: 'announcement', labelAr: 'شريط الإعلانات', labelEn: 'Top Marquee', icon: Megaphone },
          { id: 'style', labelAr: 'المظهر والتثبيت', labelEn: 'Header Style', icon: Layout },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: ACTION ICONS (HEART WISHLIST, CART, WHATSAPP, PROFILE, SEARCH) ─── */}
      {activeSubTab === 'icons' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* 1. Wishlist Heart Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة المفضلة (Wishlist Heart)' : 'Wishlist (Heart Icon)'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'إظهار زر التفضيل وحفظ المنتجات بالهيدر' : 'Toggle wishlist heart in header'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      wishlist: { ...wishlist, enabled: !wishlist.enabled },
                    },
                  }))
                }
                className={toggleTrack(wishlist.enabled)}
                aria-label="Wishlist toggle"
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {wishlist.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون الأيقونة' : 'Heart Color'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={wishlist.iconColor || '#e11d48'}
                      onChange={(e) =>
                        setHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            wishlist: { ...wishlist, iconColor: e.target.value },
                          },
                        }))
                      }
                      className="w-7 h-7 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={wishlist.iconColor || '#e11d48'}
                      onChange={(e) =>
                        setHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            wishlist: { ...wishlist, iconColor: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'عداد المنتجات' : 'Show Badge Count'}</label>
                  <button
                    type="button"
                    onClick={() =>
                      setHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          wishlist: { ...wishlist, showBadgeCount: !wishlist.showBadgeCount },
                        },
                      }))
                    }
                    className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-start text-[11px] font-bold flex items-center justify-between"
                  >
                    <span>{wishlist.showBadgeCount ? (isAr ? 'مفعل' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Cart / Add to Cart Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة السلة (Shopping Cart)' : 'Shopping Cart Icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'أيقونة سلة الشراء والعداد العائم' : 'Cart icon, counter badge and pill'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      cart: { ...cartAction, enabled: !cartAction.enabled },
                    },
                  }))
                }
                className={toggleTrack(cartAction.enabled)}
                aria-label="Cart toggle"
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {cartAction.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  {(['ShoppingBag', 'ShoppingCart', 'ShoppingBasket'] as const).map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() =>
                        setHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            cart: { ...cartAction, icon: ic },
                          },
                        }))
                      }
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        cartAction.icon === ic
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {ic === 'ShoppingBag' && <ShoppingBag className="w-4 h-4" />}
                      {ic === 'ShoppingCart' && <ShoppingCart className="w-4 h-4" />}
                      {ic === 'ShoppingBasket' && <ShoppingBasket className="w-4 h-4" />}
                      <span className="text-[10px]">{ic}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون خلفية شارة العداد' : 'Badge Color'}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cartAction.badgeBg || '#c88a58'}
                        onChange={(e) =>
                          setHeaderSettings((p) => ({
                            ...p,
                            actions: {
                              ...p.actions,
                              cart: { ...cartAction, badgeBg: e.target.value },
                            },
                          }))
                        }
                        className="w-7 h-7 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cartAction.badgeBg || '#c88a58'}
                        onChange={(e) =>
                          setHeaderSettings((p) => ({
                            ...p,
                            actions: {
                              ...p.actions,
                              cart: { ...cartAction, badgeBg: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'إظهار المجموع' : 'Show Subtotal'}</label>
                    <button
                      type="button"
                      onClick={() =>
                        setHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            cart: { ...cartAction, showSubtotal: !cartAction.showSubtotal },
                          },
                        }))
                      }
                      className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-start text-[11px] font-bold flex items-center justify-between"
                    >
                      <span>{cartAction.showSubtotal ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'معطل' : 'Off')}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. WhatsApp Direct Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#25D366] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 fill-[#25D366]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة الواتساب (WhatsApp Chat)' : 'WhatsApp Icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'زر الدردشة الفورية مع الدعم في الهيدر' : 'Direct WhatsApp chat in top header'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      whatsapp: { ...whatsapp, enabled: !whatsapp.enabled },
                    },
                  }))
                }
                className={toggleTrack(whatsapp.enabled)}
                aria-label="WhatsApp toggle"
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {whatsapp.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'رقم الواتساب الرسمي (بدون + أو فراغات)' : 'WhatsApp Phone Number'}</label>
                  <input
                    type="text"
                    value={whatsapp.phoneNumber || '9668008440443'}
                    onChange={(e) =>
                      setHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          whatsapp: { ...whatsapp, phoneNumber: e.target.value.replace(/\D/g, '') },
                        },
                      }))
                    }
                    placeholder="966500000000"
                    dir="ltr"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'نص التلميح (عربي)' : 'Tooltip (AR)'}</label>
                    <input
                      type="text"
                      value={whatsapp.tooltipAr || 'تواصل معنا واتساب'}
                      onChange={(e) =>
                        setHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            whatsapp: { ...whatsapp, tooltipAr: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'تأثير النبض' : 'Pulse Animation'}</label>
                    <button
                      type="button"
                      onClick={() =>
                        setHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            whatsapp: { ...whatsapp, pulseAnimation: !whatsapp.pulseAnimation },
                          },
                        }))
                      }
                      className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-start text-[11px] font-bold flex items-center justify-between"
                    >
                      <span>{whatsapp.pulseAnimation ? (isAr ? 'نبض مفعل' : 'Pulse Active') : (isAr ? 'ثابت' : 'Static')}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Profile / Account Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة الحساب (Profile / Login)' : 'User Profile Icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'تسجيل الدخول والملف الشخصي' : 'Customer profile & authentication'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      account: { ...accountAction, enabled: !accountAction.enabled },
                    },
                  }))
                }
                className={toggleTrack(accountAction.enabled)}
                aria-label="Account toggle"
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {accountAction.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'النص (عربي)' : 'Label (AR)'}</label>
                  <input
                    type="text"
                    value={accountAction.labelAr || 'حسابي'}
                    onChange={(e) =>
                      setHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          account: { ...accountAction, labelAr: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-2 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'النص (إنجليزي)' : 'Label (EN)'}</label>
                  <input
                    type="text"
                    value={accountAction.labelEn || 'Sign In'}
                    onChange={(e) =>
                      setHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          account: { ...accountAction, labelEn: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-2 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Search Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة البحث (Instant Search)' : 'Search Modal Icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'نافذة البحث الفوري عن المنتجات' : 'Instant product search popup'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      search: { ...searchAction, enabled: !searchAction.enabled },
                    },
                  }))
                }
                className={toggleTrack(searchAction.enabled)}
                aria-label="Search toggle"
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {searchAction.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'نص تلميح البحث (عربي)' : 'Search Placeholder (AR)'}</label>
                  <input
                    type="text"
                    value={searchAction.placeholderAr || ''}
                    onChange={(e) =>
                      setHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          search: { ...searchAction, placeholderAr: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: LOGO & IDENTITY ─── */}
      {activeSubTab === 'logo' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'نمط عرض الشعار' : 'Logo Display Mode'}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'image_and_text', labelAr: 'شعار مع نص', labelEn: 'Image & Text' },
                { id: 'image_only', labelAr: 'صورة فقط', labelEn: 'Image Only' },
                { id: 'text_only', labelAr: 'نص فقط', labelEn: 'Text Only' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setHeaderSettings((p) => ({
                      ...p,
                      logo: { ...p.logo, mode: m.id as any },
                    }))
                  }
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    headerSettings.logo.mode === m.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px]">{isAr ? m.labelAr : m.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'رابط صورة الشعار (URL)' : 'Logo Image URL'}</label>
            <input
              type="text"
              value={headerSettings.logo.imageUrl || ''}
              onChange={(e) =>
                setHeaderSettings((p) => ({
                  ...p,
                  logo: { ...p.logo, imageUrl: e.target.value },
                }))
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              placeholder="https://..."
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'اسم المتجر (عربي)' : 'Store Title (AR)'}</label>
              <input
                type="text"
                value={headerSettings.logo.titleAr || ''}
                onChange={(e) =>
                  setHeaderSettings((p) => ({
                    ...p,
                    logo: { ...p.logo, titleAr: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'اسم المتجر (إنجليزي)' : 'Store Title (EN)'}</label>
              <input
                type="text"
                value={headerSettings.logo.titleEn || ''}
                onChange={(e) =>
                  setHeaderSettings((p) => ({
                    ...p,
                    logo: { ...p.logo, titleEn: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'العنوان الفرعي (عربي)' : 'Subtitle (AR)'}</label>
              <input
                type="text"
                value={headerSettings.logo.subtitleAr || ''}
                onChange={(e) =>
                  setHeaderSettings((p) => ({
                    ...p,
                    logo: { ...p.logo, subtitleAr: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'العنوان الفرعي (إنجليزي)' : 'Subtitle (EN)'}</label>
              <input
                type="text"
                value={headerSettings.logo.subtitleEn || ''}
                onChange={(e) =>
                  setHeaderSettings((p) => ({
                    ...p,
                    logo: { ...p.logo, subtitleEn: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'ارتفاع الشعار (px)' : 'Height (px)'}</label>
              <input
                type="number"
                min="20"
                max="100"
                value={headerSettings.logo.logoHeight || 44}
                onChange={(e) =>
                  setHeaderSettings((p) => ({
                    ...p,
                    logo: { ...p.logo, logoHeight: Number(e.target.value) },
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون النص' : 'Title Color'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={headerSettings.logo.titleColor || '#000000'}
                  onChange={(e) =>
                    setHeaderSettings((p) => ({
                      ...p,
                      logo: { ...p.logo, titleColor: e.target.value },
                    }))
                  }
                  className="w-7 h-7 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={headerSettings.logo.titleColor || '#000000'}
                  onChange={(e) =>
                    setHeaderSettings((p) => ({
                      ...p,
                      logo: { ...p.logo, titleColor: e.target.value },
                    }))
                  }
                  className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: NAVIGATION MENU LINKS ─── */}
      {activeSubTab === 'navigation' && (
        <div className="space-y-3 animate-in fade-in duration-200 text-xs">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                {isAr ? 'روابط القائمة الرئيسية' : 'Main Menu Navigation Links'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const newLink: HeaderNavLink = {
                    id: `nav-${Date.now()}`,
                    labelAr: 'رابط جديد',
                    labelEn: 'New Link',
                    icon: 'Sparkles',
                    url: 'products',
                    active: true,
                  };
                  setHeaderSettings((p) => ({
                    ...p,
                    navigation: {
                      ...p.navigation,
                      links: [...(p.navigation.links || []), newLink],
                    },
                  }));
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-emerald-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة رابط' : '+ Add Link'}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {(headerSettings.navigation.links || []).map((link, idx) => (
                <div
                  key={link.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={link.labelAr}
                      onChange={(e) => {
                        const copy = [...headerSettings.navigation.links];
                        copy[idx] = { ...copy[idx], labelAr: e.target.value };
                        setHeaderSettings((p) => ({ ...p, navigation: { ...p.navigation, links: copy } }));
                      }}
                      placeholder="الاسم بالعربي"
                      className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                    <input
                      type="text"
                      value={link.labelEn}
                      onChange={(e) => {
                        const copy = [...headerSettings.navigation.links];
                        copy[idx] = { ...copy[idx], labelEn: e.target.value };
                        setHeaderSettings((p) => ({ ...p, navigation: { ...p.navigation, links: copy } }));
                      }}
                      placeholder="English label"
                      className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = headerSettings.navigation.links.filter((_, i) => i !== idx);
                        setHeaderSettings((p) => ({ ...p, navigation: { ...p.navigation, links: filtered } }));
                      }}
                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{isAr ? 'الوجهة:' : 'URL:'}</span>
                    <input
                      type="text"
                      value={link.url || link.cat || 'products'}
                      onChange={(e) => {
                        const copy = [...headerSettings.navigation.links];
                        copy[idx] = { ...copy[idx], url: e.target.value };
                        setHeaderSettings((p) => ({ ...p, navigation: { ...p.navigation, links: copy } }));
                      }}
                      className="w-full px-2 py-0.5 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      dir="ltr"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: TOP ANNOUNCEMENT BAR ─── */}
      {activeSubTab === 'announcement' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold">{isAr ? 'تفعيل شريط الإعلانات العلوي' : 'Enable Announcement Bar'}</h4>
              <p className="text-[10px] text-slate-400">{isAr ? 'شريط ترويجي متحرك أعلى الصفحة' : 'Top marquee with promotions & offers'}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setHeaderSettings((p) => ({
                  ...p,
                  announcement: { ...p.announcement, enabled: !p.announcement.enabled },
                }))
              }
              className={toggleTrack(headerSettings.announcement.enabled)}
              aria-label="Announcement toggle"
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {headerSettings.announcement.enabled && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون الخلفية' : 'Background Color'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headerSettings.announcement.bgColor || '#0d0704'}
                      onChange={(e) =>
                        setHeaderSettings((p) => ({
                          ...p,
                          announcement: { ...p.announcement, bgColor: e.target.value },
                        }))
                      }
                      className="w-7 h-7 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={headerSettings.announcement.bgColor || '#0d0704'}
                      onChange={(e) =>
                        setHeaderSettings((p) => ({
                          ...p,
                          announcement: { ...p.announcement, bgColor: e.target.value },
                        }))
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون النص' : 'Text Color'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headerSettings.announcement.textColor || '#ffffff'}
                      onChange={(e) =>
                        setHeaderSettings((p) => ({
                          ...p,
                          announcement: { ...p.announcement, textColor: e.target.value },
                        }))
                      }
                      className="w-7 h-7 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={headerSettings.announcement.textColor || '#ffffff'}
                      onChange={(e) =>
                        setHeaderSettings((p) => ({
                          ...p,
                          announcement: { ...p.announcement, textColor: e.target.value },
                        }))
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{isAr ? 'الرسائل الترويجية' : 'Promo Messages'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newMsg: HeaderAnnouncementMessage = {
                        id: `msg-${Date.now()}`,
                        icon: 'Sparkles',
                        textAr: 'رسالة ترويجية جديدة',
                        textEn: 'New Promotion Message',
                        active: true,
                      };
                      setHeaderSettings((p) => ({
                        ...p,
                        announcement: {
                          ...p.announcement,
                          messages: [...p.announcement.messages, newMsg],
                        },
                      }));
                    }}
                    className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    {isAr ? '+ إضافة رسالة' : '+ Add Message'}
                  </button>
                </div>

                {headerSettings.announcement.messages.map((msg, mIdx) => (
                  <div key={msg.id} className="p-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={msg.textAr}
                        onChange={(e) => {
                          const copy = [...headerSettings.announcement.messages];
                          copy[mIdx] = { ...copy[mIdx], textAr: e.target.value };
                          setHeaderSettings((p) => ({ ...p, announcement: { ...p.announcement, messages: copy } }));
                        }}
                        className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = headerSettings.announcement.messages.filter((_, i) => i !== mIdx);
                          setHeaderSettings((p) => ({ ...p, announcement: { ...p.announcement, messages: filtered } }));
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: HEADER STYLING ─── */}
      {activeSubTab === 'style' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold">{isAr ? 'تثبيت الهيدر أثناء التمرير (Sticky Header)' : 'Sticky Header on Scroll'}</span>
            <button
              type="button"
              onClick={() =>
                setHeaderSettings((p) => ({
                  ...p,
                  general: { ...p.general, sticky: !p.general.sticky },
                }))
              }
              className={toggleTrack(headerSettings.general.sticky)}
              aria-label="Sticky toggle"
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold">{isAr ? 'تأثير الزجاج الشفاف (Backdrop Blur)' : 'Glassmorphism Backdrop Blur'}</span>
            <button
              type="button"
              onClick={() =>
                setHeaderSettings((p) => ({
                  ...p,
                  general: { ...p.general, backdropBlur: !p.general.backdropBlur },
                }))
              }
              className={toggleTrack(headerSettings.general.backdropBlur)}
              aria-label="Blur toggle"
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون خلفية الهيدر' : 'Header Bg Color'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={headerSettings.general.bgColor || '#ffffff'}
                  onChange={(e) =>
                    setHeaderSettings((p) => ({
                      ...p,
                      general: { ...p.general, bgColor: e.target.value },
                    }))
                  }
                  className="w-7 h-7 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={headerSettings.general.bgColor || '#ffffff'}
                  onChange={(e) =>
                    setHeaderSettings((p) => ({
                      ...p,
                      general: { ...p.general, bgColor: e.target.value },
                    }))
                  }
                  className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'ارتفاع الحشوة (Padding Y)' : 'Padding Y (px)'}</label>
              <input
                type="number"
                min="4"
                max="30"
                value={headerSettings.general.paddingY || 10}
                onChange={(e) =>
                  setHeaderSettings((p) => ({
                    ...p,
                    general: { ...p.general, paddingY: Number(e.target.value) },
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save & Reset Actions Bar */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استرجاع الافتراضي' : 'Reset'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
        >
          {savedFlash ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Save className="w-4 h-4" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'تطبيق وحفظ الهيدر' : 'Save Header')}</span>
        </button>
      </div>
    </div>
  );
};
