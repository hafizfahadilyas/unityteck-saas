import React from 'react';
import {
  X,
  Home,
  ShoppingBag,
  Truck,
  BookOpen,
  Info,
  Phone,
  MapPin,
  ShieldCheck,
  RotateCcw,
  Flower2,
  Search,
  ExternalLink,
  ChevronRight,
  MessageCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { FlowersSfPage } from './pack';
import type { CustomMenuItem } from '../settings/themeSettingsStore';
import { PrefsSwitcher } from '../../components/common/PrefsSwitcher';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: FlowersSfPage;
  onSelectPage: (page: FlowersSfPage, customItem?: CustomMenuItem) => void;
  storeName: string;
  storeLogo?: string;
  tagline: string;
  phone: string;
  lang: string;
  customMenuItems?: CustomMenuItem[];
  categories?: Array<{ id: string; name: string; filter: string; count?: number }>;
  onSelectCategory?: (category: string) => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  activePage,
  onSelectPage,
  storeName,
  storeLogo,
  tagline,
  phone,
  lang,
  customMenuItems = [],
  categories = [],
  onSelectCategory,
}) => {
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  const defaultLinks: Array<{ id: FlowersSfPage; labelAr: string; labelEn: string; icon: React.ComponentType<{ className?: string }>; badge?: string }> = [
    { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: Home },
    { id: 'shop', labelAr: 'المتجر والمنتجات', labelEn: 'Catalog & Shop', icon: ShoppingBag },
    { id: 'track-order', labelAr: 'تتبع الطلب المباشر', labelEn: 'Track Order', icon: Truck, badge: isAr ? 'جديد' : 'Live' },
    { id: 'blog', labelAr: 'مدونة ونصائح الأزهار', labelEn: 'Blog & Articles', icon: BookOpen },
    { id: 'about', labelAr: 'من نحن', labelEn: 'About Us', icon: Info },
    { id: 'contact', labelAr: 'تواصل معنا', labelEn: 'Contact Us', icon: Phone },
    { id: 'location', labelAr: 'موقعنا في مكة المكرمة', labelEn: 'Store Location', icon: MapPin },
    { id: 'privacy', labelAr: 'سياسة الخصوصية', labelEn: 'Privacy Policy', icon: ShieldCheck },
    { id: 'return', labelAr: 'سياسة الاستبدال والإرجاع', labelEn: 'Return Policy', icon: RotateCcw },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`absolute inset-y-0 ${
          isAr ? 'right-0' : 'left-0'
        } max-w-xs w-full shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out`}
        style={{
          background: 'var(--sf-surface, #ffffff)',
          color: 'var(--sf-text, #0f172a)',
        }}
      >
        {/* Drawer Header */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}
        >
          <div className="flex items-center gap-3">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Flower2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-sm line-clamp-1">{storeName}</h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                {isAr ? 'مكة المكرمة · متجر معتمد' : 'Makkah KSA · Certified Florist'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Notice */}
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isAr ? 'توصيل خلال ساعتين لكافة أحياء وفنادق مكة' : '2-Hour Delivery to Makkah Hotels & Districts'}</span>
          </div>

          {/* Quick Category Chips */}
          {categories.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
                {isAr ? 'تسوق حسب القسم (Categories)' : 'Shop by Category'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(c.filter);
                      onSelectPage('shop');
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{c.name}</span>
                    {typeof c.count === 'number' && (
                      <span className="text-[9px] opacity-70">({c.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Standard Navigation Links */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              {isAr ? 'روابط التصفح' : 'Navigation Menu'}
            </span>
            {defaultLinks.map((item) => {
              const IconComp = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectPage(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </div>

                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Pages / Merchant Menu Links */}
          {customMenuItems.length > 0 && (
            <div className="space-y-1 pt-3 border-t" style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                {isAr ? 'صفحات وقوائم مخصصة' : 'Custom Pages & Links'}
              </span>
              {customMenuItems.filter(m => m.active).map((custom) => (
                <button
                  key={custom.id}
                  type="button"
                  onClick={() => {
                    onSelectPage('custom-page', custom);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>{isAr ? custom.labelAr : custom.labelEn}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </button>
              ))}
            </div>
          )}

          {/* WhatsApp & Call Direct Links */}
          <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              {isAr ? 'خدمة العملاء والطلب الفوري' : 'Direct Customer Support'}
            </span>
            <a
              href={`https://wa.me/${phone.replace(/[^0-9]/g, '') || '966504428819'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#25D366]/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>{isAr ? 'محادثة واتساب مباشرة' : 'WhatsApp Live Chat'}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <a
              href={`tel:${phone.replace(/\s/g, '') || '+966504428819'}`}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{phone || '+966 50 442 8819'}</span>
              </div>
              <span className="text-[10px] opacity-70">{isAr ? 'اتصال' : 'Call'}</span>
            </a>
          </div>
        </div>

        {/* Drawer Footer: Language & Currency */}
        <div
          className="p-4 border-t space-y-3"
          style={{
            background: 'var(--sf-bg, #f8fafc)',
            borderColor: 'var(--sf-border, #e2e8f0)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">{isAr ? 'اللغة والعملة:' : 'Language & Currency:'}</span>
            <PrefsSwitcher showCurrency compact />
          </div>
          <p className="text-[10px] text-center opacity-60">
            © 2026 {storeName} · Makkah Floral Boutique
          </p>
        </div>
      </div>
    </div>
  );
};
