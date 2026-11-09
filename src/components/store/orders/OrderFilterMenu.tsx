import React, { useState, useRef, useMemo } from 'react';
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
import { WhatsAppBrandIcon } from '../../common/BrandIcons';
import { FloatingPopover } from '../../common/FloatingPopover';
import {
  localizeOrderStatus,
  localizePaymentMethod,
  localizeSalesChannel,
} from '../../../utils/domainLabels';

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
          <span className="px-1.5 py-0.5 rounded-xs bg-black text-white text-[9px] font-black shrink-0 tracking-tight">
            Pay
          </span>
        ),
      },
      {
        id: 'stc',
        labelEn: 'stc pay',
        labelAr: 'STC باي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#4F008C] text-white text-[9px] font-black shrink-0 tracking-tight">
            stc
          </span>
        ),
      },
    ],
  },
  {
    groupNum: 2,
    titleEn: '2. Buy Now Pay Later',
    titleAr: '٢. اشتر الآن وادفع لاحقاً',
    items: [
      {
        id: 'tamara',
        labelEn: 'Tamara',
        labelAr: 'تمارا',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#1A1A2E] text-[#D4AF37] text-[9px] font-black shrink-0">
            Tamara
          </span>
        ),
      },
      {
        id: 'tabby',
        labelEn: 'Tabby',
        labelAr: 'تابي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#3BFFC2] text-black text-[9px] font-black shrink-0">
            tabby
          </span>
        ),
      },
    ],
  },
  {
    groupNum: 3,
    titleEn: '3. Cash and Transfers',
    titleAr: '٣. النقد والتحويلات',
    items: [
      {
        id: 'cash',
        labelEn: 'Cash on Delivery',
        labelAr: 'الدفع عند الاستلام',
        badge: () => <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      },
      {
        id: 'bank',
        labelEn: 'Bank Transfer',
        labelAr: 'تحويل بنكي',
        badge: () => <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
      },
    ],
  },
];

export const ALL_PAYMENT_ITEMS: PaymentItem[] = PAYMENT_CATEGORIES.flatMap((c) => c.items);

export interface ChannelItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: React.ReactNode;
}

export const SALES_CHANNEL_ITEMS: ChannelItem[] = [
  {
    id: 'Direct',
    labelEn: 'Online Store',
    labelAr: 'المتجر الإلكتروني',
    icon: <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
  },
  {
    id: 'Instagram',
    labelEn: 'Instagram',
    labelAr: 'إنستغرام',
    icon: <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />,
  },
  {
    id: 'WhatsApp',
    labelEn: 'WhatsApp',
    labelAr: 'واتساب',
    icon: <WhatsAppBrandIcon className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    id: 'TikTok',
    labelEn: 'TikTok',
    labelAr: 'تيك توك',
    icon: <Music2 className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200 shrink-0" />,
  },
  {
    id: 'Snapchat',
    labelEn: 'Snapchat',
    labelAr: 'سناب شات',
    icon: <Ghost className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
  },
  {
    id: 'Facebook',
    labelEn: 'Facebook',
    labelAr: 'فيسبوك',
    icon: <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
  },
  {
    id: 'Google',
    labelEn: 'Google Ads',
    labelAr: 'إعلانات جوجل',
    icon: <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
  },
  {
    id: 'Email',
    labelEn: 'Email',
    labelAr: 'البريد الإلكتروني',
    icon: <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
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
  /**
   * `inline` = expand below trigger in document flow (no table overlap).
   * `popover` = body portal (compact menus; never clipped by page overflow).
   */
  variant?: 'inline' | 'popover';
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
  variant = 'popover',
}) => {
  const { locale, t } = usePrefs();
  const isAr = locale === 'ar';

  const statusLabel = (item: StatusItem) =>
    item.id === 'all' ? t('allStatuses') : localizeOrderStatus(item.id, locale) || (isAr ? item.labelAr : item.labelEn);

  const paymentLabel = (item: PaymentItem) => {
    const localized = localizePaymentMethod(item.labelEn || item.id, locale);
    if (isAr && (localized === item.labelEn || localized === item.id)) return item.labelAr;
    return localized || (isAr ? item.labelAr : item.labelEn);
  };

  const channelLabel = (item: ChannelItem) => {
    const probe = item.labelEn || item.id;
    const localized = localizeSalesChannel(probe, locale);
    const generic = isAr ? 'المتجر الإلكتروني' : 'Online Store';
    if (!localized || localized === generic) {
      if (/direct|store|online|storefront|متجر/i.test(probe)) {
        return localized || (isAr ? item.labelAr : item.labelEn);
      }
      return isAr ? item.labelAr : item.labelEn;
    }
    return localized;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<'status' | 'payment' | 'channel' | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  const panelBody = (
    <div className="text-xs space-y-3.5">
      <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
          {t('filterOrders')}
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
            <span>{t('resetLabel')}</span>
          </button>
        )}
      </div>

      {/* Status — accordion (no nested absolute overlay) */}
      <div>
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
          {t('statusCol')}
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
              {selectedStatusItem ? statusLabel(selectedStatusItem) : t('allStatuses')}
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
            className="mt-1.5 w-full rounded-xl border p-1 max-h-56 overflow-y-auto"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
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
                    <span className="truncate">{statusLabel(item)}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment */}
      <div>
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
          {t('paymentMethod')}
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
                ? t('allPaymentMethods')
                : selectedPaymentItem
                  ? paymentLabel(selectedPaymentItem)
                  : t('allPaymentMethods')}
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
            className="mt-1.5 w-full rounded-xl border p-1 max-h-64 overflow-y-auto"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
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
                <CreditCard
                  className={`w-3.5 h-3.5 shrink-0 ${paymentFilter === 'all' ? 'text-white' : 'text-slate-400'}`}
                />
                <span>{t('allPaymentMethods')}</span>
              </div>
              {paymentFilter === 'all' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
            </button>
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
                          <span className="truncate">{paymentLabel(method)}</span>
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

      {/* Channel */}
      <div>
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
          {t('salesChannel')}
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
                ? t('allChannels')
                : selectedChannelItem
                  ? channelLabel(selectedChannelItem)
                  : t('allChannels')}
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
            className="mt-1.5 w-full rounded-xl border p-1 max-h-60 overflow-y-auto"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
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
                <Layers
                  className={`w-3.5 h-3.5 shrink-0 ${channelFilter === 'all' ? 'text-white' : 'text-slate-400'}`}
                />
                <span>{t('allChannels')}</span>
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
                    <span className="truncate">{channelLabel(item)}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const triggerBtn = (
    <button
      type="button"
      ref={btnRef}
      onClick={() => {
        setIsOpen((v) => !v);
        if (isOpen) setActiveSubMenu(null);
      }}
      className={`px-3 py-2.5 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
        isOpen || hasActiveFilters
          ? 'border-teal-500 text-teal-700 bg-teal-50/70 dark:bg-teal-950/40 dark:text-teal-300'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
      aria-expanded={isOpen}
    >
      <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
      <span>{t('filters')}</span>
      {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />}
    </button>
  );

  if (variant === 'popover') {
    return (
      <div className={className}>
        {triggerBtn}
        <FloatingPopover
          open={isOpen}
          anchorRef={btnRef}
          onClose={() => {
            setIsOpen(false);
            setActiveSubMenu(null);
          }}
          width={320}
          align="end"
          estimatedHeight={320}
          className="p-3.5 sm:p-4 rounded-xl border shadow-lg"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {panelBody}
        </FloatingPopover>
      </div>
    );
  }

  // Default: inline expand — pushes content below, never overlays table
  return (
    <div className={`flex flex-col gap-2 min-w-0 ${className}`}>
      <div className="flex items-center">{triggerBtn}</div>
      {isOpen && (
        <div
          className="w-full p-3.5 sm:p-4 rounded-2xl border shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {panelBody}
        </div>
      )}
    </div>
  );
};
