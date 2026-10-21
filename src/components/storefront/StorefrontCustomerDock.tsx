import React, { useState, useEffect } from 'react';
import {
  Coins,
  MapPin,
  Bell,
  Award,
  CreditCard,
  Truck,
  Sparkles,
  CheckCircle2,
  XCircle,
  X,
  Gift,
  Clock,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  getStoreLoyaltyGameSettings,
  getOrCreateCustomerGamifiedProfile,
  saveCustomerGamifiedProfile,
  getStoreOrderPolicy,
  type CustomerGamifiedProfile,
} from '../../services/ksaAutomationEngine';

export const StorefrontCustomerDock: React.FC<{ storeId: string }> = ({ storeId }) => {
  const { activeStore, allStoreCustomers, currentOrders, updateOrderStatus } = useTenant();
  const { locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'card' | 'orders'>('game');
  const [isSpinning, setIsSpinning] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`dock_collapsed_${storeId}`) === 'true';
    } catch {
      return false;
    }
  });

  const storeCusts = (allStoreCustomers && allStoreCustomers[storeId]) || [];
  const primaryCust = storeCusts[0] || {
    id: `cust-${storeId}-1`,
    name: isAr ? 'عميل المتجر السعودي' : 'Saudi Store Customer',
    phone: '+966 50 123 4567',
    email: 'customer@ksa-store.sa',
    city: 'Riyadh',
  };

  const [profile, setProfile] = useState<CustomerGamifiedProfile>(() =>
    getOrCreateCustomerGamifiedProfile(storeId, primaryCust.id, {
      name: primaryCust.name,
      phone: primaryCust.phone,
      email: primaryCust.email,
      city: (primaryCust as any).city || 'Riyadh',
    }),
  );

  const [loyaltySettings, setLoyaltySettings] = useState(() => getStoreLoyaltyGameSettings(storeId));
  const orderPolicy = getStoreOrderPolicy(storeId);

  useEffect(() => {
    setLoyaltySettings(getStoreLoyaltyGameSettings(storeId));
    const handleSync = (e: any) => {
      if (!e.detail || e.detail.storeId === storeId) {
        setLoyaltySettings(getStoreLoyaltyGameSettings(storeId));
      }
    };
    window.addEventListener('unityteck-ksa-engine-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('unityteck-ksa-engine-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [storeId]);

  useEffect(() => {
    setProfile(
      getOrCreateCustomerGamifiedProfile(storeId, primaryCust.id, {
        name: primaryCust.name,
        phone: primaryCust.phone,
        email: primaryCust.email,
        city: (primaryCust as any).city || 'Riyadh',
      }),
    );
  }, [storeId, primaryCust.id]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-customer-dock', handleOpen);
    window.addEventListener('open-loyalty-modal', handleOpen);
    return () => {
      window.removeEventListener('open-customer-dock', handleOpen);
      window.removeEventListener('open-loyalty-modal', handleOpen);
    };
  }, []);

  // Allow Location & Browser Push Notifications -> Sync to Profile + Earn Bonus Coins
  const handleAllowLocationAndPush = async () => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch {}

    const completeGrant = (lat?: number, lng?: number) => {
      const bonus = profile.locationAllowed ? 0 : loyaltySettings.signupLocationBonusCoins;
      const updated = saveCustomerGamifiedProfile(storeId, {
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
          ? `تم تفعيل الموقع الجغرافي والإشعارات في ملفك الشخصي بنجاح (+${bonus} عملة مكافأة)!`
          : `Location & Notifications enabled in your Profile (+${bonus} Bonus Coins)!`,
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

  // Play Daily Spin & Win Coin Game (24h Cooldown Timer)
  const handleSpinGame = () => {
    if (
      profile.lastGameSpinAt &&
      Date.now() - profile.lastGameSpinAt < loyaltySettings.spinCooldownHours * 3600 * 1000
    ) {
      const hrs = Math.ceil(
        (loyaltySettings.spinCooldownHours * 3600 * 1000 - (Date.now() - profile.lastGameSpinAt)) / 3600000,
      );
      toast(
        isAr
          ? `لعبت اليوم بالفعل! يمكنك اللعب مجدداً بعد ${hrs} ساعة.`
          : `You already played today! Next daily spin available in ~${hrs}h.`,
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
      const updated = saveCustomerGamifiedProfile(storeId, {
        ...profile,
        coinsBalance: profile.coinsBalance + won,
        totalCoinsEarned: profile.totalCoinsEarned + won,
        lastGameSpinAt: Date.now(),
      });
      setProfile(updated);
      setIsSpinning(false);
      toast(
        isAr
          ? `مبروك! ربحت +${won} عملة يمكنك التسوق بها فوراً!`
          : `Congratulations! You won +${won} Coins to shop with at checkout!`,
        'success',
      );
    }, 650);
  };

  const sarDiscountWorth = (profile.coinsBalance / (loyaltySettings.coinsPerSar || 10)).toFixed(1);

  return (
    <>
      {/* Floating Storefront Loyalty & Tracking Pill — Only shown if explicitly enabled, preventing overlaps on home page */}
      {loyaltySettings.storefrontDockEnabled && (
        isCollapsed ? (
          <div className="fixed bottom-4 start-4 z-40">
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                try {
                  localStorage.setItem(`dock_collapsed_${storeId}`, 'false');
                } catch {}
              }}
              title={isAr ? 'إظهار العملات وبطاقة الولاء' : 'Show Coins & Loyalty'}
              className="h-8 px-2.5 rounded-full text-white shadow-lg flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all hover:scale-105 border border-white/20 select-none"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
            >
              <Coins className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-mono text-[10px]">{profile.coinsBalance}</span>
              <span className="text-[10px] opacity-90 underline underline-offset-2">
                {isAr ? 'إظهار' : 'Show'}
              </span>
            </button>
          </div>
        ) : (
          <div
            className="fixed bottom-4 start-4 z-40 flex items-center shadow-lg rounded-full border border-white/20 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="h-8 px-3 text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer hover:bg-white/10 transition-colors select-none"
            >
              <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">
                {isAr
                  ? `عملاتي والولاء (${profile.coinsBalance} = ${sarDiscountWorth} ر.س)`
                  : `Coins & Loyalty (${profile.coinsBalance} = ${sarDiscountWorth} SAR)`}
              </span>
            </button>

            <div className="h-4 w-px bg-white/30 shrink-0" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(true);
                try {
                  localStorage.setItem(`dock_collapsed_${storeId}`, 'true');
                } catch {}
              }}
              title={isAr ? 'إخفاء' : 'Hide / Close'}
              aria-label={isAr ? 'إخفاء' : 'Hide / Close'}
              className="h-8 px-2 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      )}

      {/* Customer Profile, Coin Game, Saved Cards & Order Tracking Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-base">
                  {isAr ? `ملف ومكافآت العميل — ${activeStore.name}` : `Customer Rewards, Cards & Tracking — ${activeStore.name}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {profile.name} · {profile.city}, KSA · {profile.loyaltyCardNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Location & Notification Permission Banner */}
            <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
              <div className="text-xs space-y-0.5">
                <div className="font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {profile.locationAllowed
                      ? isAr ? `تم تفعيل الموقع (${profile.city}) والإشعارات ✓` : `Location (${profile.city}) & Push Allowed ✓`
                      : isAr ? 'فعّل الموقع الجغرافي والإشعارات واربح عملات فورية!' : 'Allow Location & Notifications for Bonus Coins!'}
                  </span>
                </div>
              </div>
              {!profile.locationAllowed && (
                <button
                  type="button"
                  onClick={handleAllowLocationAndPush}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black cursor-pointer shrink-0"
                >
                  {isAr ? `تفعيل (+${loyaltySettings.signupLocationBonusCoins} عملة)` : `Allow (+${loyaltySettings.signupLocationBonusCoins} Coins)`}
                </button>
              )}
            </div>

            {/* Sub Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('game')}
                className={`py-2 rounded-xl cursor-pointer ${activeTab === 'game' ? 'bg-white dark:bg-slate-900 shadow-xs' : ''}`}
              >
                {isAr ? 'لعبة العملات' : 'Coin Game'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 rounded-xl cursor-pointer ${activeTab === 'card' ? 'bg-white dark:bg-slate-900 shadow-xs' : ''}`}
              >
                {isAr ? 'بطاقة الولاء والدفع' : 'Loyalty & Cards'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`py-2 rounded-xl cursor-pointer ${activeTab === 'orders' ? 'bg-white dark:bg-slate-900 shadow-xs' : ''}`}
              >
                {isAr ? 'تتبع وإلغاء الطلب' : 'Track / Cancel'}
              </button>
            </div>

            {/* TAB 1: DAILY COIN GAME & SHOPPING REDEMPTION */}
            {activeTab === 'game' && (
              <div className="space-y-4 text-center">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 to-emerald-500/15 border border-amber-500/30 space-y-3">
                  <Coins className={`w-10 h-10 text-amber-500 mx-auto ${isSpinning ? 'animate-spin' : ''}`} />
                  <div className="text-2xl font-black font-mono">
                    {profile.coinsBalance} {isAr ? 'عملة' : 'Coins'} = {sarDiscountWorth} SAR
                  </div>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? 'العب يومياً لربح العملات واستخدمها كخصم نقدي مباشر عند إتمام الطلب!'
                      : 'Play daily to win Coins and redeem them directly as SAR cash discount at checkout!'}
                  </p>
                  <button
                    type="button"
                    onClick={handleSpinGame}
                    disabled={isSpinning}
                    className="w-full py-3 rounded-2xl text-xs font-black text-white shadow-md cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}
                  >
                    {isAr ? 'العب الآن واربح عملات التسوق (مؤقت 24 ساعة)' : 'Play Daily Spin & Win Coins (24h Timer)'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DIGITAL LOYALTY CARD & SAVED PAYMENT CARDS */}
            {activeTab === 'card' && (
              <div className="space-y-3">
                <div
                  className="p-4 rounded-2xl text-white space-y-2 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #022c22, #059669)' }}
                >
                  <div className="flex items-center justify-between text-xs font-bold opacity-90">
                    <span>{activeStore.name} Loyalty Card</span>
                    <span>{profile.loyaltyTier} Tier</span>
                  </div>
                  <div className="text-lg font-mono font-black tracking-widest">
                    {profile.loyaltyCardNumber}
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span>{profile.name}</span>
                    <span className="font-mono font-black">{profile.coinsBalance} Coins ({sarDiscountWorth} SAR)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-black">
                    {isAr ? 'البطاقات المحفوظة (تكسب عملات إضافية عند الشراء)' : 'Saved Cards (Earn Bonus Coins on Purchase)'}
                  </div>
                  {profile.savedCards.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <CreditCard className="w-4 h-4 text-emerald-500" />
                        <span>{c.brand} •••• {c.last4}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = saveCustomerGamifiedProfile(storeId, {
                            ...profile,
                            coinsBalance: profile.coinsBalance + c.bonusCoinsPerUse,
                            totalCoinsEarned: profile.totalCoinsEarned + c.bonusCoinsPerUse,
                          });
                          setProfile(updated);
                          toast(
                            isAr
                              ? `تم استخدام البطاقة المحفوظة وإضافة +${c.bonusCoinsPerUse} عملة لرصيدك!`
                              : `Used Saved Card & earned +${c.bonusCoinsPerUse} Bonus Coins!`,
                            'success',
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black cursor-pointer"
                      >
                        +{c.bonusCoinsPerUse} {isAr ? 'عملة' : 'Coins'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE ORDER TRACKING & POLICY-GOVERNED CANCELLATION */}
            {activeTab === 'orders' && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {currentOrders.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    {isAr ? 'لا توجد طلبات حالية.' : 'No orders found.'}
                  </div>
                ) : (
                  currentOrders.slice(0, 4).map((ord) => {
                    const canCancel =
                      orderPolicy.allowCustomerCancel &&
                      (ord.status === 'pending' || ord.status === 'processing');
                    return (
                      <div
                        key={ord.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-black font-mono">#{ord.orderNumber || ord.id}</div>
                          <div className="text-[11px] text-slate-500">
                            {ord.status.toUpperCase()} · {money(ord.total)} · {orderPolicy.shippingCarrierDefault}
                          </div>
                        </div>
                        {canCancel ? (
                          <button
                            type="button"
                            onClick={() => {
                              updateOrderStatus(ord.id, 'cancelled');
                              toast(
                                isAr
                                  ? 'تم إلغاء الطلب ضمن المهلة المسموحة وإرسال إشعار للإدارة والبريد!'
                                  : 'Order cancelled within policy window & Admin/Email notified!',
                                'info',
                              );
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-black cursor-pointer"
                          >
                            {isAr ? 'إلغاء الطلب' : 'Cancel Order'}
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                            {ord.status}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export { CustomerLoyaltyProfileSection } from './CustomerLoyaltyProfileSection';

