import React, { useState, useEffect } from 'react';
import {
  Coins,
  Award,
  Sparkles,
  CreditCard,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  getStoreLoyaltyGameSettings,
  getOrCreateCustomerGamifiedProfile,
  saveCustomerGamifiedProfile,
  type CustomerGamifiedProfile,
} from '../../services/ksaAutomationEngine';

export interface CustomerLoyaltyProfileSectionProps {
  storeId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  className?: string;
}

export const CustomerLoyaltyProfileSection: React.FC<CustomerLoyaltyProfileSectionProps> = ({
  storeId: propStoreId,
  customerId: propCustomerId,
  customerName,
  customerEmail,
  customerPhone,
  className = '',
}) => {
  const { activeStore, allStoreCustomers } = useTenant();
  const { locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const effectiveStoreId = propStoreId || activeStore?.id || 'store-1';
  const storeCusts = (allStoreCustomers && allStoreCustomers[effectiveStoreId]) || [];
  const primaryCust = storeCusts[0] || {
    id: propCustomerId || `cust-${effectiveStoreId}-1`,
    name: customerName || (isAr ? 'عميل المتجر المميز' : 'Valued Customer'),
    phone: customerPhone || '+966 50 123 4567',
    email: customerEmail || 'customer@ksa-store.sa',
    city: 'Riyadh',
  };

  const effectiveCustomerId = propCustomerId || primaryCust.id || `cust-${effectiveStoreId}-1`;

  const [profile, setProfile] = useState<CustomerGamifiedProfile>(() =>
    getOrCreateCustomerGamifiedProfile(effectiveStoreId, effectiveCustomerId, {
      name: customerName || primaryCust.name,
      phone: customerPhone || primaryCust.phone,
      email: customerEmail || primaryCust.email,
      city: (primaryCust as any).city || 'Riyadh',
    }),
  );

  const [loyaltySettings, setLoyaltySettings] = useState(() =>
    getStoreLoyaltyGameSettings(effectiveStoreId),
  );
  const [activeTab, setActiveTab] = useState<'spin' | 'cards' | 'tiers'>('spin');
  const [isSpinning, setIsSpinning] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

  useEffect(() => {
    setProfile(
      getOrCreateCustomerGamifiedProfile(effectiveStoreId, effectiveCustomerId, {
        name: customerName || primaryCust.name,
        phone: customerPhone || primaryCust.phone,
        email: customerEmail || primaryCust.email,
        city: (primaryCust as any).city || 'Riyadh',
      }),
    );
    setLoyaltySettings(getStoreLoyaltyGameSettings(effectiveStoreId));
  }, [effectiveStoreId, effectiveCustomerId, customerName, customerEmail, customerPhone]);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (!e.detail || e.detail.storeId === effectiveStoreId) {
        setLoyaltySettings(getStoreLoyaltyGameSettings(effectiveStoreId));
        setProfile(
          getOrCreateCustomerGamifiedProfile(effectiveStoreId, effectiveCustomerId, {
            name: customerName || primaryCust.name,
            phone: customerPhone || primaryCust.phone,
            email: customerEmail || primaryCust.email,
            city: (primaryCust as any).city || 'Riyadh',
          }),
        );
      }
    };
    window.addEventListener('unityteck-ksa-engine-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('unityteck-ksa-engine-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [effectiveStoreId, effectiveCustomerId, customerName, customerEmail, customerPhone]);

  const sarDiscountWorth = (
    profile.coinsBalance / (loyaltySettings.coinsPerSar || 10)
  ).toFixed(1);

  // Copy loyalty card number
  const handleCopyCardNumber = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(profile.loyaltyCardNumber);
      setCopiedCard(true);
      toast(
        isAr ? 'تم نسخ رقم بطاقة الولاء بنجاح!' : 'Loyalty Card number copied!',
        'success',
      );
      setTimeout(() => setCopiedCard(false), 2000);
    }
  };

  // Location & Notifications Bonus
  const handleAllowLocationAndPush = async () => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch {}

    const completeGrant = (lat?: number, lng?: number) => {
      const bonus = profile.locationAllowed ? 0 : loyaltySettings.signupLocationBonusCoins;
      const updated = saveCustomerGamifiedProfile(effectiveStoreId, {
        ...profile,
        locationAllowed: true,
        notificationsAllowed: true,
        coordinates: lat && lng ? { lat, lng } : { lat: 24.7136, lng: 46.6753 },
        coinsBalance: profile.coinsBalance + bonus,
        totalCoinsEarned: profile.totalCoinsEarned + bonus,
      });
      setProfile(updated);
      toast(
        isAr
          ? `تم تفعيل الموقع والإشعارات في ملفك الشخصي (+${bonus} عملة مكافأة)!`
          : `Location & Notifications enabled (+${bonus} Bonus Coins)!`,
        'success',
      );
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => completeGrant(pos.coords.latitude, pos.coords.longitude),
        () => completeGrant(),
        { timeout: 3500 },
      );
    } else {
      completeGrant();
    }
  };

  // Daily Spin & Win Game (24h cooldown)
  const handleSpinGame = () => {
    if (
      profile.lastGameSpinAt &&
      Date.now() - profile.lastGameSpinAt < loyaltySettings.spinCooldownHours * 3600 * 1000
    ) {
      const hrs = Math.ceil(
        (loyaltySettings.spinCooldownHours * 3600 * 1000 -
          (Date.now() - profile.lastGameSpinAt)) /
          3600000,
      );
      toast(
        isAr
          ? `لقد حصلت على عملات اليوم بالفعل! السحبة التالية متاحة بعد ~${hrs} ساعة.`
          : `You already claimed today! Next spin available in ~${hrs}h.`,
        'info',
      );
      return;
    }

    setIsSpinning(true);
    setTimeout(() => {
      const won =
        Math.floor(
          Math.random() * (loyaltySettings.maxSpinCoins - loyaltySettings.minSpinCoins + 1),
        ) + loyaltySettings.minSpinCoins;
      const updated = saveCustomerGamifiedProfile(effectiveStoreId, {
        ...profile,
        coinsBalance: profile.coinsBalance + won,
        totalCoinsEarned: profile.totalCoinsEarned + won,
        lastGameSpinAt: Date.now(),
      });
      setProfile(updated);
      setIsSpinning(false);
      toast(
        isAr
          ? `مبروك! ربحت +${won} عملة يمكنك استخدامها كخصم مباشر عند الدفع!`
          : `Congratulations! You won +${won} Coins to use as instant discount at checkout!`,
        'success',
      );
    }, 650);
  };

  return (
    <div
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-7 space-y-6 ${className}`}
    >
      {/* Title & Tier Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isAr ? 'بطاقة الولاء والمكافآت' : 'Loyalty Card & Rewards'}</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {profile.loyaltyTier}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? `اجمع العملات مع كل عملية شراء واستبدلها بخصم نقدي فوري في ${activeStore.name}`
                : `Earn coins with every order and redeem instant SAR discounts at ${activeStore.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-end">
            <div className="text-xs text-slate-500 font-medium">
              {isAr ? 'رصيد العملات المتاح' : 'Available Balance'}
            </div>
            <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {profile.coinsBalance} <span className="text-xs font-normal">{isAr ? 'عملة' : 'Coins'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-End Digital VIP Loyalty Card */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-white/20 select-none"
        style={{
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f766e 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="font-black text-xs uppercase tracking-wider text-amber-200">
                {activeStore.name} {isAr ? 'برنامج الولاء' : 'Loyalty Card'}
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold border border-white/20 uppercase tracking-widest text-amber-300">
              {profile.loyaltyTier} {isAr ? 'فئة' : 'Tier'}
            </span>
          </div>

          {/* Card Number with Copy */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="font-mono text-lg sm:text-2xl font-black tracking-widest text-white drop-shadow-sm">
              {profile.loyaltyCardNumber}
            </div>
            <button
              type="button"
              onClick={handleCopyCardNumber}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer border border-white/15"
              title={isAr ? 'نسخ رقم البطاقة' : 'Copy Card Number'}
            >
              {copiedCard ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Bottom row: Holder & Value */}
          <div className="flex items-end justify-between pt-2 border-t border-white/15 text-xs">
            <div>
              <div className="text-[10px] text-white/70 uppercase tracking-wider">
                {isAr ? 'حامل البطاقة' : 'Card Holder'}
              </div>
              <div className="font-bold text-sm text-white">{customerName || profile.name}</div>
            </div>

            <div className="text-end">
              <div className="text-[10px] text-white/70 uppercase tracking-wider">
                {isAr ? 'القيمة النقدية المقابلة' : 'Discount Cash Value'}
              </div>
              <div className="font-mono font-black text-sm text-amber-300">
                {sarDiscountWorth} {isAr ? 'ر.س خصم فوري' : 'SAR Instant Discount'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Push Notification Bonus Banner */}
      {!profile.locationAllowed && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs space-y-0.5">
            <div className="font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>
                {isAr
                  ? 'فعّل الموقع الجغرافي والإشعارات واربح عملات ترحيبية فورية!'
                  : 'Enable Location & Push Notifications for instant welcome coins!'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'استمتع بدقة الشحن السريع واستلم إشعارات العروض وتتبع الطلبيات أولاً بأول.'
                : 'Enjoy accurate delivery routing and instant real-time order tracking notifications.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAllowLocationAndPush}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shrink-0 transition-colors shadow-xs"
          >
            {isAr
              ? `تفعيل (+${loyaltySettings.signupLocationBonusCoins} عملة)`
              : `Enable (+${loyaltySettings.signupLocationBonusCoins} Coins)`}
          </button>
        </div>
      )}

      {/* Sub Tabs Selector */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('spin')}
          className={`py-2 px-3 rounded-xl cursor-pointer transition-all ${
            activeTab === 'spin'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isAr ? 'لعبة العملات اليومية' : 'Daily Coin Game'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cards')}
          className={`py-2 px-3 rounded-xl cursor-pointer transition-all ${
            activeTab === 'cards'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isAr ? 'البطاقات المحفوظة' : 'Saved Cards'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tiers')}
          className={`py-2 px-3 rounded-xl cursor-pointer transition-all ${
            activeTab === 'tiers'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isAr ? 'مزايا الفئات' : 'Tier Benefits'}
        </button>
      </div>

      {/* TAB 1: DAILY SPIN & WIN GAME */}
      {activeTab === 'spin' && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/25 space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Coins className={`w-7 h-7 text-white ${isSpinning ? 'animate-spin' : ''}`} />
          </div>

          <div className="space-y-1">
            <h4 className="font-black text-base text-slate-900 dark:text-white">
              {isAr ? 'عجلة الحظ والعملات اليومية' : 'Daily Spin & Win Wheel'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isAr
                ? `العب يومياً لربح ما بين ${loyaltySettings.minSpinCoins} إلى ${loyaltySettings.maxSpinCoins} عملة تُضاف فوراً لرصيدك للتسوق بها في متجر ${activeStore.name}!`
                : `Play every 24 hours to win between ${loyaltySettings.minSpinCoins} and ${loyaltySettings.maxSpinCoins} Coins to use as instant discount at checkout!`}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSpinGame}
              disabled={isSpinning}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-black text-white shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}
            >
              {isSpinning
                ? isAr
                  ? 'جاري السحب...'
                  : 'Spinning...'
                : isAr
                ? 'العب الآن واربح عملات التسوق (مؤقت 24 ساعة)'
                : 'Play Daily Spin & Win Coins (24h Timer)'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED CARDS & BONUS REWARDS */}
      {activeTab === 'cards' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500">
            {isAr
              ? 'البطاقات البنكية المعتمدة للدفع السريع ومكافآت العملات الإضافية:'
              : 'Saved payment cards for express checkout & bonus coin rewards:'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.savedCards.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-black text-slate-900 dark:text-white">
                      {c.brand} •••• {c.last4}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{c.holderName}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = saveCustomerGamifiedProfile(effectiveStoreId, {
                      ...profile,
                      coinsBalance: profile.coinsBalance + c.bonusCoinsPerUse,
                      totalCoinsEarned: profile.totalCoinsEarned + c.bonusCoinsPerUse,
                    });
                    setProfile(updated);
                    toast(
                      isAr
                        ? `تم تفعيل مكافأة البطاقة وإضافة +${c.bonusCoinsPerUse} عملة بنجاح!`
                        : `Saved card bonus activated: +${c.bonusCoinsPerUse} Bonus Coins!`,
                      'success',
                    );
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer shrink-0 transition-colors"
                >
                  +{c.bonusCoinsPerUse} {isAr ? 'عملة' : 'Coins'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TIER BENEFITS */}
      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Silver */}
          <div
            className={`p-4 rounded-2xl border ${
              profile.loyaltyTier === 'Silver'
                ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
                : 'border-slate-200 dark:border-slate-800'
            } space-y-2`}
          >
            <div className="flex items-center justify-between font-black">
              <span>{isAr ? 'الفئة الفضية' : 'Silver Tier'}</span>
              <span className="text-[10px] text-slate-500">0 - 299 {isAr ? 'عملة' : 'Coins'}</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{isAr ? 'سحب العملات اليومي' : 'Daily Coin Spin'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{isAr ? 'خصم نقدي مباشر عند الدفع' : 'Instant SAR discount at checkout'}</span>
              </li>
            </ul>
          </div>

          {/* Gold */}
          <div
            className={`p-4 rounded-2xl border ${
              profile.loyaltyTier === 'Gold'
                ? 'border-amber-500 bg-amber-500/5 shadow-xs'
                : 'border-slate-200 dark:border-slate-800'
            } space-y-2`}
          >
            <div className="flex items-center justify-between font-black text-amber-600 dark:text-amber-400">
              <span>{isAr ? 'الفئة الذهبية' : 'Gold Tier'}</span>
              <span className="text-[10px] text-slate-500">300 - 999 {isAr ? 'عملة' : 'Coins'}</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{isAr ? 'شحن فوري مخفض' : 'Discounted Express Delivery'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{isAr ? 'مضاعفة عملات البطاقات المحفوظة' : 'Double coins on saved cards'}</span>
              </li>
            </ul>
          </div>

          {/* Platinum */}
          <div
            className={`p-4 rounded-2xl border ${
              profile.loyaltyTier === 'Platinum'
                ? 'border-indigo-500 bg-indigo-500/5 shadow-xs'
                : 'border-slate-200 dark:border-slate-800'
            } space-y-2`}
          >
            <div className="flex items-center justify-between font-black text-indigo-600 dark:text-indigo-400">
              <span>{isAr ? 'الفئة البلاتينية VIP' : 'Platinum VIP'}</span>
              <span className="text-[10px] text-slate-500">+1000 {isAr ? 'عملة' : 'Coins'}</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>{isAr ? 'شحن مجاني لكافة الطلبات' : 'Free Express Shipping'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>{isAr ? 'أولوية التجهيز وخدمة عملاء VIP' : 'VIP Priority Support & Fulfilment'}</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
