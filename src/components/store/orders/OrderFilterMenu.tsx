import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Filter,
  RotateCcw,
  ChevronDown,
  Check,
  CreditCard,
  Building2,
  Banknote,
  Instagram,
  Globe,
  Share2,
  Ghost,
  MessageCircle,
  Facebook,
  Mail,
  Music2,
  Clock,
  RefreshCw,
  Truck,
  CheckCircle,
  XCircle,
  Layers,
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

export interface StatusItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: (cls?: string) => React.ReactNode;
}

export const STATUS_ITEMS: StatusItem[] = [
  {
    id: 'all',
    labelEn: 'All Statuses',
    labelAr: 'كافة الحالات',
    icon: (cls = 'w-3.5 h-3.5 text-slate-500') => <Clock className={cls} />,
  },
  {
    id: 'completed',
    labelEn: 'Completed',
    labelAr: 'مكتمل',
    icon: (cls = 'w-3.5 h-3.5 text-emerald-600') => <CheckCircle className={cls} />,
  },
  {
    id: 'pending',
    labelEn: 'Pending',
    labelAr: 'قيد الانتظار',
    icon: (cls = 'w-3.5 h-3.5 text-amber-600') => <Clock className={cls} />,
  },
  {
    id: 'processing',
    labelEn: 'Processing',
    labelAr: 'جاري التجهيز',
    icon: (cls = 'w-3.5 h-3.5 text-sky-600') => <RefreshCw className={cls} />,
  },
  {
    id: 'shipped',
    labelEn: 'Shipped',
    labelAr: 'تم الشحن',
    icon: (cls = 'w-3.5 h-3.5 text-blue-600') => <Truck className={cls} />,
  },
  {
    id: 'cancelled',
    labelEn: 'Cancelled',
    labelAr: 'ملغي',
    icon: (cls = 'w-3.5 h-3.5 text-rose-600') => <XCircle className={cls} />,
  },
];

export interface PaymentItem {
  id: string;
  labelEn: string;
  labelAr: string;
  badge: (isAr?: boolean) => React.ReactNode;
}

export interface PaymentCategory {
  groupNum: number;
  titleEn: string;
  titleAr: string;
  items: PaymentItem[];
}

export const PAYMENT_CATEGORIES: PaymentCategory[] = [
  {
    groupNum: 1,
    titleEn: '1. Bank Cards and Electronic Payments',
    titleAr: '١. البطاقات البنكية والمدفوعات الإلكترونية',
    items: [
      {
        id: 'mada',
        labelEn: 'mada',
        labelAr: 'مدى',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#008542] text-white text-[9px] font-black shrink-0 tracking-tight">
            mada
          </span>
        ),
      },
      {
        id: 'visa',
        labelEn: 'Visa',
        labelAr: 'فيزا',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#1A1F71] text-white text-[9px] font-black shrink-0 tracking-tight">
            VISA
          </span>
        ),
      },
      {
        id: 'mastercard',
        labelEn: 'Mastercard',
        labelAr: 'ماستركارد',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#EB001B] text-white text-[9px] font-black shrink-0 tracking-tight">
            MC
          </span>
        ),
      },
      {
        id: 'apple',
        labelEn: 'Apple Pay',
        labelAr: 'أبل باي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-black dark:bg-slate-800 text-white text-[9px] font-bold shrink-0 tracking-tight">
             Pay
          </span>
        ),
      },
    ],
  },
  {
    groupNum: 2,
    titleEn: '2. Digital Wallets',
    titleAr: '٢. المحافظ الرقمية',
    items: [
      {
        id: 'stc',
        labelEn: 'stc pay',
        labelAr: 'اس تي سي باي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#4F008C] text-white text-[9px] font-black shrink-0 tracking-tight">
            stc pay
          </span>
        ),
      },
      {
        id: 'paypal',
        labelEn: 'PayPal',
        labelAr: 'باي بال',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#003087] text-white text-[9px] font-black shrink-0 tracking-tight">
            PayPal
          </span>
        ),
      },
      {
        id: 'googlepay',
        labelEn: 'Google Pay',
        labelAr: 'جوجل باي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#5F6368] text-white text-[9px] font-bold shrink-0 tracking-tight">
            GPay
          </span>
        ),
      },
    ],
  },
  {
    groupNum: 3,
    titleEn: '3. Buy Now, Pay Later (BNPL) and Installment Payments',
    titleAr: '٣. الدفع الآجل والأقساط الشهرية (BNPL)',
    items: [
      {
        id: 'tabby',
        labelEn: 'Tabby',
        labelAr: 'تابي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#3EEDBF] text-slate-950 text-[9px] font-black shrink-0 tracking-tight">
            tabby
          </span>
        ),
      },
      {
        id: 'tamara',
        labelEn: 'Tamara',
        labelAr: 'تمارا',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#FFA500] text-slate-950 text-[9px] font-black shrink-0 tracking-tight">
            tamara
          </span>
        ),
      },
      {
        id: 'mispay',
        labelEn: 'Mispay',
        labelAr: 'مسباي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#6366F1] text-white text-[9px] font-black shrink-0 tracking-tight">
            Mispay
          </span>
        ),
      },
      {
        id: 'madfooat',
        labelEn: 'Madfooat',
        labelAr: 'مدفوعات',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#06B6D4] text-white text-[9px] font-black shrink-0 tracking-tight">
            Madfooat
          </span>
        ),
      },
      {
        id: 'emkan',
        labelEn: 'Emkan',
        labelAr: 'إمكان',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#8B5CF6] text-white text-[9px] font-black shrink-0 tracking-tight">
            Emkan
          </span>
        ),
      },
    ],
  },
  {
    groupNum: 4,
    titleEn: '4. Other Payment Methods',
    titleAr: '٤. طرق دفع أخرى',
    items: [
      {
        id: 'bank',
        labelEn: 'Bank Transfer',
        labelAr: 'تحويل بنكي',
        badge: () => <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
      },
      {
        id: 'cash',
        labelEn: 'Cash on Delivery (COD)',
        labelAr: 'الدفع عند الاستلام',
        badge: () => <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      },
    ],
  },
];

export const ALL_PAYMENT_ITEMS = PAYMENT_CATEGORIES.flatMap((c) => c.items);

export interface ChannelItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: React.ReactNode;
}

export const SALES_CHANNEL_ITEMS: ChannelItem[] = [
  {
    id: 'instagram',
    labelEn: 'Instagram',
    labelAr: 'انستغرام',
    icon: (
      <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Instagram className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'google',
    labelEn: 'Google Ads',
    labelAr: 'إعلانات جوجل',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#1A73E8] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Share2 className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'direct',
    labelEn: 'Direct Visits',
    labelAr: 'زيارات مباشرة',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Globe className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'tiktok',
    labelEn: 'TikTok',
    labelAr: 'تيك توك',
    icon: (
      <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-black flex items-center justify-center text-white shrink-0 shadow-2xs border border-slate-700">
        <Music2 className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'snapchat',
    labelEn: 'Snapchat',
    labelAr: 'سناب شات',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#FFFC00] flex items-center justify-center text-slate-950 shrink-0 shadow-2xs border border-amber-300">
        <Ghost className="w-3 h-3 text-slate-950 fill-current" />
      </span>
    ),
  },
  {
    id: 'whatsapp',
    labelEn: 'WhatsApp',
    labelAr: 'واتساب',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <MessageCircle className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'facebook',
    labelEn: 'Facebook',
    labelAr: 'فيسبوك',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Facebook className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'x',
    labelEn: 'X (formerly Twitter)',
    labelAr: 'إكس (تويتر سابقاً)',
    icon: (
      <span className="w-5 h-5 rounded-full bg-slate-950 dark:bg-slate-800 flex items-center justify-center text-white shrink-0 shadow-2xs font-black text-[10px]">
        𝕏
      </span>
    ),
  },
  {
    id: 'youtube',
    labelEn: 'YouTube',
    labelAr: 'يوتيوب',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#FF0000] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
          <path d="M10 15l5-3-5-3v6z" />
          <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19 26.27 26.27 0 0 0 2 12a26.27 26.27 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77c.28-1.56.42-3.18.42-4.81s-.14-3.25-.42-4.81z" />
        </svg>
      </span>
    ),
  },
  {
    id: 'email',
    labelEn: 'Email Marketing',
    labelAr: 'البريد الإلكتروني',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#EA4335] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Mail className="w-3 h-3 text-white" />
      </span>
    ),
  },
];

export interface OrderFilterMenuProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  paymentFilter: string;
  onPaymentChange: (payment: string) => void;
  channelFilter: string;
  onChannelChange: (channel: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export const OrderFilterMenu: React.FC<OrderFilterMenuProps> = ({
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentChange,
  channelFilter,
  onChannelChange,
  onReset,
  hasActiveFilters,
  className = '',
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<'status' | 'payment' | 'channel' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selectedStatusItem = useMemo(
    () => STATUS_ITEMS.find((s) => s.id === statusFilter) || STATUS_ITEMS[0],
    [statusFilter]
  );
  const selectedPaymentItem = useMemo(
    () => ALL_PAYMENT_ITEMS.find((p) => p.id === paymentFilter) || null,
    [paymentFilter]
  );
  const selectedChannelItem = useMemo(
    () => SALES_CHANNEL_ITEMS.find((c) => c.id === channelFilter) || null,
    [channelFilter]
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`px-3 py-2.5 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
          hasActiveFilters
            ? 'border-teal-500 text-teal-700 bg-teal-50/70 dark:bg-teal-950/40 dark:text-teal-300'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>{isAr ? 'تصفية' : 'Filter'}</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
        )}
      </button>

      {/* Popover Dropdown (100% Match with PDF Page 2 & 3 specification) */}
      {isOpen && (
        <div
          className="absolute end-0 mt-2 w-72 sm:w-80 p-3.5 sm:p-4 rounded-2xl border shadow-2xl z-50 text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
              {isAr ? 'تصفية الطلبات' : 'Filter Orders'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setActiveSubMenu(null);
                }}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            )}
          </div>

          {/* 1. Status Dropdown */}
          <div className="relative">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              {isAr ? 'الحالة' : 'Status'}
            </label>
            <button
              type="button"
              onClick={() => setActiveSubMenu((prev) => (prev === 'status' ? null : 'status'))}
              className="w-full px-3 py-2 text-xs rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-2xs hover:border-teal-500/60"
              style={{
                background: 'var(--input-bg)',
                borderColor: activeSubMenu === 'status' ? '#007b83' : 'var(--border)',
                color: 'var(--input-fg)',
              }}
            >
              <div className="flex items-center gap-2 truncate">
                {selectedStatusItem?.icon()}
                <span className="truncate font-semibold">
                  {isAr ? selectedStatusItem?.labelAr : selectedStatusItem?.labelEn}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  activeSubMenu === 'status' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSubMenu === 'status' && (
              <div
                className="absolute start-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1 z-50 max-h-56 overflow-y-auto animate-in fade-in duration-100"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {STATUS_ITEMS.map((item) => {
                  const isSelected = statusFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onStatusChange(item.id);
                        setActiveSubMenu(null);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {item.icon(isSelected ? 'w-3.5 h-3.5 text-white' : undefined)}
                        <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Payment Method Dropdown */}
          <div className="relative">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              {isAr ? 'طريقة الدفع' : 'Payment Method'}
            </label>
            <button
              type="button"
              onClick={() => setActiveSubMenu((prev) => (prev === 'payment' ? null : 'payment'))}
              className="w-full px-3 py-2 text-xs rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-2xs hover:border-teal-500/60"
              style={{
                background: 'var(--input-bg)',
                borderColor: activeSubMenu === 'payment' ? '#007b83' : 'var(--border)',
                color: 'var(--input-fg)',
              }}
            >
              <div className="flex items-center gap-2 truncate">
                {paymentFilter === 'all' ? (
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  selectedPaymentItem?.badge(isAr)
                )}
                <span className="truncate font-semibold">
                  {paymentFilter === 'all'
                    ? (isAr ? 'كافة طرق الدفع' : 'All Payment Methods')
                    : (isAr ? selectedPaymentItem?.labelAr : selectedPaymentItem?.labelEn)}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  activeSubMenu === 'payment' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSubMenu === 'payment' && (
              <div
                className="absolute start-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1 z-50 max-h-64 overflow-y-auto animate-in fade-in duration-100"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* All option */}
                <button
                  type="button"
                  onClick={() => {
                    onPaymentChange('all');
                    setActiveSubMenu(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer mb-1 ${
                    paymentFilter === 'all'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className={`w-3.5 h-3.5 shrink-0 ${paymentFilter === 'all' ? 'text-white' : 'text-slate-400'}`} />
                    <span>{isAr ? 'كافة طرق الدفع' : 'All Payment Methods'}</span>
                  </div>
                  {paymentFilter === 'all' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>

                {/* Categories */}
                {PAYMENT_CATEGORIES.map((category) => (
                  <div key={category.groupNum} className="mt-2 border-t pt-1.5" style={{ borderColor: 'var(--border)' }}>
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {isAr ? category.titleAr : category.titleEn}
                    </div>
                    <div className="space-y-0.5">
                      {category.items.map((method) => {
                        const isSelected = paymentFilter === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                              onPaymentChange(method.id);
                              setActiveSubMenu(null);
                            }}
                            className={`w-full px-3 py-1.5 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="shrink-0">{method.badge(isAr)}</span>
                              <span className="truncate">{isAr ? method.labelAr : method.labelEn}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Sales Channel Dropdown (100% Match to PDF Page 2 & 3) */}
          <div className="relative">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              {isAr ? 'قناة البيع' : 'Sales Channel'}
            </label>
            <button
              type="button"
              onClick={() => setActiveSubMenu((prev) => (prev === 'channel' ? null : 'channel'))}
              className="w-full px-3 py-2 text-xs rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-2xs hover:border-teal-500/60"
              style={{
                background: 'var(--input-bg)',
                borderColor: activeSubMenu === 'channel' ? '#007b83' : 'var(--border)',
                color: 'var(--input-fg)',
              }}
            >
              <div className="flex items-center gap-2 truncate">
                {channelFilter === 'all' ? (
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  selectedChannelItem?.icon
                )}
                <span className="truncate font-semibold">
                  {channelFilter === 'all'
                    ? (isAr ? 'كافة القنوات' : 'All Channels')
                    : (isAr ? selectedChannelItem?.labelAr : selectedChannelItem?.labelEn)}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  activeSubMenu === 'channel' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSubMenu === 'channel' && (
              <div
                className="absolute start-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1 z-50 max-h-60 overflow-y-auto animate-in fade-in duration-100"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* All Channels option */}
                <button
                  type="button"
                  onClick={() => {
                    onChannelChange('all');
                    setActiveSubMenu(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer mb-1 ${
                    channelFilter === 'all'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className={`w-3.5 h-3.5 shrink-0 ${channelFilter === 'all' ? 'text-white' : 'text-slate-400'}`} />
                    <span>{isAr ? 'كافة القنوات' : 'All Channels'}</span>
                  </div>
                  {channelFilter === 'all' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>

                {SALES_CHANNEL_ITEMS.map((item) => {
                  const isSelected = channelFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChannelChange(item.id);
                        setActiveSubMenu(null);
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {item.icon}
                        <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
