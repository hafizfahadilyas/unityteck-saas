import React, { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  Award,
  Plus,
  Coins,
  TrendingUp,
  Gift,
  Users,
  Settings,
  Bell,
  CheckCircle2,
  Share2,
  ShoppingBag,
  Trash2,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Percent,
  Truck,
  Edit2,
  Calendar,
} from 'lucide-react';
import {
  fetchLoyaltyOverviewApi,
  createLoyaltyRewardApi,
  deleteLoyaltyRewardApi,
  updateLoyaltyEarnRuleApi,
  updateLoyaltySettingsApi,
  loyaltyDailySpinApi,
  type LoyaltyOverviewData,
} from '../../api/tenantApi';
import {
  getStoreLoyaltyGameSettings,
  saveStoreLoyaltyGameSettings,
  type StoreLoyaltyGameSettings,
} from '../../services/ksaAutomationEngine';
import { emitLoyaltyGift } from '../storefront/LoyaltyGiftPointsPopup';

interface StoreLoyaltyProgramProps {
  onNavigateTab?: (tab: string) => void;
}

export const StoreLoyaltyProgram: React.FC<StoreLoyaltyProgramProps> = ({ onNavigateTab }) => {
  const { activeStore, allStoreCustomers, currentOrders } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);

  // Summary Metrics
  const [summary, setSummary] = useState({
    contributionToSales: '0%',
    ordersFromPoints: 0,
    totalRedeemed: 0,
    pointsIssued: 0,
    registeredCustomers: 0,
    salesGrowth: '0%',
    ordersGrowth: '0%',
    redeemedGrowth: '0%',
    pointsGrowth: '0%',
    customersStatus: 'Active',
  });

  // Rewards list
  const [rewards, setRewards] = useState<Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    points: number;
    rewardType?: string;
    status: string;
  }>>([]);

  type EarnRuleConfig = {
    points_per_sar?: number;
    product_ids?: string[];
    mode?: 'double' | 'fixed';
    fixed_points_per_unit?: number;
    threshold_sar?: number;
    bonus_points?: number;
    points?: number;
    require_verified?: boolean;
    require_approval?: boolean;
    within_days?: number;
  };

  type EarnRule = {
    id: string;
    method?: string;
    methodAr: string;
    methodEn: string;
    points: number;
    active: boolean;
    config?: EarnRuleConfig;
  };

  const defaultEarnRules: EarnRule[] = [
    {
      id: 'earn-order-completed',
      method: 'order_completed',
      methodAr: 'إكمال الطلب',
      methodEn: 'Order Completed',
      points: 1,
      active: true,
      config: { points_per_sar: 1 },
    },
    {
      id: 'earn-product-bonus',
      method: 'product_bonus',
      methodAr: 'نقاط إضافية لمنتجات محددة',
      methodEn: 'Product-Specific Bonus',
      points: 0,
      active: false,
      config: { product_ids: [], mode: 'double', fixed_points_per_unit: 10 },
    },
    {
      id: 'earn-tiered-spend',
      method: 'tiered_spend',
      methodAr: 'مكافأة إنفاق متدرج',
      methodEn: 'Tiered Spending',
      points: 50,
      active: false,
      config: { threshold_sar: 300, bonus_points: 50 },
    },
    {
      id: 'earn-product-review',
      method: 'product_review',
      methodAr: 'تقييم منتج',
      methodEn: 'Product Review',
      points: 5,
      active: true,
      config: { points: 5, require_verified: true, require_approval: true },
    },
    {
      id: 'earn-review-media',
      method: 'review_with_media',
      methodAr: 'تقييم مع صورة أو فيديو',
      methodEn: 'Review with Media',
      points: 10,
      active: true,
      config: { points: 10, require_verified: true, require_approval: true },
    },
    {
      id: 'earn-first-order',
      method: 'first_order',
      methodAr: 'مكافأة أول طلب',
      methodEn: 'First-Order Bonus',
      points: 50,
      active: true,
      config: { points: 50 },
    },
    {
      id: 'earn-birthday',
      method: 'birthday',
      methodAr: 'مكافأة عيد الميلاد',
      methodEn: "Customer's Birthday Reward",
      points: 100,
      active: true,
      config: { points: 100 },
    },
    {
      id: 'earn-retention',
      method: 'retention',
      methodAr: 'مكافأة إعادة الشراء',
      methodEn: 'Retention Bonus (Repeat Purchase)',
      points: 25,
      active: true,
      config: { points: 25, within_days: 30 },
    },
  ];

  // Ways to earn points
  const [earnRules, setEarnRules] = useState<EarnRule[]>([]);
  // All earn-rule settings stay open (no click-to-expand accordion).
  const [expandedRuleId, setExpandedRuleId] = useState<string | 'all'>('all');

  // Program Settings Toggles
  const [programSettings, setProgramSettings] = useState({
    enableLoyalty: true,
    appNotifications: true,
    emailNotifications: true,
    pointsExpiration: false,
  });

  // Activity feed
  const [activities, setActivities] = useState<Array<{
    id: string;
    label: string;
    time: string;
    status: string;
  }>>([]);

  // Modals
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState('100');
  const [newRewardType, setNewRewardType] = useState('discount');

  // Gamified Coin Game & Saved Card Settings (Isolated per activeStore.id; API is source of truth)
  const [gameSettings, setGameSettings] = useState<StoreLoyaltyGameSettings>(() =>
    getStoreLoyaltyGameSettings(activeStore.id),
  );
  const [isSpinningGame, setIsSpinningGame] = useState(false);
  const [lastWonCoins, setLastWonCoins] = useState<number | null>(null);
  const [coinTick, setCoinTick] = useState(0);
  const [isSavingGame, setIsSavingGame] = useState(false);
  const [gameDirty, setGameDirty] = useState(false);

  useEffect(() => {
    setGameSettings(getStoreLoyaltyGameSettings(activeStore.id));
    setGameDirty(false);
  }, [activeStore.id]);

  const patchGameSettings = useCallback((patch: Partial<StoreLoyaltyGameSettings>) => {
    setGameSettings((prev) => ({ ...prev, ...patch, storeId: prev.storeId }));
    setGameDirty(true);
  }, []);

  const persistGameSettings = useCallback(
    async (next: StoreLoyaltyGameSettings, opts?: { silent?: boolean }) => {
      setIsSavingGame(true);
      setGameSettings(next);
      saveStoreLoyaltyGameSettings(activeStore.id, next);
      try {
        await updateLoyaltySettingsApi(activeStore.id, {
          game_settings: {
            gameEnabled: next.gameEnabled,
            storefrontDockEnabled: next.storefrontDockEnabled,
            coinsPerSar: next.coinsPerSar,
            minSpinCoins: next.minSpinCoins,
            maxSpinCoins: next.maxSpinCoins,
            spinCooldownHours: next.spinCooldownHours,
            cardPaymentBonusCoins: next.cardPaymentBonusCoins,
            signupLocationBonusCoins: next.signupLocationBonusCoins,
          },
        });
        setGameDirty(false);
        if (!opts?.silent) {
          toast(
            isAr ? 'تم حفظ إعدادات لعبة العملات بنجاح.' : 'Coin game settings saved successfully.',
            'success',
          );
        }
        return true;
      } catch {
        toast(
          isAr ? 'تعذر حفظ إعدادات اللعبة على الخادم.' : 'Could not save game settings to the server.',
          'error',
        );
        return false;
      } finally {
        setIsSavingGame(false);
      }
    },
    [activeStore.id, isAr, toast],
  );

  // Load real data strictly isolated to activeStore.id
  const loadData = useCallback(async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const data = await fetchLoyaltyOverviewApi(activeStore.id);
      if (data) {
        setSummary(data.summary || {
          contributionToSales: '0%',
          ordersFromPoints: 0,
          totalRedeemed: 0,
          pointsIssued: 0,
          registeredCustomers: 0,
          salesGrowth: '0%',
          ordersGrowth: '0%',
          redeemedGrowth: '0%',
          pointsGrowth: '0%',
          customersStatus: 'Active',
        });
        setRewards(data.rewards || []);
        setEarnRules(
          data.earn_rules && data.earn_rules.length > 0 ? data.earn_rules : defaultEarnRules
        );
        if (data.settings) {
          setProgramSettings({
            enableLoyalty: data.settings.enableLoyalty ?? true,
            appNotifications: data.settings.appNotifications ?? true,
            emailNotifications: data.settings.emailNotifications ?? true,
            pointsExpiration: data.settings.pointsExpiration ?? false,
          });
        }
        if (data.game_settings) {
          const gs: StoreLoyaltyGameSettings = {
            ...getStoreLoyaltyGameSettings(activeStore.id),
            ...data.game_settings,
            storeId: activeStore.id,
          };
          setGameSettings(gs);
          saveStoreLoyaltyGameSettings(activeStore.id, gs);
          setGameDirty(false);
        }
        setActivities(data.activities || []);
      }
    } catch {
      // Genuine empty on API failure — never invent loyalty metrics
      const storeCustomers = (allStoreCustomers && allStoreCustomers[activeStore.id]) || [];
      setSummary({
        contributionToSales: '0%',
        ordersFromPoints: 0,
        totalRedeemed: 0,
        pointsIssued: 0,
        registeredCustomers: storeCustomers.length,
        salesGrowth: '—',
        ordersGrowth: '—',
        redeemedGrowth: '—',
        pointsGrowth: '—',
        customersStatus: storeCustomers.length > 0 ? 'Active' : 'Inactive',
      });
      setRewards([]);
      setEarnRules(defaultEarnRules);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeStore?.id, allStoreCustomers, currentOrders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Reward Handler
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardName.trim() || !activeStore?.id) return;

    const pointsNum = parseInt(newRewardPoints, 10) || 100;
    try {
      const created = await createLoyaltyRewardApi(activeStore.id, {
        name: newRewardName.trim(),
        points: pointsNum,
        rewardType: newRewardType,
      });

      if (created) {
        setRewards((prev) => [created, ...prev]);
        toast(isAr ? 'تمت إضافة مكافأة ولاء جديدة وحفظها' : 'New loyalty reward created successfully', 'success');
      }
      setShowAddRewardModal(false);
      setNewRewardName('');
      setNewRewardPoints('100');
      loadData();
    } catch {
      toast(isAr ? 'فشل حفظ المكافأة في قاعدة البيانات' : 'Failed to save reward to database', 'error');
    }
  };

  // Delete Reward Handler
  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه المكافأة؟' : 'Are you sure you want to delete this reward?')) {
      return;
    }
    try {
      await deleteLoyaltyRewardApi(activeStore.id, rewardId);
      setRewards((prev) => prev.filter((r) => r.id !== rewardId));
      toast(isAr ? 'تم حذف المكافأة بنجاح' : 'Reward deleted successfully', 'success');
    } catch {
      toast(isAr ? 'فشل حذف المكافأة' : 'Failed to delete reward', 'error');
    }
  };

  const rulePointsLabel = (rule: EarnRule): string => {
    const method = rule.method || '';
    if (method === 'order_completed') {
      const rate = rule.config?.points_per_sar ?? rule.points;
      return isAr ? `${rate} نقطة لكل 1 ر.س` : `${rate} point(s) per 1 SAR`;
    }
    if (method === 'product_bonus') {
      const mode = rule.config?.mode || 'double';
      if (mode === 'fixed') {
        const n = rule.config?.fixed_points_per_unit ?? 10;
        return isAr ? `+${n} نقطة لكل وحدة منتج` : `+${n} pts per unit`;
      }
      return isAr ? 'نقاط مضاعفة للمنتجات المحددة' : 'Double points on selected products';
    }
    if (method === 'tiered_spend') {
      const thr = rule.config?.threshold_sar ?? 300;
      const bonus = rule.config?.bonus_points ?? rule.points;
      return isAr ? `+${bonus} عند إنفاق ${thr} ر.س فأكثر` : `+${bonus} when cart ≥ ${thr} SAR`;
    }
    if (method === 'retention') {
      const days = rule.config?.within_days ?? 30;
      const pts = rule.config?.points ?? rule.points;
      return isAr ? `+${pts} خلال ${days} يوماً` : `+${pts} within ${days} days`;
    }
    return `+${rule.config?.points ?? rule.points} ${isAr ? 'نقطة' : 'points'}`;
  };

  // Toggle Earn Rule
  const handleToggleEarnRule = async (ruleId: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    setEarnRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: nextActive } : r))
    );
    try {
      await updateLoyaltyEarnRuleApi(activeStore.id, ruleId, { active: nextActive });
      toast(isAr ? 'تم تحديث طريقة كسب النقاط' : 'Earning rule updated', 'success');
    } catch {
      setEarnRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, active: currentActive } : r))
      );
      toast(isAr ? 'فشل تحديث الطريقة' : 'Failed to update earning rule', 'error');
    }
  };

  const handleSaveEarnRuleConfig = async (rule: EarnRule) => {
    try {
      const updated = await updateLoyaltyEarnRuleApi(activeStore.id, rule.id, {
        points: rule.points,
        config: rule.config || {},
      });
      if (Array.isArray(updated)) {
        setEarnRules(updated);
      }
      toast(isAr ? 'تم حفظ إعدادات المحفز' : 'Trigger settings saved', 'success');
      setExpandedRuleId('all');
    } catch {
      toast(isAr ? 'فشل حفظ إعدادات المحفز' : 'Failed to save trigger settings', 'error');
    }
  };

  const patchRuleConfig = (ruleId: string, patch: Partial<EarnRuleConfig>, points?: number) => {
    setEarnRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const nextConfig = { ...(r.config || {}), ...patch };
        const nextPoints =
          typeof points === 'number'
            ? points
            : typeof patch.points === 'number'
              ? patch.points
              : typeof patch.bonus_points === 'number'
                ? patch.bonus_points
                : typeof patch.points_per_sar === 'number'
                  ? patch.points_per_sar
                  : r.points;
        return { ...r, config: nextConfig, points: nextPoints };
      })
    );
  };

  // Toggle Settings
  const handleToggleSetting = async (key: keyof typeof programSettings) => {
    const updated = { ...programSettings, [key]: !programSettings[key] };
    setProgramSettings(updated);
    try {
      await updateLoyaltySettingsApi(activeStore.id, updated);
      toast(isAr ? 'تم حفظ إعدادات الولاء' : 'Loyalty settings updated', 'success');
    } catch {
      toast(isAr ? 'فشل حفظ الإعدادات' : 'Failed to update settings', 'error');
    }
  };

  return (
    <div
      className="u-page p-4 sm:p-6 lg:p-6 space-y-6 max-w-[1650px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span
              onClick={() => onNavigateTab && onNavigateTab('marketing')}
              className="hover:underline cursor-pointer text-indigo-600 dark:text-indigo-400 font-medium"
            >
              {isAr ? 'التسويق' : 'Marketing'}
            </span>
            <span>›</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {isAr ? 'برنامج الولاء' : 'Loyalty Program'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>{isAr ? 'برنامج ولاء العملاء والمكافآت' : 'Loyalty Program & Rewards'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'كافئ عملاء متجرك بالنقاط عند كل عملية شراء، وحوّلها إلى قسائم وخصومات.'
              : 'Engage your customers and reward them with points for repeat purchases at your store.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              loadData();
              toast(isAr ? 'تم تحديث بيانات برنامج الولاء' : 'Loyalty data refreshed', 'info');
            }}
            title={isAr ? 'تحديث' : 'Refresh'}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowAddRewardModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer max-w-full"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{isAr ? 'إضافة مكافأة جديدة' : 'Create New Reward'}</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards — equal width/height in row */}
      <div className="u-equal-sections grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Contribution to Sales */}
        <div className="h-full min-h-[108px] w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {isAr ? 'المساهمة في المبيعات' : 'Contribution to Sales'}
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {summary.contributionToSales}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{summary.salesGrowth}</span>
          </span>
        </div>

        {/* Orders from Points */}
        <div className="h-full min-h-[108px] w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {isAr ? 'طلبات عبر النقاط' : 'Orders from Points'}
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {summary.ordersFromPoints}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{summary.ordersGrowth}</span>
          </span>
        </div>

        {/* Total Redeemed */}
        <div className="h-full min-h-[108px] w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {isAr ? 'المكافآت المستبدلة' : 'Total Redeemed'}
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalRedeemed.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{summary.redeemedGrowth}</span>
          </span>
        </div>

        {/* Points Issued */}
        <div className="h-full min-h-[108px] w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {isAr ? 'إجمالي النقاط الممنوحة' : 'Points Issued'}
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {summary.pointsIssued.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{summary.pointsGrowth}</span>
          </span>
        </div>

        {/* Registered Customers */}
        <div className="h-full min-h-[108px] w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {isAr ? 'العملاء المسجلين' : 'Registered Customers'}
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {summary.registeredCustomers}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            {summary.customersStatus}
          </span>
        </div>
      </div>

      {/* ── GAMIFIED DAILY COIN GAME, DIGITAL LOYALTY CARD & SAVED CARDS BONUS CONTROLLER ── */}
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4"
        data-tick={coinTick}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                {isAr
                  ? 'لعبة العملات اليومية + بطاقة الولاء والبطاقات المحفوظة'
                  : 'Daily Spin & Win Coin Game + Digital Loyalty Card & Saved Cards Bonus'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'يلعب العميل مرة كل 24 ساعة ليربح عملات يتسوق بها في الدفع، بالإضافة إلى عملات إضافية عند الدفع بالبطاقات المحفوظة (مدى / فيزا / آبل باي).'
                : 'Customers play once every 24h to win shopping coins, plus earn bonus coins from Saved Cards (Mada/Visa/Apple Pay) — 100% controlled by Store Admin.'}
            </p>
          </div>

          <button
            type="button"
            disabled={isSpinningGame}
            onClick={async () => {
              const storeCusts = (allStoreCustomers && allStoreCustomers[activeStore.id]) || [];
              const targetCust = storeCusts[0];
              if (!targetCust?.id) {
                toast(
                  isAr
                    ? 'لا يوجد عملاء حقيقيون في هذا المتجر لاختبار اللعبة.'
                    : 'No real customers in this store to test the daily spin.',
                  'info',
                );
                return;
              }

              setIsSpinningGame(true);
              try {
                const result = await loyaltyDailySpinApi(activeStore.id, String(targetCust.id));
                const won = Number(result?.points || 0);
                setLastWonCoins(won);
                setCoinTick((t) => t + 1);
                if (won > 0) {
                  emitLoyaltyGift({
                    points: won,
                    reason: isAr ? 'اختبار لعبة العملات اليومية' : 'Daily coin game test',
                  });
                }
                toast(
                  isAr
                    ? `تم رصيد +${won} نقطة ولاء في دفتر المتجر لهذا العميل.`
                    : `Credited +${won} loyalty points to this customer's store ledger.`,
                  'success',
                );
              } catch (err: any) {
                const msg = String(err?.message || err?.body?.message || '');
                if (msg.includes('cooldown') || err?.status === 429) {
                  toast(
                    isAr
                      ? 'مؤقت اللعبة نشط: لعب هذا العميل بالفعل خلال المدة المحددة.'
                      : 'Cooldown active: this customer already spun within the configured window.',
                    'info',
                  );
                } else {
                  toast(
                    isAr ? 'تعذر تنفيذ اللعبة. تحقق من اتصال الخادم.' : 'Spin failed. Check API connection.',
                    'error',
                  );
                }
              } finally {
                setIsSpinningGame(false);
              }
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-2 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}
          >
            <Coins className={`w-4 h-4 ${isSpinningGame ? 'animate-spin' : ''}`} />
            <span>
              {isAr
                ? 'اختبار لعبة العملات اليومية (مؤقت ٢٤ ساعة)'
                : 'Test Daily Coin Game Spin (Win Coins · 24h Timer)'}
            </span>
          </button>
        </div>

        {lastWonCoins !== null && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-between">
            <span>
              {isAr
                ? `آخر جائزة من اللعبة: +${lastWonCoins} عملة (تعادل ${(lastWonCoins / (gameSettings.coinsPerSar || 10)).toFixed(1)} ر.س خصم مباشر في السلة!)`
                : `Latest Game Spin Reward: +${lastWonCoins} Coins (Worth ${(lastWonCoins / (gameSettings.coinsPerSar || 10)).toFixed(1)} SAR at Checkout!)`}
            </span>
          </div>
        )}

        <div className="u-equal-sections grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="h-full min-h-[96px] w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-1">
            <label className="text-[11px] font-bold text-slate-500 block leading-snug min-h-[2.5rem]">
              {isAr ? 'كم عملة تساوي 1 ريال سعودي؟' : 'Coins Needed for 1 SAR Discount'}
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={gameSettings.coinsPerSar}
              onChange={(e) => {
                patchGameSettings({ coinsPerSar: Math.max(1, Number(e.target.value) || 1) });
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>

          <div className="h-full min-h-[96px] w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-1">
            <label className="text-[11px] font-bold text-slate-500 block leading-snug min-h-[2.5rem]">
              {isAr ? 'أقصى عملات في اللعبة اليومية' : 'Max Coins per Daily Game Spin'}
            </label>
            <input
              type="number"
              min={10}
              max={1000}
              value={gameSettings.maxSpinCoins}
              onChange={(e) => {
                patchGameSettings({ maxSpinCoins: Number(e.target.value) || 0 });
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>

          <div className="h-full min-h-[96px] w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-1">
            <label className="text-[11px] font-bold text-slate-500 block leading-snug min-h-[2.5rem]">
              {isAr ? 'مكافأة الدفع بالبطاقات المحفوظة (عملة)' : 'Saved Card Payment Bonus (Coins)'}
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={gameSettings.cardPaymentBonusCoins}
              onChange={(e) => {
                patchGameSettings({ cardPaymentBonusCoins: Number(e.target.value) || 0 });
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>

          <div className="h-full min-h-[96px] w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-1">
            <label className="text-[11px] font-bold text-slate-500 block leading-snug min-h-[2.5rem]">
              {isAr ? 'مكافأة تفعيل الموقع والإشعارات' : 'Allow Location & Push Bonus (Coins)'}
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={gameSettings.signupLocationBonusCoins}
              onChange={(e) => {
                patchGameSettings({ signupLocationBonusCoins: Number(e.target.value) || 0 });
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>
        </div>

        {/* Placement Setting: Customer Profile vs Floating Dock */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>
                {isAr
                  ? 'موضع عرض بطاقة الولاء والمكافآت (الملف الشخصي للعميل)'
                  : 'Loyalty Card & Rewards Placement (Customer Profile)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isAr
                ? 'تُعرض بطاقة الولاء تلقائياً داخل الملف الشخصي للعميل لمنع أي تداخل بصري على الصفحة الرئيسية مع واتساب.'
                : 'Loyalty Card is integrated cleanly inside Customer Profile to prevent overlaps with WhatsApp on Home Page.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-500">
              {gameSettings.storefrontDockEnabled
                ? (isAr ? 'عائم + الملف' : 'Floating + Profile')
                : (isAr ? 'في الملف الشخصي فقط' : 'Profile Only')}
            </span>
            <button
              type="button"
              onClick={() => {
                patchGameSettings({
                  storefrontDockEnabled: !gameSettings.storefrontDockEnabled,
                });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gameSettings.storefrontDockEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {gameSettings.storefrontDockEnabled
                ? (isAr ? 'مفعل عائماً' : 'Floating Enabled')
                : (isAr ? 'حصر في الملف الشخصي (مستحسن)' : 'Profile Only (Recommended)')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500">
            {gameDirty
              ? (isAr ? 'هناك تغييرات غير محفوظة.' : 'You have unsaved changes.')
              : (isAr ? 'جميع الإعدادات محفوظة.' : 'All settings are saved.')}
          </p>
          <button
            type="button"
            disabled={isSavingGame || !gameDirty}
            aria-busy={isSavingGame}
            onClick={() => {
              void persistGameSettings(gameSettings);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Save className={`w-3.5 h-3.5 shrink-0 ${isSavingGame ? 'animate-pulse' : ''}`} aria-hidden />
            <span className="whitespace-nowrap">
              {isSavingGame
                ? (isAr ? 'جارٍ الحفظ...' : 'Saving...')
                : (isAr ? 'حفظ إعدادات اللعبة' : 'Save game settings')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Ways to Earn & Active Rewards & Settings — equal column stretch */}
      <div className="u-equal-sections grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ways to Earn Points & Settings (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6 w-full min-w-0">
          {/* Ways to Earn Points */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'طرق كسب النقاط' : 'Ways to Earn Points'}</span>
              </span>
            </div>

            <div className="space-y-3 w-full">
              {earnRules.map((rule) => {
                const expanded = expandedRuleId === 'all' || expandedRuleId === rule.id;
                const method = rule.method || '';
                return (
                  <div
                    key={rule.id}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 box-border"
                  >
                    <div className="flex items-center justify-between gap-3 min-h-[44px] w-full">
                      <div className="text-start flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {isAr ? rule.methodAr : rule.methodEn}
                        </div>
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                          {rulePointsLabel(rule)}
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ms-2">
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={() => handleToggleEarnRule(rule.id, rule.active)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {expanded && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3 w-full min-w-0">
                        {method === 'order_completed' && (
                          <label className="block text-[11px] font-bold text-slate-500 w-full min-w-0">
                            {isAr ? 'نقاط لكل ريال سعودي' : 'Points per 1 SAR'}
                            <input
                              type="number"
                              min={0}
                              step={0.1}
                              value={rule.config?.points_per_sar ?? rule.points}
                              onChange={(e) =>
                                patchRuleConfig(rule.id, {
                                  points_per_sar: Number(e.target.value) || 0,
                                })
                              }
                              className="mt-1 block w-full max-w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                            />
                          </label>
                        )}

                        {method === 'product_bonus' && (
                          <>
                            <label className="block text-[11px] font-bold text-slate-500">
                              {isAr ? 'نوع المكافأة' : 'Bonus mode'}
                              <select
                                value={rule.config?.mode || 'double'}
                                onChange={(e) =>
                                  patchRuleConfig(rule.id, {
                                    mode: e.target.value as 'double' | 'fixed',
                                  })
                                }
                                className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              >
                                <option value="double">
                                  {isAr ? 'نقاط مضاعفة' : 'Double points'}
                                </option>
                                <option value="fixed">
                                  {isAr ? 'نقاط ثابتة لكل وحدة' : 'Fixed points per unit'}
                                </option>
                              </select>
                            </label>
                            {(rule.config?.mode || 'double') === 'fixed' && (
                              <label className="block text-[11px] font-bold text-slate-500">
                                {isAr ? 'نقاط لكل وحدة' : 'Points per unit'}
                                <input
                                  type="number"
                                  min={0}
                                  value={rule.config?.fixed_points_per_unit ?? 10}
                                  onChange={(e) =>
                                    patchRuleConfig(rule.id, {
                                      fixed_points_per_unit: Number(e.target.value) || 0,
                                    })
                                  }
                                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                                />
                              </label>
                            )}
                            <label className="block text-[11px] font-bold text-slate-500">
                              {isAr
                                ? 'معرّفات المنتجات (مفصولة بفاصلة)'
                                : 'Product IDs (comma-separated)'}
                              <input
                                type="text"
                                value={(rule.config?.product_ids || []).join(', ')}
                                onChange={(e) =>
                                  patchRuleConfig(rule.id, {
                                    product_ids: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                placeholder={isAr ? 'مثال: معرف-١، معرف-٢' : 'e.g. prod-1, prod-2'}
                                className="mt-1 block w-full max-w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              />
                            </label>
                          </>
                        )}

                        {method === 'tiered_spend' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
                            <label className="block text-[11px] font-bold text-slate-500 min-w-0">
                              {isAr ? 'حد الإنفاق (ر.س)' : 'Spend threshold (SAR)'}
                              <input
                                type="number"
                                min={0}
                                value={rule.config?.threshold_sar ?? 300}
                                onChange={(e) =>
                                  patchRuleConfig(rule.id, {
                                    threshold_sar: Number(e.target.value) || 0,
                                  })
                                }
                                className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              />
                            </label>
                            <label className="block text-[11px] font-bold text-slate-500">
                              {isAr ? 'نقاط المكافأة' : 'Bonus points'}
                              <input
                                type="number"
                                min={0}
                                value={rule.config?.bonus_points ?? rule.points}
                                onChange={(e) =>
                                  patchRuleConfig(rule.id, {
                                    bonus_points: Number(e.target.value) || 0,
                                  })
                                }
                                className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              />
                            </label>
                          </div>
                        )}

                        {(method === 'product_review' ||
                          method === 'review_with_media' ||
                          method === 'first_order' ||
                          method === 'birthday') && (
                          <label className="block text-[11px] font-bold text-slate-500">
                            {isAr ? 'النقاط' : 'Points'}
                            <input
                              type="number"
                              min={0}
                              value={rule.config?.points ?? rule.points}
                              onChange={(e) =>
                                patchRuleConfig(rule.id, {
                                  points: Number(e.target.value) || 0,
                                })
                              }
                              className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                            />
                          </label>
                        )}

                        {(method === 'product_review' || method === 'review_with_media') && (
                          <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.config?.require_approval !== false}
                                onChange={(e) =>
                                  patchRuleConfig(rule.id, {
                                    require_approval: e.target.checked,
                                  })
                                }
                              />
                              {isAr ? 'بعد الموافقة فقط' : 'After approval only'}
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.config?.require_verified !== false}
                                onChange={(e) =>
                                  patchRuleConfig(rule.id, {
                                    require_verified: e.target.checked,
                                  })
                                }
                              />
                              {isAr ? 'مشتري موثّق فقط' : 'Verified buyers only'}
                            </label>
                          </div>
                        )}

                        {method === 'retention' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
                            <label className="block text-[11px] font-bold text-slate-500 min-w-0">
                              {isAr ? 'خلال (أيام)' : 'Within (days)'}
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={rule.config?.within_days ?? 30}
                                onChange={(e) =>
                                  patchRuleConfig(rule.id, {
                                    within_days: Number(e.target.value) || 30,
                                  })
                                }
                                className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              />
                            </label>
                            <label className="block text-[11px] font-bold text-slate-500">
                              {isAr ? 'نقاط المكافأة' : 'Bonus points'}
                              <input
                                type="number"
                                min={0}
                                value={rule.config?.points ?? rule.points}
                                onChange={(e) =>
                                  patchRuleConfig(rule.id, {
                                    points: Number(e.target.value) || 0,
                                  })
                                }
                                className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                              />
                            </label>
                          </div>
                        )}

                        <div className="pt-1 w-full min-w-0 clear-both">
                          <button
                            type="button"
                            onClick={() => handleSaveEarnRuleConfig(rule)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5 shrink-0" aria-hidden />
                            <span className="whitespace-nowrap">
                              {isAr ? 'حفظ الإعدادات' : 'Save settings'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loyalty Program Settings */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'إعدادات البرنامج' : 'Loyalty Program Settings'}</span>
              </span>
            </div>

            <div className="space-y-3 w-full">
              {[
                {
                  key: 'enableLoyalty' as const,
                  titleAr: 'تفعيل برنامج الولاء',
                  titleEn: 'Enable loyalty program',
                  descAr: 'السماح للعملاء بكسب واستخدام النقاط في المتجر.',
                  descEn: 'Allow customers to earn and use points.',
                  val: programSettings.enableLoyalty,
                },
                {
                  key: 'appNotifications' as const,
                  titleAr: 'إشعارات التطبيق',
                  titleEn: 'App notifications',
                  descAr: 'إرسال إشعار للعميل عند كسب أو استبدال النقاط.',
                  descEn: 'Send notifications when customers earn or redeem.',
                  val: programSettings.appNotifications,
                },
                {
                  key: 'emailNotifications' as const,
                  titleAr: 'إشعارات البريد الإلكتروني',
                  titleEn: 'Email notifications',
                  descAr: 'إرسال ملخص رصيد النقاط والمكافآت الترويجية الجديدة.',
                  descEn: 'Send promotional emails for new rewards.',
                  val: programSettings.emailNotifications,
                },
                {
                  key: 'pointsExpiration' as const,
                  titleAr: 'صلاحية وانتهاء النقاط',
                  titleEn: 'Points expiration',
                  descAr: 'تحديد فترة صلاحية النقاط (مثال: 12 شهراً).',
                  descEn: 'Define points validity window (e.g., 12 months).',
                  val: programSettings.pointsExpiration,
                },
              ].map((s) => (
                <div
                  key={s.key}
                  className="w-full min-h-[60px] box-border flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                >
                  <div className="pe-2 min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {isAr ? s.titleAr : s.titleEn}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {isAr ? s.descAr : s.descEn}
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ms-2">
                    <input
                      type="checkbox"
                      checked={s.val}
                      onChange={() => handleToggleSetting(s.key)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Rewards & Activity (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6 w-full min-w-0">
          {/* Active Rewards */}
          <div className="w-full flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'مكافآت النقاط المتاحة' : 'Active Rewards'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddRewardModal(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{isAr ? 'إضافة مكافأة' : 'Add Reward'}</span>
              </button>
            </div>

            <div className="space-y-3 w-full flex-1 min-h-[140px]">
              {rewards.length > 0 ? (
                rewards.map((rew) => (
                  <div
                    key={rew.id}
                    className="w-full min-h-[60px] box-border p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {isAr ? rew.nameAr : rew.nameEn}
                      </div>
                      <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {rew.points} {isAr ? 'نقطة مطلوبة للاستبدال' : 'points required'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteReward(rew.id)}
                      title={isAr ? 'حذف المكافأة' : 'Delete reward'}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Gift className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? 'لا توجد مكافآت مضافة حتى الآن' : 'No rewards created yet'}
                  </p>
                  <button
                    onClick={() => setShowAddRewardModal(true)}
                    className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة أول مكافأة' : 'Add your first reward'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Loyalty Activities Feed */}
          <div className="w-full flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'سجل نشاطات الولاء الحديثة' : 'Recent Loyalty Activities'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {activities.length} {isAr ? 'نشاط' : 'events'}
              </span>
            </div>

            <div className="space-y-3 w-full flex-1 min-h-[100px]">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="w-full min-h-[44px] flex items-center justify-between gap-3 text-xs pb-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {act.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{act.time}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                      {act.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  <p>{isAr ? 'لا توجد نشاطات مسجلة في برنامج الولاء حالياً' : 'No recent loyalty activity recorded'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Reward Modal */}
      {showAddRewardModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowAddRewardModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إضافة مكافأة جديدة' : 'Create New Reward'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'إضافة مكافأة جديدة' : 'Create New Reward'}
              </h3>
              <button
                onClick={() => setShowAddRewardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم المكافأة *' : 'Reward Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newRewardName}
                  onChange={(e) => setNewRewardName(e.target.value)}
                  placeholder={isAr ? 'مثال: خصم ٢٠٪ على كامل الطلب' : 'e.g., 20% off entire order'}
                  className="w-full px-3.5 py-2.5 border rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'نوع المكافأة' : 'Reward Type'}
                </label>
                <select
                  value={newRewardType}
                  onChange={(e) => setNewRewardType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="discount">{isAr ? 'خصم نسبة مئوية' : 'Percentage Discount'}</option>
                  <option value="shipping">{isAr ? 'شحن وتوصيل مجاني' : 'Free Shipping'}</option>
                  <option value="gift">{isAr ? 'منتج أو هدية مجانية' : 'Free Product Gift'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'النقاط المطلوبة للاستبدال *' : 'Points Required *'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newRewardPoints}
                  onChange={(e) => setNewRewardPoints(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {isAr ? 'إضافة المكافأة' : 'Create Reward'}
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
