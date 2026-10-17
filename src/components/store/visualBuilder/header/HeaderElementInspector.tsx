import React from 'react';
import {
  HeaderCustomSettings,
  HeaderSubElementKey,
  HeaderAnnouncementMessage,
  HeaderNavLink,
} from '../../../../themes/settings/headerCustomSettings';
import {
  ANNOUNCEMENT_TEMPLATES,
  LOGO_TEMPLATES,
  NAVIGATION_TEMPLATES,
  ACTIONS_TEMPLATES,
  LANGUAGE_TEMPLATES,
} from '../../../../themes/settings/headerElementTemplates';
import {
  Megaphone,
  Crown,
  Menu,
  ShoppingBag,
  Globe,
  Sliders,
  Type,
  Palette,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Search,
  User,
  Clock,
  Truck,
  CreditCard,
  Gift,
  Percent,
  BookOpen,
  Heart,
  Star,
  Flame,
  Tag,
  ShieldCheck,
  Bell,
  Eye,
  EyeOff,
  MoveHorizontal,
  ChevronDown,
} from 'lucide-react';

interface HeaderElementInspectorProps {
  settings: HeaderCustomSettings;
  activeSubElement: HeaderSubElementKey;
  onSelectSubElement: (element: HeaderSubElementKey) => void;
  onUpdateSettings: (newSettings: HeaderCustomSettings) => void;
  activeTab: 'content' | 'templates' | 'styling' | 'layout' | 'code' | 'ai';
  setActiveTab: (tab: 'content' | 'templates' | 'styling' | 'layout' | 'code' | 'ai') => void;
  isAr: boolean;
}

export const HeaderElementInspector: React.FC<HeaderElementInspectorProps> = ({
  settings,
  activeSubElement,
  onSelectSubElement,
  onUpdateSettings,
  activeTab,
  setActiveTab,
  isAr,
}) => {
  // Helpers to update settings immutably
  const updateSub = <K extends keyof HeaderCustomSettings>(
    key: K,
    updater: (prevVal: HeaderCustomSettings[K]) => HeaderCustomSettings[K],
  ) => {
    const nextVal = updater(settings[key]);
    onUpdateSettings({
      ...settings,
      [key]: nextVal,
    });
  };

  const AVAILABLE_ICONS = [
    { id: 'Clock', label: isAr ? 'ساعة' : 'Clock', Icon: Clock },
    { id: 'Truck', label: isAr ? 'شاحنة توصيل' : 'Truck', Icon: Truck },
    { id: 'CreditCard', label: isAr ? 'بطاقة دفع' : 'Card', Icon: CreditCard },
    { id: 'Sparkles', label: isAr ? 'بريق' : 'Sparkles', Icon: Sparkles },
    { id: 'Gift', label: isAr ? 'هدية' : 'Gift', Icon: Gift },
    { id: 'Percent', label: isAr ? 'خصم' : 'Discount', Icon: Percent },
    { id: 'BookOpen', label: isAr ? 'مجلة' : 'Magazine', Icon: BookOpen },
    { id: 'Crown', label: isAr ? 'تاج VIP' : 'Crown', Icon: Crown },
    { id: 'Heart', label: isAr ? 'قلب' : 'Heart', Icon: Heart },
    { id: 'Star', label: isAr ? 'نجمة' : 'Star', Icon: Star },
    { id: 'Flame', label: isAr ? 'شعلة' : 'Flame', Icon: Flame },
    { id: 'Tag', label: isAr ? 'عرض' : 'Tag', Icon: Tag },
    { id: 'ShieldCheck', label: isAr ? 'أمان' : 'Shield', Icon: ShieldCheck },
    { id: 'Bell', label: isAr ? 'تنبيه' : 'Bell', Icon: Bell },
  ];

  const FONT_OPTIONS = [
    { id: 'Tajawal', label: 'Tajawal (تجوال - عصري)' },
    { id: 'Cairo', label: 'Cairo (كايرو - رسمي)' },
    { id: 'Amiri', label: 'Amiri (أميري - أندلسي فاخر)' },
    { id: 'serif', label: 'Serif (كلاسيكي مائل)' },
    { id: 'sans', label: 'Sans (عصري خفيف)' },
    { id: 'Playfair Display', label: 'Playfair Display (فاخر إنجليزي)' },
  ];

  const QUICK_PALETTE = [
    '#102a1c',
    '#05140b',
    '#e6ca98',
    '#d4af37',
    '#8b263e',
    '#FAF9F5',
    '#ffffff',
    '#09090b',
    '#1e293b',
    '#4f46e5',
  ];

  return (
    <div className="space-y-4">
      {/* 1. TOP SUB-ELEMENT NAVIGATOR PILLS */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-md border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'عناصر رأس المتجر (Header Elements):' : 'Select Header Element to Edit:'}</span>
          </span>
          <span className="text-[10px] bg-indigo-600/60 text-indigo-100 px-2 py-0.5 rounded-full font-mono">
            {activeSubElement}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {[
            { id: 'announcement' as const, labelAr: 'شريط الإعلانات', labelEn: 'Top Bar', icon: Megaphone },
            { id: 'logo' as const, labelAr: 'شعار المتجر', labelEn: 'Logo & Brand', icon: Crown },
            { id: 'navigation' as const, labelAr: 'القائمة الرئيسية', labelEn: 'Navigation', icon: Menu },
            { id: 'actions' as const, labelAr: 'الأيقونات والسلة', labelEn: 'Actions & Cart', icon: ShoppingBag },
            { id: 'language' as const, labelAr: 'تبديل اللغة', labelEn: 'Language', icon: Globe },
            { id: 'general' as const, labelAr: 'حاوية الهيدر', labelEn: 'Container', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = activeSubElement === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSubElement(item.id)}
                className={`p-2 rounded-xl text-start flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center ${
                  isCurrent
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white font-extrabold shadow-sm scale-102'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-300 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-slate-400'}`} />
                <span className="text-[10.5px] leading-tight truncate max-w-full">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TAB 1: CONTENT FOR CURRENT ACTIVE ELEMENT */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* A. ANNOUNCEMENT BAR CONTENT */}
          {activeSubElement === 'announcement' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">
                    {isAr ? 'تفعيل شريط الإعلانات العلوي' : 'Enable Top Announcement Bar'}
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    {isAr ? 'عرض الرسائل الترويجية المتحركة بأعلى المتجر' : 'Display animated top marquee announcements'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.announcement.enabled}
                  onChange={(e) =>
                    updateSub('announcement', (prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              {settings.announcement.enabled && (
                <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'رسائل الإعلانات والعروض' : 'Announcement Messages'}</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full font-mono">
                        {settings.announcement.messages.length}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newMsg: HeaderAnnouncementMessage = {
                          id: `msg-${Date.now()}`,
                          icon: 'Sparkles',
                          textAr: 'رسالة إعلانية جديدة فاخرة للمتجر',
                          textEn: 'New exclusive store announcement highlight',
                          active: true,
                        };
                        updateSub('announcement', (prev) => ({
                          ...prev,
                          messages: [...prev.messages, newMsg],
                        }));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'إضافة رسالة' : 'Add Message'}</span>
                    </button>
                  </div>

                  {/* Messages List */}
                  <div className="space-y-2.5">
                    {settings.announcement.messages.map((msg, idx) => (
                      <div
                        key={msg.id}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold text-slate-400 font-mono">
                            #{idx + 1}
                          </span>
                          {/* Icon Selector */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{isAr ? 'الأيقونة:' : 'Icon:'}</span>
                            <select
                              value={msg.icon}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateSub('announcement', (prev) => ({
                                  ...prev,
                                  messages: prev.messages.map((m) =>
                                    m.id === msg.id ? { ...m, icon: val } : m,
                                  ),
                                }));
                              }}
                              className="px-1.5 py-1 text-[11px] font-bold border border-slate-200 rounded-lg bg-slate-50 cursor-pointer"
                            >
                              {AVAILABLE_ICONS.map((ico) => (
                                <option key={ico.id} value={ico.id}>
                                  {ico.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {/* Toggle Active & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                updateSub('announcement', (prev) => ({
                                  ...prev,
                                  messages: prev.messages.map((m) =>
                                    m.id === msg.id ? { ...m, active: !m.active } : m,
                                  ),
                                }));
                              }}
                              className={`p-1 rounded cursor-pointer ${
                                msg.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                              }`}
                              title={msg.active ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'معطل' : 'Disabled')}
                            >
                              {msg.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateSub('announcement', (prev) => ({
                                  ...prev,
                                  messages: prev.messages.filter((m) => m.id !== msg.id),
                                }));
                              }}
                              className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Arabic Text */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            {isAr ? 'النص بالعربية' : 'Arabic Text'}
                          </label>
                          <input
                            type="text"
                            value={msg.textAr}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateSub('announcement', (prev) => ({
                                ...prev,
                                messages: prev.messages.map((m) =>
                                  m.id === msg.id ? { ...m, textAr: val } : m,
                                ),
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                          />
                        </div>

                        {/* English Text */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            {isAr ? 'النص بالإنجليزية' : 'English Text'}
                          </label>
                          <input
                            type="text"
                            value={msg.textEn}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateSub('announcement', (prev) => ({
                                ...prev,
                                messages: prev.messages.map((m) =>
                                  m.id === msg.id ? { ...m, textEn: val } : m,
                                ),
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Marquee Speed & Hover Pause */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'سرعة الحركة (ثانية)' : 'Marquee Speed (s)'}
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="60"
                        value={settings.announcement.speed}
                        onChange={(e) =>
                          updateSub('announcement', (prev) => ({
                            ...prev,
                            speed: Number(e.target.value) || 25,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        checked={settings.announcement.pauseOnHover}
                        onChange={(e) =>
                          updateSub('announcement', (prev) => ({
                            ...prev,
                            pauseOnHover: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        id="pauseOnHover"
                      />
                      <label htmlFor="pauseOnHover" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                        {isAr ? 'إيقاف الحركة عند التأشير' : 'Pause on Hover'}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. LOGO & BRAND IDENTITY CONTENT */}
          {activeSubElement === 'logo' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'هيكل ونمط الشعار' : 'Logo Display Mode'}</span>
                </span>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'image_and_text' as const, labelAr: 'صورة + نص', labelEn: 'Image + Text' },
                    { id: 'image_only' as const, labelAr: 'صورة فقط', labelEn: 'Image Only' },
                    { id: 'text_only' as const, labelAr: 'نص فقط', labelEn: 'Text Only' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        updateSub('logo', (prev) => ({ ...prev, mode: mode.id }))
                      }
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        settings.logo.mode === mode.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-extrabold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isAr ? mode.labelAr : mode.labelEn}
                    </button>
                  ))}
                </div>

                {/* Logo Image URL & Size (if not text only) */}
                {settings.logo.mode !== 'text_only' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'رابط صورة الشعار (Logo Image URL)' : 'Logo Image URL'}
                      </label>
                      <input
                        type="text"
                        value={settings.logo.imageUrl}
                        onChange={(e) =>
                          updateSub('logo', (prev) => ({ ...prev, imageUrl: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'ارتفاع الشعار (Logo Height)' : 'Logo Height'}:{' '}
                          <span className="text-indigo-600 font-mono">{settings.logo.logoHeight}px</span>
                        </label>
                        <input
                          type="range"
                          min="24"
                          max="80"
                          value={settings.logo.logoHeight}
                          onChange={(e) =>
                            updateSub('logo', (prev) => ({
                              ...prev,
                              logoHeight: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      {settings.logo.imageUrl && (
                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={settings.logo.imageUrl}
                            alt="preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Logo Brand Names (if not image only) */}
                {settings.logo.mode !== 'image_only' && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'اسم المتجر الرئيسي (عربي)' : 'Store Name (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={settings.logo.titleAr}
                        onChange={(e) =>
                          updateSub('logo', (prev) => ({ ...prev, titleAr: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'اسم المتجر (إنجليزي)' : 'Store Name (English)'}
                      </label>
                      <input
                        type="text"
                        value={settings.logo.titleEn}
                        onChange={(e) =>
                          updateSub('logo', (prev) => ({ ...prev, titleEn: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'الشعار الفرعي (عربي)' : 'Subtitle (AR)'}
                        </label>
                        <input
                          type="text"
                          value={settings.logo.subtitleAr}
                          onChange={(e) =>
                            updateSub('logo', (prev) => ({ ...prev, subtitleAr: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'الشعار الفرعي (إنجليزي)' : 'Subtitle (EN)'}
                        </label>
                        <input
                          type="text"
                          value={settings.logo.subtitleEn}
                          onChange={(e) =>
                            updateSub('logo', (prev) => ({ ...prev, subtitleEn: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover Effect */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'تأثير التحويم بالماوس (Hover Animation)' : 'Hover Animation'}
                  </label>
                  <select
                    value={settings.logo.hoverEffect}
                    onChange={(e) =>
                      updateSub('logo', (prev) => ({
                        ...prev,
                        hoverEffect: e.target.value as any,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="scale">{isAr ? 'تكبير سلس (Scale)' : 'Smooth Scale'}</option>
                    <option value="glow">{isAr ? 'توهج ولمعان ذهبي (Glow)' : 'Gold Glow'}</option>
                    <option value="none">{isAr ? 'بدون تأثير' : 'None'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* C. NAVIGATION MENU CONTENT */}
          {activeSubElement === 'navigation' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Menu className="w-4 h-4 text-indigo-600" />
                    <span>{isAr ? 'روابط القائمة الرئيسية' : 'Navigation Menu Links'}</span>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full font-mono">
                      {settings.navigation.links.length}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newLink: HeaderNavLink = {
                        id: `nav-${Date.now()}`,
                        labelAr: 'رابط جديد',
                        labelEn: 'New Link',
                        icon: 'Sparkles',
                        cat: 'الرئيسية',
                        active: true,
                      };
                      updateSub('navigation', (prev) => ({
                        ...prev,
                        links: [...prev.links, newLink],
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAr ? 'إضافة رابط' : 'Add Link'}</span>
                  </button>
                </div>

                {/* Special Triggers */}
                <div className="space-y-2 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                      <Menu className="w-3.5 h-3.5 text-indigo-700" />
                      <span>{isAr ? 'زر "كافة المجموعات" (القائمة الشاملة)' : 'All Collections Mega Menu'}</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.navigation.showAllCollections}
                      onChange={(e) =>
                        updateSub('navigation', (prev) => ({
                          ...prev,
                          showAllCollections: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {settings.navigation.showAllCollections && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={settings.navigation.allCollectionsLabelAr}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({
                            ...prev,
                            allCollectionsLabelAr: e.target.value,
                          }))
                        }
                        className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                        placeholder="كافة المجموعات"
                      />
                      <input
                        type="text"
                        value={settings.navigation.allCollectionsLabelEn}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({
                            ...prev,
                            allCollectionsLabelEn: e.target.value,
                          }))
                        }
                        className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                        placeholder="All Collections"
                      />
                    </div>
                  )}
                </div>

                {/* VIP Portal Trigger */}
                <div className="space-y-2 bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-rose-950 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isAr ? 'زر "بوابة VIP" المميز' : 'VIP Portal Button'}</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.navigation.showVipPortal}
                      onChange={(e) =>
                        updateSub('navigation', (prev) => ({
                          ...prev,
                          showVipPortal: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-rose-600 cursor-pointer"
                    />
                  </div>

                  {settings.navigation.showVipPortal && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={settings.navigation.vipPortalLabelAr}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({
                            ...prev,
                            vipPortalLabelAr: e.target.value,
                          }))
                        }
                        className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                        placeholder="بوابة VIP"
                      />
                      <input
                        type="text"
                        value={settings.navigation.vipPortalLabelEn}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({
                            ...prev,
                            vipPortalLabelEn: e.target.value,
                          }))
                        }
                        className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                        placeholder="VIP Portal"
                      />
                    </div>
                  )}
                </div>

                {/* Primary Nav Links List */}
                <div className="space-y-2 pt-1">
                  {settings.navigation.links.map((link, idx) => (
                    <div
                      key={link.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 font-mono">
                          #{idx + 1}
                        </span>
                        {/* Icon Selector */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">{isAr ? 'أيقونة:' : 'Icon:'}</span>
                          <select
                            value={link.icon}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateSub('navigation', (prev) => ({
                                ...prev,
                                links: prev.links.map((l) =>
                                  l.id === link.id ? { ...l, icon: val } : l,
                                ),
                              }));
                            }}
                            className="px-1.5 py-0.5 text-[11px] font-bold border border-slate-200 rounded-lg bg-slate-50 cursor-pointer"
                          >
                            {AVAILABLE_ICONS.map((ico) => (
                              <option key={ico.id} value={ico.id}>
                                {ico.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            updateSub('navigation', (prev) => ({
                              ...prev,
                              links: prev.links.filter((l) => l.id !== link.id),
                            }));
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            {isAr ? 'الاسم (عربي)' : 'Name (AR)'}
                          </label>
                          <input
                            type="text"
                            value={link.labelAr}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateSub('navigation', (prev) => ({
                                ...prev,
                                links: prev.links.map((l) =>
                                  l.id === link.id ? { ...l, labelAr: val } : l,
                                ),
                              }));
                            }}
                            className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            {isAr ? 'الاسم (إنجليزي)' : 'Name (EN)'}
                          </label>
                          <input
                            type="text"
                            value={link.labelEn}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateSub('navigation', (prev) => ({
                                ...prev,
                                links: prev.links.map((l) =>
                                  l.id === link.id ? { ...l, labelEn: val } : l,
                                ),
                              }));
                            }}
                            className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-slate-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          {isAr ? 'التصنيف أو الرابط (Category / URL)' : 'Category / Link'}
                        </label>
                        <input
                          type="text"
                          value={link.cat || link.url || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSub('navigation', (prev) => ({
                              ...prev,
                              links: prev.links.map((l) =>
                                l.id === link.id ? { ...l, cat: val, url: val } : l,
                              ),
                            }));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white font-mono text-[11px]"
                          placeholder="باقات الورود الطبيعية or #magazine"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* D. ACTIONS & ICONS CONTENT */}
          {activeSubElement === 'actions' && (
            <div className="space-y-4">
              {/* Search Control */}
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-slate-700" />
                    <span>{isAr ? 'زر وأيقونة البحث (Search)' : 'Search Icon & Modal'}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.actions.search.enabled}
                    onChange={(e) =>
                      updateSub('actions', (prev) => ({
                        ...prev,
                        search: { ...prev.search, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {settings.actions.search.enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'نص توجيهي (عربي)' : 'Placeholder (AR)'}
                      </label>
                      <input
                        type="text"
                        value={settings.actions.search.placeholderAr}
                        onChange={(e) =>
                          updateSub('actions', (prev) => ({
                            ...prev,
                            search: { ...prev.search, placeholderAr: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'نص توجيهي (إنجليزي)' : 'Placeholder (EN)'}
                      </label>
                      <input
                        type="text"
                        value={settings.actions.search.placeholderEn}
                        onChange={(e) =>
                          updateSub('actions', (prev) => ({
                            ...prev,
                            search: { ...prev.search, placeholderEn: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Account / User Control */}
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-700" />
                    <span>{isAr ? 'زر الحساب وتسجيل الدخول (Account)' : 'Account & Sign In'}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.actions.account.enabled}
                    onChange={(e) =>
                      updateSub('actions', (prev) => ({
                        ...prev,
                        account: { ...prev.account, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {settings.actions.account.enabled && (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        {isAr ? 'عرض النص بجانب أيقونة الحساب' : 'Show Text Beside Icon'}
                      </label>
                      <input
                        type="checkbox"
                        checked={settings.actions.account.showText}
                        onChange={(e) =>
                          updateSub('actions', (prev) => ({
                            ...prev,
                            account: { ...prev.account, showText: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {settings.actions.account.showText && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={settings.actions.account.labelAr}
                          onChange={(e) =>
                            updateSub('actions', (prev) => ({
                              ...prev,
                              account: { ...prev.account, labelAr: e.target.value },
                            }))
                          }
                          className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                          placeholder="دخول / Google"
                        />
                        <input
                          type="text"
                          value={settings.actions.account.labelEn}
                          onChange={(e) =>
                            updateSub('actions', (prev) => ({
                              ...prev,
                              account: { ...prev.account, labelEn: e.target.value },
                            }))
                          }
                          className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                          placeholder="Sign In"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Control */}
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span>{isAr ? 'أيقونة سلة المشتريات (Cart Bag)' : 'Shopping Cart Bag'}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.actions.cart.enabled}
                    onChange={(e) =>
                      updateSub('actions', (prev) => ({
                        ...prev,
                        cart: { ...prev.cart, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>

                {settings.actions.cart.enabled && (
                  <div className="space-y-2.5 pt-1 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'شكل الأيقونة' : 'Icon Type'}
                        </label>
                        <select
                          value={settings.actions.cart.icon}
                          onChange={(e) =>
                            updateSub('actions', (prev) => ({
                              ...prev,
                              cart: { ...prev.cart, icon: e.target.value as any },
                            }))
                          }
                          className="w-full px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="ShoppingBag">{isAr ? 'حقيبة تسوق (Bag)' : 'Bag'}</option>
                          <option value="ShoppingCart">{isAr ? 'عربة تسوق (Cart)' : 'Cart'}</option>
                          <option value="ShoppingBasket">{isAr ? 'سلة تقليدية (Basket)' : 'Basket'}</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <label className="text-[10px] font-bold text-slate-700">
                          {isAr ? 'عرض إجمالي السلة' : 'Show Subtotal'}
                        </label>
                        <input
                          type="checkbox"
                          checked={settings.actions.cart.showSubtotal}
                          onChange={(e) =>
                            updateSub('actions', (prev) => ({
                              ...prev,
                              cart: { ...prev.cart, showSubtotal: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* E. LANGUAGE SWITCHER CONTENT */}
          {activeSubElement === 'language' && (
            <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'تفعيل زر تبديل اللغة (العربية / English)' : 'Language Switcher'}</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.language.enabled}
                  onChange={(e) =>
                    updateSub('language', (prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {settings.language.enabled && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'نمط عرض زر اللغة' : 'Display Style'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'pill' as const, labelAr: 'كبسولة دائرية', labelEn: 'Pill' },
                      { id: 'toggle' as const, labelAr: 'مفتاح تبديل', labelEn: 'Toggle' },
                      { id: 'text' as const, labelAr: 'نص بسيط', labelEn: 'Text' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          updateSub('language', (prev) => ({ ...prev, style: st.id }))
                        }
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          settings.language.style === st.id
                            ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isAr ? st.labelAr : st.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* F. GENERAL CONTAINER CONTENT */}
          {activeSubElement === 'general' && (
            <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                {isAr ? 'إعدادات وسلوك الهيدر العام' : 'General Header Behavior'}
              </span>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'هيدر ثابت أعلى الصفحة (Sticky Header)' : 'Sticky Header on Scroll'}
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.general.sticky}
                    onChange={(e) =>
                      updateSub('general', (prev) => ({ ...prev, sticky: e.target.checked }))
                    }
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'تأثير الزجاج الشفاف الضبابي (Backdrop Blur)' : 'Backdrop Blur (Glass UI)'}
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.general.backdropBlur}
                    onChange={(e) =>
                      updateSub('general', (prev) => ({
                        ...prev,
                        backdropBlur: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'ظل الهيدر (Shadow Depth)' : 'Shadow Depth'}
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['none', 'sm', 'md', 'lg'] as const).map((sh) => (
                      <button
                        key={sh}
                        type="button"
                        onClick={() => updateSub('general', (prev) => ({ ...prev, shadow: sh }))}
                        className={`py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                          settings.general.shadow === sh
                            ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sh.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: TEMPLATES FOR ACTIVE SUB-ELEMENT */}
      {activeTab === 'templates' && (
        <div className="space-y-3">
          <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="text-[11px] text-indigo-950">
              <span className="font-bold">
                {isAr ? 'نماذج جاهزة خاصة بـ: ' : 'Ready-to-use Presets for: '}
              </span>
              <span className="font-extrabold text-indigo-700 underline">
                {activeSubElement}
              </span>
            </div>
          </div>

          {/* Render Templates List according to activeSubElement */}
          {(() => {
            let tpls = ANNOUNCEMENT_TEMPLATES;
            let currentKey = settings.announcement.template;

            if (activeSubElement === 'logo') {
              tpls = LOGO_TEMPLATES;
              currentKey = settings.logo.template;
            } else if (activeSubElement === 'navigation') {
              tpls = NAVIGATION_TEMPLATES;
              currentKey = settings.navigation.template;
            } else if (activeSubElement === 'actions') {
              tpls = ACTIONS_TEMPLATES;
              currentKey = settings.actions.template;
            } else if (activeSubElement === 'language') {
              tpls = LANGUAGE_TEMPLATES;
              currentKey = settings.language.template;
            }

            return (
              <div className="grid grid-cols-1 gap-2.5">
                {tpls.map((tpl) => {
                  const isCurrent = currentKey === tpl.key;
                  return (
                    <div
                      key={tpl.key}
                      onClick={() => {
                        const patch = tpl.apply(settings);
                        onUpdateSettings({
                          ...settings,
                          ...patch,
                        });
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isCurrent
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: tpl.previewBg }}
                          />
                          <span className="text-xs font-extrabold text-slate-900">
                            {isAr ? tpl.nameAr : tpl.nameEn}
                          </span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900">
                          {tpl.badge}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-slate-500 line-clamp-2 mb-2">
                        {isAr ? tpl.descAr : tpl.descEn}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tpl.key}
                        </span>
                        {isCurrent ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{isAr ? 'مطبق حالياً' : 'Active'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                            {isAr ? 'تطبيق هذا النموذج' : 'Apply Preset'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. TAB 3: STYLING FOR ACTIVE SUB-ELEMENT */}
      {activeTab === 'styling' && (
        <div className="space-y-4">
          {/* Colors Card */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'ألوان وتدرجات العنصر' : 'Colors & Theme Accent'}</span>
            </span>

            {/* ANNOUNCEMENT COLORS */}
            {activeSubElement === 'announcement' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'لون خلفية الشريط (Background Color)' : 'Background Color'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.announcement.bgColor}
                      onChange={(e) =>
                        updateSub('announcement', (prev) => ({ ...prev, bgColor: e.target.value }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={settings.announcement.bgColor}
                      onChange={(e) =>
                        updateSub('announcement', (prev) => ({ ...prev, bgColor: e.target.value }))
                      }
                      className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون النص' : 'Text Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.announcement.textColor}
                        onChange={(e) =>
                          updateSub('announcement', (prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.announcement.textColor}
                        onChange={(e) =>
                          updateSub('announcement', (prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون الأيقونات' : 'Icon Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.announcement.iconColor}
                        onChange={(e) =>
                          updateSub('announcement', (prev) => ({ ...prev, iconColor: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.announcement.iconColor}
                        onChange={(e) =>
                          updateSub('announcement', (prev) => ({ ...prev, iconColor: e.target.value }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOGO COLORS & FONTS */}
            {activeSubElement === 'logo' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون اسم المتجر' : 'Title Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.logo.titleColor}
                        onChange={(e) =>
                          updateSub('logo', (prev) => ({ ...prev, titleColor: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.logo.titleColor}
                        onChange={(e) =>
                          updateSub('logo', (prev) => ({ ...prev, titleColor: e.target.value }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون الشعار الفرعي' : 'Subtitle Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.logo.subtitleColor}
                        onChange={(e) =>
                          updateSub('logo', (prev) => ({ ...prev, subtitleColor: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.logo.subtitleColor}
                        onChange={(e) =>
                          updateSub('logo', (prev) => ({ ...prev, subtitleColor: e.target.value }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Family & Size */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'نوع الخط (Font Family)' : 'Font Family'}
                    </label>
                    <select
                      value={settings.logo.fontFamily}
                      onChange={(e) =>
                        updateSub('logo', (prev) => ({ ...prev, fontFamily: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'حجم خط العنوان الرئيسي' : 'Title Font Size'}:{' '}
                      <span className="text-indigo-600 font-mono">{settings.logo.fontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="38"
                      value={settings.logo.fontSize}
                      onChange={(e) =>
                        updateSub('logo', (prev) => ({ ...prev, fontSize: Number(e.target.value) }))
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION COLORS & FONTS */}
            {activeSubElement === 'navigation' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'خلفية شريط القائمة' : 'Nav Background'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.navigation.bgColor}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({ ...prev, bgColor: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.navigation.bgColor}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({ ...prev, bgColor: e.target.value }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون روابط القائمة' : 'Link Text Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.navigation.textColor}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.navigation.textColor}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({ ...prev, textColor: e.target.value }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون التحويم (Hover Text)' : 'Hover Text Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.navigation.hoverColor}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({ ...prev, hoverColor: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.navigation.hoverColor}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({ ...prev, hoverColor: e.target.value }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون زر بوابة VIP' : 'VIP Button Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.navigation.vipPortalColor}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({ ...prev, vipPortalColor: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.navigation.vipPortalColor}
                        onChange={(e) =>
                          updateSub('navigation', (prev) => ({ ...prev, vipPortalColor: e.target.value }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Size & Weight */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'حجم خط الروابط' : 'Nav Font Size'}:{' '}
                    <span className="text-indigo-600 font-mono">{settings.navigation.fontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="18"
                    step="0.5"
                    value={settings.navigation.fontSize}
                    onChange={(e) =>
                      updateSub('navigation', (prev) => ({
                        ...prev,
                        fontSize: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ACTIONS COLORS */}
            {activeSubElement === 'actions' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'شارة السلة (Badge Bg)' : 'Cart Badge Bg'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.actions.cart.badgeBg}
                        onChange={(e) =>
                          updateSub('actions', (prev) => ({
                            ...prev,
                            cart: { ...prev.cart, badgeBg: e.target.value },
                          }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.actions.cart.badgeBg}
                        onChange={(e) =>
                          updateSub('actions', (prev) => ({
                            ...prev,
                            cart: { ...prev.cart, badgeBg: e.target.value },
                          }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون نص السعر' : 'Price Color'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.actions.cart.priceColor}
                        onChange={(e) =>
                          updateSub('actions', (prev) => ({
                            ...prev,
                            cart: { ...prev.cart, priceColor: e.target.value },
                          }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.actions.cart.priceColor}
                        onChange={(e) =>
                          updateSub('actions', (prev) => ({
                            ...prev,
                            cart: { ...prev.cart, priceColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LANGUAGE COLORS */}
            {activeSubElement === 'language' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'خلفية الكبسولة' : 'Pill Background'}
                    </label>
                    <input
                      type="color"
                      value={settings.language.bgColor}
                      onChange={(e) =>
                        updateSub('language', (prev) => ({ ...prev, bgColor: e.target.value }))
                      }
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'لون اللغة النشطة' : 'Active Language Color'}
                    </label>
                    <input
                      type="color"
                      value={settings.language.activeColor}
                      onChange={(e) =>
                        updateSub('language', (prev) => ({ ...prev, activeColor: e.target.value }))
                      }
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* GENERAL COLORS */}
            {activeSubElement === 'general' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'اللون الأساسي للهيدر' : 'Main Header Color'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.general.bgColor}
                      onChange={(e) =>
                        updateSub('general', (prev) => ({ ...prev, bgColor: e.target.value }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={settings.general.bgColor}
                      onChange={(e) =>
                        updateSub('general', (prev) => ({ ...prev, bgColor: e.target.value }))
                      }
                      className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Color Presets Row */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
                {isAr ? 'لوحة ألوان سريعة (Quick Luxury Palette):' : 'Quick Palette:'}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (activeSubElement === 'announcement') {
                        updateSub('announcement', (prev) => ({ ...prev, bgColor: c }));
                      } else if (activeSubElement === 'logo') {
                        updateSub('logo', (prev) => ({ ...prev, titleColor: c }));
                      } else if (activeSubElement === 'navigation') {
                        updateSub('navigation', (prev) => ({ ...prev, bgColor: c }));
                      } else if (activeSubElement === 'general') {
                        updateSub('general', (prev) => ({ ...prev, bgColor: c }));
                      }
                    }}
                    className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 4: LAYOUT FOR ACTIVE SUB-ELEMENT */}
      {activeTab === 'layout' && (
        <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>{isAr ? 'المحاذاة والمسافات (Layout & Spacing)' : 'Alignment & Spacing'}</span>
          </span>

          {activeSubElement === 'navigation' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  {isAr ? 'محاذاة عناصر القائمة' : 'Alignment'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'center' as const, labelAr: 'توسيط (Center)', labelEn: 'Center' },
                    { id: 'start' as const, labelAr: 'بداية (Start)', labelEn: 'Start' },
                    { id: 'space-between' as const, labelAr: 'متباعد (Spread)', labelEn: 'Spread' },
                  ].map((al) => (
                    <button
                      key={al.id}
                      type="button"
                      onClick={() =>
                        updateSub('navigation', (prev) => ({ ...prev, alignment: al.id }))
                      }
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        settings.navigation.alignment === al.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isAr ? al.labelAr : al.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubElement === 'general' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  {isAr ? 'حشوة الهيدر الرأسية (Vertical Padding)' : 'Vertical Padding'}:{' '}
                  <span className="text-indigo-600 font-mono">{settings.general.paddingY}px</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="32"
                  value={settings.general.paddingY}
                  onChange={(e) =>
                    updateSub('general', (prev) => ({ ...prev, paddingY: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
