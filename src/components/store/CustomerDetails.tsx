import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { commerceTerm, type CommerceTermKey } from '../../i18n/commerceTerms';
import { Customer, CustomerWalletTransaction, Order } from '../../types';
import { isApiEnabled } from '../../api/client';
import {
  fetchCustomerActivitiesApi,
  fetchCustomerWalletApi,
  fetchCustomerWalletTransactionsApi,
} from '../../api/tenantApi';
import { usePermissions } from '../../hooks/usePermissions';
import {
  loadCustomerGroups,
  getCustomerGroupNames,
  setCustomerGroupNames,
  type CustomerGroupDef,
} from '../../utils/customerGroupsStorage';
import {
  getLocalCustomerWallet,
  setLocalWalletFromApi,
  type WalletTransactionRecord,
} from '../../utils/customerWalletStorage';
import { CustomerWalletAdjustModal } from './CustomerWalletAdjustModal';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  Sparkles,
  Calendar,
  MapPin,
  Globe,
  Crown,
  Coins,
  Tag,
  Clock,
  ShoppingCart,
  Plus,
  Edit2,
  Copy,
  Check,
  X,
  Bot,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  FileText,
  Gift,
  Wallet,
  Activity,
  Send,
  Loader2,
  Camera,
  Upload,
  Image as ImageIcon,
  Smartphone,
  Users,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { CustomerAvatarUploadModal } from './CustomerAvatarUploadModal';
import { getArabCustomerAvatar, getCustomerSeoAlt } from '../../utils/customerAvatars';
import { handleImageError } from '../../utils/imageFallback';
import { WhatsAppBrandIcon } from '../common/BrandIcons';

interface CustomerDetailsProps {
  customer: Customer;
  onBack: () => void;
  onSelectCustomer?: (customerId: string) => void;
}

type TabType = 'orders' | 'loyalty' | 'coupons' | 'offers' | 'wallet' | 'activity';

function formatLastLoginDisplay(value: string | undefined, isAr: boolean): string {
  if (!value?.trim()) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value.trim() || '—';
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day}/${month}/${year} | ${time}`;
}

function mapLocalTx(row: WalletTransactionRecord): CustomerWalletTransaction {
  return {
    id: row.id,
    storeId: row.store_id,
    customerId: row.customer_id,
    type: row.type,
    amount: row.amount,
    balanceBefore: row.balance_before,
    balanceAfter: row.balance_after,
    reason: row.reason,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    notifyChannel: row.notify_channel,
    resetLoyalty: row.reset_loyalty,
    createdAt: row.created_at,
  };
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customer: initialCustomer,
  onBack,
}) => {
  const { activeStore, currentOrders, currentCoupons, updateCustomer } = useTenant();
  const { money, locale } = usePrefs();
  const { canWrite } = usePermissions();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const canAdjustWallet = canWrite('customers');

  const [customer, setCustomer] = useState<Customer>(() => ({
    ...initialCustomer,
    avatar: initialCustomer.avatar || getArabCustomerAvatar(initialCustomer),
  }));
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync when initialCustomer prop changes
  React.useEffect(() => {
    setCustomer({
      ...initialCustomer,
      avatar: initialCustomer.avatar || getArabCustomerAvatar(initialCustomer),
    });
  }, [initialCustomer]);

  // Edit Customer Info State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [firstName, setFirstName] = useState(
    customer.firstName || customer.name.split(' ')[0] || ''
  );
  const [lastName, setLastName] = useState(
    customer.lastName || customer.name.split(' ').slice(1).join(' ') || ''
  );
  const [email, setEmail] = useState(customer.email || '');
  const [phone, setPhone] = useState(customer.phone?.replace(/^\+966\s?/, '') || '');
  const [gender, setGender] = useState(customer.gender || '');
  const [country, setCountry] = useState(customer.country || '');
  const [city, setCity] = useState(customer.city || '');
  const [state, setState] = useState(customer.state || '');
  const [dob, setDob] = useState(customer.dob || '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSaveSuccess, setInfoSaveSuccess] = useState(false);

  const [activityRows, setActivityRows] = useState<
    Array<{
      id: string;
      activity_type: string;
      product_name?: string | null;
      order_id?: string | null;
      occurred_at?: string | null;
      meta?: Record<string, unknown> | null;
    }>
  >([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'activity' || !activeStore?.id || !customer.id || !isApiEnabled()) {
      return;
    }
    let cancelled = false;
    setActivityLoading(true);
    fetchCustomerActivitiesApi(activeStore.id, customer.id)
      .then((rows) => {
        if (!cancelled) setActivityRows(rows);
      })
      .catch(() => {
        if (!cancelled) setActivityRows([]);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, activeStore?.id, customer.id]);

  const [walletBalance, setWalletBalance] = useState<number>(
    customer.walletBalance ?? customer.cashbackBalance ?? 0,
  );
  const [walletLoyaltyPoints, setWalletLoyaltyPoints] = useState<number>(
    customer.loyaltyPoints ?? 0,
  );
  const [walletTransactions, setWalletTransactions] = useState<CustomerWalletTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showWalletAdjust, setShowWalletAdjust] = useState(false);

  const [customGroups, setCustomGroups] = useState<CustomerGroupDef[]>([]);
  const [memberGroupNames, setMemberGroupNames] = useState<string[]>([]);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [groupsDraft, setGroupsDraft] = useState<string[]>([]);

  // Tags State — only real tags from customer record (no English dummy defaults)
  const [tags, setTags] = useState<string[]>(Array.isArray(customer.tags) ? customer.tags : []);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTagInput, setShowAddTagInput] = useState(false);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello! I have loaded the full profile for ${customer.name}. They are a ${customer.group || 'Regular'} customer from ${customer.city || 'Jazan'}. How can I assist you with tailored marketing or retention today?`,
    },
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Calculate real customer orders strictly isolated by storeId
  const customerOrders = useMemo(() => {
    return (currentOrders || []).filter((o: Order) => {
      if (o.storeId !== activeStore.id) return false;
      const matchEmail = o.customerEmail && customer.email && o.customerEmail.toLowerCase() === customer.email.toLowerCase();
      const matchPhone = o.customerPhone && customer.phone && (o.customerPhone.includes(customer.phone) || customer.phone.includes(o.customerPhone));
      const matchName = o.customerName && customer.name && o.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim();
      return matchEmail || matchPhone || matchName;
    });
  }, [currentOrders, activeStore.id, customer]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return customerOrders;
    if (orderFilter === 'completed') return customerOrders.filter((o) => (o.status as string).toLowerCase() === 'delivered' || (o.status as string).toLowerCase() === 'completed');
    if (orderFilter === 'pending') return customerOrders.filter((o) => (o.status as string).toLowerCase() === 'pending' || (o.status as string).toLowerCase() === 'processing');
    if (orderFilter === 'cancelled') return customerOrders.filter((o) => (o.status as string).toLowerCase() === 'cancelled');
    return customerOrders;
  }, [customerOrders, orderFilter]);

  // Real store coupons
  const storeCoupons = useMemo(() => {
    return (currentCoupons || []).filter((c) => c.storeId === activeStore.id);
  }, [currentCoupons, activeStore.id]);

  const cancelledOrdersCount = useMemo(
    () =>
      customerOrders.filter((o) => String(o.status).toLowerCase() === 'cancelled').length,
    [customerOrders],
  );

  const purchasingMetrics = useMemo(() => {
    const fromOrdersCount = customerOrders.length;
    const totalOrders =
      fromOrdersCount > 0 ? fromOrdersCount : customer.totalOrders ?? 0;
    const totalOrderValue =
      fromOrdersCount > 0
        ? customerOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        : customer.totalSpending ?? 0;
    const avgOrderValue =
      fromOrdersCount > 0
        ? totalOrderValue / fromOrdersCount
        : customer.avgOrderValue ?? 0;

    let lastOrderLabel = '—';
    if (fromOrdersCount > 0) {
      const sorted = [...customerOrders].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      const latest = sorted[0];
      if (latest?.createdAt) {
        lastOrderLabel = formatLastLoginDisplay(String(latest.createdAt), isAr);
      }
    } else if (customer.lastOrderDate && customer.lastOrderDate !== '—') {
      lastOrderLabel = customer.lastOrderDate;
    }

    const abandonedForCustomer = currentOrders.filter((o) => {
      if (o.storeId !== activeStore.id) return false;
      if (String(o.status).toLowerCase() !== 'pending') return false;
      const matchEmail =
        o.customerEmail &&
        customer.email &&
        o.customerEmail.toLowerCase() === customer.email.toLowerCase();
      const matchPhone =
        o.customerPhone &&
        customer.phone &&
        (o.customerPhone.includes(customer.phone) || customer.phone.includes(o.customerPhone));
      const matchName =
        o.customerName &&
        customer.name &&
        o.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim();
      return matchEmail || matchPhone || matchName;
    });

    let abandonedCartsLabel = '0';
    if (abandonedForCustomer.length === 1) {
      const items = abandonedForCustomer[0].items?.length ?? abandonedForCustomer[0].itemsCount;
      if (items && items > 0) {
        abandonedCartsLabel = isAr ? `${items}منتج` : `${items} Product${items === 1 ? '' : 's'}`;
      } else {
        abandonedCartsLabel = isAr ? '1 سلة' : '1 Cart';
      }
    } else if (abandonedForCustomer.length > 1) {
      abandonedCartsLabel = String(abandonedForCustomer.length);
    }

    return {
      totalOrders,
      totalOrderValue,
      avgOrderValue,
      cancelledOrdersCount,
      lastOrderLabel,
      abandonedCartsLabel,
    };
  }, [
    customerOrders,
    customer,
    currentOrders,
    activeStore.id,
    cancelledOrdersCount,
    isAr,
  ]);

  const customerRewards = customer.rewards ?? [];
  const wishlistItems = customer.wishlistItems ?? [];
  const lastLoginDisplay = formatLastLoginDisplay(customer.lastLogin, isAr);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const formattedPhone = phone.startsWith('+') ? phone : `+966${phone.trim()}`;

    const updates: Partial<Customer> = {
      name: fullName,
      firstName,
      lastName,
      email: email.trim(),
      phone: formattedPhone,
      gender: gender as 'Male' | 'Female' | 'Other',
      country,
      city,
      state,
      dob,
    };

    updateCustomer(customer.id, updates);
    setCustomer((prev) => ({ ...prev, ...updates }));
    setIsSavingInfo(false);
    setIsEditingInfo(false);
    setInfoSaveSuccess(true);
    setTimeout(() => setInfoSaveSuccess(false), 2500);
  };

  const refreshWallet = useCallback(async () => {
    const storeId = activeStore.id;
    const customerId = customer.id;
    setWalletLoading(true);
    try {
      if (isApiEnabled()) {
        const [snap, txs] = await Promise.all([
          fetchCustomerWalletApi(storeId, customerId),
          fetchCustomerWalletTransactionsApi(storeId, customerId),
        ]);
        setWalletBalance(snap.balance);
        setWalletLoyaltyPoints(snap.loyaltyPoints);
        setWalletTransactions(txs);
        setLocalWalletFromApi(
          storeId,
          customerId,
          snap.balance,
          snap.loyaltyPoints,
          txs.map((t) => ({
            id: String(t.id),
            store_id: t.storeId,
            customer_id: t.customerId,
            type: t.type,
            amount: t.amount,
            balance_before: t.balanceBefore,
            balance_after: t.balanceAfter,
            reason: t.reason,
            employee_id: t.employeeId,
            employee_name: t.employeeName,
            notify_channel: t.notifyChannel,
            reset_loyalty: t.resetLoyalty,
            created_at: t.createdAt,
          })),
        );
      } else {
        const local = getLocalCustomerWallet(storeId, customerId);
        setWalletBalance(local.balance);
        setWalletLoyaltyPoints(local.loyalty_points);
        setWalletTransactions(local.transactions.map(mapLocalTx));
      }
    } catch {
      const local = getLocalCustomerWallet(storeId, customerId);
      setWalletBalance(local.balance);
      setWalletLoyaltyPoints(local.loyalty_points);
      setWalletTransactions(local.transactions.map(mapLocalTx));
    } finally {
      setWalletLoading(false);
    }
  }, [activeStore.id, customer.id]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    setCustomGroups(loadCustomerGroups(activeStore.id));
    const names = getCustomerGroupNames(activeStore.id, customer.id);
    if (names.length > 0) {
      setMemberGroupNames(names);
    } else if (customer.group?.trim()) {
      setMemberGroupNames([customer.group.trim()]);
    } else {
      setMemberGroupNames([]);
    }
  }, [activeStore.id, customer.id, customer.group]);

  const handleOpenGroupsModal = () => {
    setGroupsDraft(memberGroupNames.length ? [...memberGroupNames] : []);
    setShowGroupsModal(true);
  };

  const toggleGroupDraft = (name: string) => {
    setGroupsDraft((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name],
    );
  };

  const handleSaveGroups = () => {
    const unique = Array.from(new Set(groupsDraft.map((g) => g.trim()).filter(Boolean)));
    setCustomerGroupNames(activeStore.id, customer.id, unique);
    setMemberGroupNames(unique);
    const primary = unique[0];
    if (primary) {
      updateCustomer(customer.id, { group: primary as Customer['group'] });
      setCustomer((prev) => ({ ...prev, group: primary as Customer['group'] }));
    }
    setShowGroupsModal(false);
    toast(isAr ? 'تم تحديث مجموعات العميل' : 'Customer groups updated', 'success');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    updateCustomer(customer.id, { tags: updatedTags });
    setCustomer((prev) => ({ ...prev, tags: updatedTags }));
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const trimmed = newTagInput.trim();
    if (!tags.includes(trimmed)) {
      const updatedTags = [...tags, trimmed];
      setTags(updatedTags);
      updateCustomer(customer.id, { tags: updatedTags });
      setCustomer((prev) => ({ ...prev, tags: updatedTags }));
    }
    setNewTagInput('');
    setShowAddTagInput(false);
  };

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputText.trim() || isAiTyping) return;
    const userText = aiInputText.trim();
    setAiChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setAiInputText('');
    setIsAiTyping(true);

    setTimeout(() => {
      const wantsOffer =
        /discount|offer/i.test(userText) ||
        userText.includes('خصم') ||
        userText.includes('عرض');
      const wantsOrder =
        /order/i.test(userText) ||
        userText.includes('طلب');
      let reply = isAr
        ? `بناءً على ملف${customer.name}في${activeStore.name}، لديهم ميل مرتفع للشراء. إرسال كوبون واتساب مخصص للتوصيل المجاني قد يحقق معدل تحويل يقارب 32٪.`
        : `Based on ${customer.name}'s profile in ${activeStore.name}, they have high purchase propensity. Sending a personalized WhatsApp coupon code for free delivery on floral bouquets has an estimated 32% conversion rate.`;
      if (wantsOffer) {
        reply = isAr
          ? `أنصح بإنشاء كوبون خصم 15٪ للعميل المميز صالح لمدة 7 أيام.${customer.name}يتفاعل كثيراً عبر واتساب ويستجيب أفضل للعروض الموسمية.`
          : `I recommend generating a 15% VIP discount coupon valid for 7 days. ${customer.name} frequently interacts on WhatsApp and responds best to seasonal floral promotions.`;
      } else if (wantsOrder) {
        reply = isAr
          ? `${customer.name}لديه حالياً${customerOrders.length}طلبات مؤكدة بإجمالي قيمة${money(customer.totalSpending || 0)}.`
          : `${customer.name} currently has ${customerOrders.length} confirmed orders with a total value of ${money(customer.totalSpending || 0)}.`;
      }
      setAiChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setIsAiTyping(false);
    }, 900);
  };

  const cleanPhoneForWa = (customer.phone || '').replace(/[^0-9]/g, '');
  const hasPhone = cleanPhoneForWa.length >= 9;
  const hasEmail = Boolean(customer.email && customer.email.trim());

  const loyaltyPointsCount = walletLoyaltyPoints ?? customer.loyaltyPoints ?? 0;
  const cashbackAmount = walletBalance;
  const availableCouponsCount =
    customer.availableCoupons != null ? customer.availableCoupons : 0;
  const expiringSoonCount = customer.expiringSoonCount ?? 0;
  const offersCount = customerRewards.length;

  const localizePlace = (value?: string) => {
    if (!value || !value.trim()) return isAr ? 'غير محدد' : 'Not set';
    const v = value.trim();
    if (/saudi\s*arabia/i.test(v) || v === 'KSA' || v === 'SA') {
      return isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia';
    }
    if (/^jazan$/i.test(v) || v === 'جازان') return isAr ? 'جازان' : 'Jazan';
    if (/^riyadh$/i.test(v) || v === 'الرياض') return isAr ? 'الرياض' : 'Riyadh';
    if (/^jeddah$/i.test(v) || v === 'جدة') return isAr ? 'جدة' : 'Jeddah';
    if (/^makkah|mecca$/i.test(v) || v === 'مكة') return isAr ? 'مكة المكرمة' : 'Makkah';
    if (/^madinah|medina$/i.test(v) || v === 'المدينة') return isAr ? 'المدينة المنورة' : 'Madinah';
    return v;
  };

  const languageLabel = (() => {
    const lang = (customer.language || '').trim();
    if (!lang) return isAr ? 'غير محدد' : 'Not set';
    if (/^ar|arabic|عربي/i.test(lang)) return isAr ? 'العربية' : 'Arabic';
    if (/^en|english|إنجليزي/i.test(lang)) return isAr ? 'الإنجليزية' : 'English';
    return lang;
  })();

  const aiInsightsList =
    customer.aiInsights && customer.aiInsights.length > 0
      ? customer.aiInsights
      : [
          isAr
            ? `طلبات مكتملة:${customerOrders.filter((o) => ['delivered', 'completed'].includes(String(o.status).toLowerCase)).length}`
            : `Completed orders: ${customerOrders.filter((o) => ['delivered', 'completed'].includes(String(o.status).toLowerCase())).length}`,
          isAr
            ? `إجمالي الإنفاق:${money(customer.totalSpending || 0)}`
            : `Lifetime spent: ${money(customer.totalSpending || 0)}`,
          hasPhone
            ? isAr
              ? 'رقم واتساب متوفر للتواصل'
              : 'WhatsApp number available'
            : isAr
              ? 'لا يوجد رقم هاتف مسجّل'
              : 'No phone on file',
        ];

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950/40 min-h-screen">
      {/* Toast Notification */}
      {infoSaveSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-top duration-200 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isAr ? 'تم تحديث بيانات العميل بنجاح!' : 'Customer details updated successfully!'}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium cursor-pointer"
            >
              {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isAr ? 'العملاء' : 'Customers'}</span>
            </button>
            <span>&gt;</span>
            <span className="text-slate-700 dark:text-slate-200 font-semibold">
              {isAr ? 'تفاصيل العميل' : 'Customer Details'}
            </span>
          </div>

          {/* Title Row with vertical teal accent bar */}
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 rounded-full bg-teal-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'تفاصيل العميل' : 'Customer Details'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 pl-4">
            {isAr
              ? 'عرض وإدارة بيانات العميل، سجل الطلبات، نقاط المكافآت والمزيد.'
              : 'View and manage customer information, orders, loyalty points, and more.'}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2">
          {hasPhone && (
            <a
              href={`https://wa.me/${cleanPhoneForWa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all"
            >
              <WhatsAppBrandIcon className="w-4 h-4 text-[#25D366]" title="WhatsApp" />
              <span>{isAr ? 'مراسلة عبر واتساب' : 'Send via WhatsApp'}</span>
            </a>
          )}

          {hasEmail && (
            <a
              href={`mailto:${customer.email}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm transition-all"
            >
              <Mail className="w-4 h-4 text-teal-600" />
              <span>{isAr ? 'إرسال بريد إلكتروني' : 'Send Email'}</span>
            </a>
          )}

          {hasPhone && (
            <a
              href={`tel:${customer.phone}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all"
            >
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'اتصال بالعميل' : 'Call Customer'}</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleOpenGroupsModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'إضافة إلى المجموعات' : 'Add to Groups'}</span>
          </button>

          {/* Chat with AI */}
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:border-purple-400 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>{isAr ? 'محادثة الذكاء الاصطناعي' : 'Chat with AI'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left 2/3 Content & Right 1/3 Sidebars */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 of 12) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Customer Profile Hero Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Profile Avatar & Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
                {/* Avatar with Status Dot & Change Photo Action */}
                <div className="flex flex-col items-center sm:items-start shrink-0">
                  <div className="relative group">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-teal-100 to-emerald-100 dark:from-teal-950 dark:to-slate-800 border-2 border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-200 font-bold text-2xl shadow-inner overflow-hidden">
                      {customer.avatar ? (
                        <img
                          src={customer.avatar}
                          alt={getCustomerSeoAlt(customer, activeStore?.name, isAr)}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => handleImageError(e)}
                          className="w-full h-full rounded-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <span>{customer.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" />

                    {/* Hover Camera Overlay Button */}
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(true)}
                      className="absolute inset-0 rounded-full bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]"
                      title={isAr ? 'تغيير صورة العميل' : 'Change customer photo'}
                    >
                      <Camera className="w-5 h-5 drop-shadow" />
                      <span className="text-[10px] font-bold mt-0.5 drop-shadow">
                        {isAr ? 'تغيير' : 'Change'}
                      </span>
                    </button>
                  </div>

                  {/* Explicit Button under avatar */}
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="mt-2 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isAr ? 'تغيير الصورة' : 'Change Photo'}</span>
                  </button>
                </div>

                {/* Identity Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                      {customer.name}
                    </h2>
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {customer.group === 'VIP'
                        ? isAr ? 'عميل مميز' : 'VIP Customer'
                        : isAr ? 'عميل عادي' : 'Regular Customer'}
                    </span>
                  </div>

                  {/* Location & Language — locale-consistent, no EN/AR mix */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {localizePlace(customer.country)}
                        {customer.city ? `, ${localizePlace(customer.city)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{languageLabel}</span>
                    </div>
                  </div>

                  {/* Member Since — only real registered date */}
                  {customer.registeredDate ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {isAr
                          ? `عضو منذ${customer.registeredDate}`
                          : `Member since ${customer.registeredDate}`}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isAr ? 'آخر تسجيل دخول:' : 'Last Login: '}
                      <span dir="ltr">{lastLoginDisplay}</span>
                    </span>
                  </div>

                  {memberGroupNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {memberGroupNames.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* Contact Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {hasPhone ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span dir="ltr">{customer.phone}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(customer.phone!, 'phone')}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ms-1 transition-colors cursor-pointer"
                          title={isAr ? 'نسخ رقم الهاتف' : 'Copy phone'}
                        >
                          {copiedField === 'phone' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {isAr ? 'لا يوجد رقم هاتف' : 'No phone on file'}
                      </span>
                    )}

                    {hasPhone && (
                      <a
                        href={`https://wa.me/${cleanPhoneForWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 flex items-center justify-center hover:bg-[#25D366]/25 transition-colors"
                        title={isAr ? 'فتح محادثة واتساب' : 'Open WhatsApp chat'}
                      >
                        <WhatsAppBrandIcon className="w-3.5 h-3.5" title="WhatsApp" />
                      </a>
                    )}

                    {hasEmail ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[170px]" dir="ltr">
                          {customer.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(customer.email!, 'email')}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ms-1 transition-colors cursor-pointer"
                          title={isAr ? 'نسخ البريد الإلكتروني' : 'Copy email'}
                        >
                          {copiedField === 'email' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {isAr ? 'لا يوجد بريد إلكتروني' : 'No email on file'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Insights Card */}
              <div className="lg:w-72 bg-gradient-to-br from-teal-50/70 via-slate-50/60 to-emerald-50/50 dark:from-teal-950/30 dark:via-slate-900 dark:to-emerald-950/20 border border-teal-100 dark:border-teal-900/50 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{isAr ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {isAr ? 'تجريبي' : 'Beta'}
                  </span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {aiInsightsList.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                      <span className="leading-snug">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4 Benefit Metric Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Loyalty Points */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-sm">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'نقاط الولاء' : 'Loyalty Points'}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{loyaltyPointsCount}</p>
              </div>
            </div>

            {/* Cashback Balance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'رصيد الكاش باك' : 'Cashback Balance'}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{money(cashbackAmount)}</p>
              </div>
            </div>

            {/* Available Coupons */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-sm">
                  <Tag className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'الكوبونات المتاحة' : 'Available Coupons'}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{availableCouponsCount}</p>
              </div>
            </div>

            {/* Expiring Soon */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'تنتهي قريباً' : 'Expiring Soon'}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{expiringSoonCount}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Tabs Navigation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-sm overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                onClick={() => setActiveTab('orders')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isAr ? `سجل الطلبات (${customerOrders.length})` : `Order History (${customerOrders.length})`}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('loyalty')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'loyalty'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>
                  {isAr
                    ? `نقاط الولاء (${loyaltyPointsCount})`
                    : `Loyalty Points (${loyaltyPointsCount})`}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('coupons')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'coupons'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>{isAr ? `الكوبونات (${availableCouponsCount})` : `Coupons (${availableCouponsCount})`}</span>
              </button>

              <button
                onClick={() => setActiveTab('offers')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'offers'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>
                  {isAr ? `العروض (${offersCount})` : `Offers (${offersCount})`}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'wallet'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>{isAr ? 'المحفظة والكاش باك' : 'Wallet & Cashback'}</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'activity'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>{isAr ? 'سجل النشاط' : 'Activity Logs'}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Order History */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
              {/* Header & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isAr ? 'سجل الطلبات' : 'Order History'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr ? 'قائمة بجميع طلبات هذا العميل في المتجر.' : 'A list of all orders placed by this customer.'}
                    </p>
                  </div>
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value as any)}
                    className="appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="all">{isAr ? 'جميع الطلبات' : 'All Orders'}</option>
                    <option value="completed">{isAr ? 'المكتملة' : 'Completed'}</option>
                    <option value="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
                    <option value="cancelled">{isAr ? 'الملغية' : 'Cancelled'}</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Table / Empty State */}
              {filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-3 font-semibold text-start">#</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'تاريخ الطلب' : 'Order Date'}</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'المنتجات' : 'Items'}</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'طريقة الدفع' : 'Payment Method'}</th>
                        <th className="py-3 px-3 font-semibold text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredOrders.map((ord, idx) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {ord.orderNumber || `#${idx + 1}`}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : (isAr ? 'حديثاً' : 'Recent')}
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                            {ord.itemsCount || 1} {isAr ? 'منتج' : 'items'}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                            {money(ord.total || 0)}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {ord.status || (isAr ? 'غير محدد' : 'Not Specified')}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                            {ord.paymentMethod || (isAr ? 'غير محدد' : 'Not Specified')}
                          </td>
                          <td className="py-3.5 px-3 text-end">
                            <button className="text-teal-600 hover:text-teal-700 font-semibold text-xs cursor-pointer">
                              {isAr ? 'عرض' : 'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* 100% Pixel-Perfect Empty State */
                <div className="py-14 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <FileText className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {isAr ? 'لا توجد طلبات سابقة' : 'No orders found'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    {isAr ? 'لم يقم هذا العميل بإجراء أي طلبات حتى الآن.' : "This customer hasn't placed any orders yet."}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      toast(
                        isAr
                          ? `سيتم إنشاء طلب جديد للعميل${customer.name}في متجر${activeStore.name}`
                          : `New order flow for ${customer.name} in ${activeStore.name}`,
                        'info',
                      )
                    }
                    className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'إنشاء طلب' : 'Create Order'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Loyalty Points */}
          {activeTab === 'loyalty' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'سجل نقاط الولاء' : 'Loyalty Points Ledger'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'سجل تدقيق للنقاط المكتسبة والمستبدلة والمعدلة.' : 'Audit trail of earned, redeemed, and adjusted points.'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 font-bold text-sm border border-teal-200 dark:border-teal-800">
                  {isAr ? `الإجمالي:${loyaltyPointsCount}نقطة` : `Total: ${loyaltyPointsCount} pts`}
                </span>
              </div>

              {loyaltyPointsCount <= 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? 'لا توجد نقاط ولاء متاحة' : 'No Loyalty Points Available'}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'لا يوجد سجل تفصيلي للنقاط في قاعدة البيانات بعد.'
                    : 'No detailed loyalty ledger entries in the database yet.'}
                </p>
              )}
            </div>
          )}

          {/* Tab 3: Coupons */}
          {activeTab === 'coupons' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'الكوبونات وقسائم الشراء النشطة' : 'Active Coupons & Vouchers'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'كوبونات يمكن للعميل استخدامها عند الدفع.' : 'Coupons available for this customer in checkout.'}
                  </p>
                </div>
              </div>

              {availableCouponsCount <= 0 && storeCoupons.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? 'لا توجد كوبونات مرتبطة بهذا العميل' : 'No coupons linked to this customer'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {storeCoupons.slice(0, availableCouponsCount || storeCoupons.length).map((cp) => (
                    <div
                      key={cp.id}
                      className="border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 rounded-xl p-4 space-y-2"
                    >
                      <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-teal-200">
                        {cp.code}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {cp.discountType === 'fixed'
                          ? isAr
                            ? `خصم${cp.discountValue}ر.س`
                            : `${money(cp.discountValue)} off`
                          : isAr
                            ? `خصم${cp.discountValue}%`
                            : `${cp.discountValue}% off`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Offers */}
          {activeTab === 'offers' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'العروض المخصصة للعميل' : 'Personalized Offers'}
              </h3>
              {customerRewards.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'لا توجد مكافآت متاحة لهذا العميل'
                    : 'No Rewards Available for This Customer'}
                </div>
              ) : (
                <div className="space-y-3">
                  {customerRewards.map((r) => (
                    <div
                      key={r.id}
                      className="border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl p-4"
                    >
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                        {isAr ? r.titleAr || r.title : r.title || r.titleAr}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Wallet & Cashback */}
          {activeTab === 'wallet' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'سجل المحفظة والكاش باك' : 'Wallet & Cashback Ledger'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'الرصيد المتاح من رصيد المتجر والكاش باك.' : 'Available store credit and cashback balance.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-emerald-600">
                    {isAr ? `الرصيد:${money}` : `Balance: ${money(cashbackAmount)}`}
                  </span>
                  {canAdjustWallet ? (
                    <button
                      type="button"
                      onClick={() => setShowWalletAdjust(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                    >
                      {isAr ? 'تعديل الرصيد' : 'Adjust Balance'}
                    </button>
                  ) : null}
                </div>
              </div>

              {walletLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري التحميل...' : 'Loading...'}</span>
                </div>
              ) : walletTransactions.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? 'لا توجد معاملات مسجّلة' : 'No Transactions Recorded'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? 'النوع' : 'Type'}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? 'السبب' : 'Reason'}</th>
                        <th className="py-2.5 px-3 text-end">{isAr ? 'الرصيد بعد' : 'Balance After'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {walletTransactions.map((tx) => (
                        <tr key={String(tx.id)}>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {formatLastLoginDisplay(tx.createdAt, isAr)}
                          </td>
                          <td className="py-3 px-3 font-semibold">
                            {tx.type === 'add'
                              ? isAr
                                ? 'إضافة'
                                : 'Add'
                              : isAr
                                ? 'خصم'
                                : 'Deduct'}
                          </td>
                          <td className="py-3 px-3 font-bold">{money(tx.amount)}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {tx.reason?.trim() || (isAr ? 'غير محدد' : 'Not Specified')}
                          </td>
                          <td className="py-3 px-3 text-end font-mono">{money(tx.balanceAfter)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Activity Logs */}
          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'سجل النشاط' : 'Activity Logs'}
              </h3>
              {activityLoading ? (
                <div className="py-10 flex items-center justify-center text-slate-500 gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAr ? 'جاري التحميل…' : 'Loading…'}
                </div>
              ) : activityRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? 'لا توجد سجلات' : 'No records found'}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activityRows.map((row) => {
                    const typeKeyMap: Record<string, CommerceTermKey> = {
                      product_viewed: 'productViewed',
                      add_to_cart: 'addToCart',
                      remove_from_cart: 'removeFromCart',
                      checkout_started: 'checkoutStarted',
                      order_created: 'orderCreated',
                      payment_completed: 'paymentCompleted',
                      order_cancelled: 'orderCancelled',
                    };
                    const termKey = typeKeyMap[row.activity_type];
                    const typeLabel = termKey
                      ? commerceTerm(termKey, isAr)
                      : row.activity_type;
                    return (
                      <li key={row.id} className="py-3 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{typeLabel}</p>
                          {row.product_name ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {isAr ? 'المنتج:' : 'Product: '}
                              {row.product_name}
                            </p>
                          ) : null}
                          {row.order_id ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                              {isAr ? 'الطلب المرتبط:' : 'Related order: '}
                              {row.order_id}
                            </p>
                          ) : null}
                        </div>
                        <time className="text-[11px] text-slate-400 shrink-0">
                          {row.occurred_at
                            ? new Date(row.occurred_at).toLocaleString(isAr ? 'ar-SA' : 'en-SA')
                            : '—'}
                        </time>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 of 12) Sidebars */}
        <div className="xl:col-span-4 space-y-6">
          {/* 1. Customer Information Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'بيانات العميل' : 'Customer Information'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-teal-600" />
                <span>
                  {isEditingInfo
                    ? isAr ? 'إلغاء' : 'Cancel'
                    : isAr ? 'تعديل' : 'Edit'}
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-3.5">
              {/* Profile Photo Quick Row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                    {customer.avatar ? (
                      <img
                        src={customer.avatar}
                        alt={getCustomerSeoAlt(customer, activeStore?.name, isAr)}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? 'الصورة الشخصية للعميل' : 'Customer Profile Photo'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'حجم مربع 1:1 مخصص للمنطقة العربية' : '1:1 square photo, Arab region curated'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-teal-500 hover:text-teal-600 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'تغيير' : 'Change'}</span>
                </button>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'الاسم الأول' : 'First Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'اسم العائلة' : 'Last Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  disabled={!isEditingInfo}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-sm">🇸🇦</span>
                    <span>+966</span>
                  </div>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                  />
                  {hasPhone && (
                    <a
                      href={`https://wa.me/${cleanPhoneForWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors"
                      title={isAr ? 'واتساب' : 'WhatsApp'}
                    >
                      <WhatsAppBrandIcon className="w-3.5 h-3.5" title="WhatsApp" />
                    </a>
                  )}
                </div>
              </div>

              {/* Gender & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'الجنس' : 'Gender'}
                  </label>
                  <select
                    disabled={!isEditingInfo}
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Male">{isAr ? 'ذكر' : 'Male'}</option>
                    <option value="Female">{isAr ? 'أنثى' : 'Female'}</option>
                    <option value="Other">{isAr ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'الدولة' : 'Country'}
                  </label>
                  <select
                    disabled={!isEditingInfo}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Saudi Arabia">{isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</option>
                    <option value="United Arab Emirates">{isAr ? 'الإمارات العربية المتحدة' : 'United Arab Emirates'}</option>
                    <option value="Kuwait">{isAr ? 'الكويت' : 'Kuwait'}</option>
                  </select>
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'المدينة' : 'City'}
                  </label>
                  <select
                    disabled={!isEditingInfo}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Jazan">{isAr ? 'جازان' : 'Jazan'}</option>
                    <option value="Makkah">{isAr ? 'مكة المكرمة' : 'Makkah'}</option>
                    <option value="Riyadh">{isAr ? 'الرياض' : 'Riyadh'}</option>
                    <option value="Jeddah">{isAr ? 'جدة' : 'Jeddah'}</option>
                    <option value="Dammam">{isAr ? 'الدمام' : 'Dammam'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'المنطقة' : 'State'}
                  </label>
                  <select
                    disabled={!isEditingInfo}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Jazan">{isAr ? 'منطقة جازان' : 'Jazan'}</option>
                    <option value="Makkah Province">{isAr ? 'منطقة مكة المكرمة' : 'Makkah Province'}</option>
                    <option value="Riyadh Province">{isAr ? 'منطقة الرياض' : 'Riyadh Province'}</option>
                    <option value="Eastern Province">{isAr ? 'المنطقة الشرقية' : 'Eastern Province'}</option>
                  </select>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? 'تاريخ الميلاد' : 'Date of Birth'}
                </label>
                <div className="relative">
                  <Calendar className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${isAr ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="YYYY/MM/DD"
                    className={`w-full py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                  />
                </div>
              </div>

              {/* Save Button when in Edit mode */}
              {isEditingInfo && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSavingInfo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Purchasing Behavior Indicators */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'مؤشرات سلوك الشراء' : 'Purchasing Behavior Indicators'}
            </h3>
            <dl className="grid grid-cols-1 gap-2.5 text-xs">
              {[
                {
                  label: isAr ? 'إجمالي الطلبات' : 'Total Orders',
                  value: String(purchasingMetrics.totalOrders),
                },
                {
                  label: isAr ? 'إجمالي قيمة الطلبات' : 'Total Order Value',
                  value: money(purchasingMetrics.totalOrderValue),
                },
                {
                  label: isAr ? 'متوسط قيمة الطلب' : 'Average Order Value',
                  value:
                    purchasingMetrics.totalOrders > 0
                      ? money(purchasingMetrics.avgOrderValue)
                      : money(0),
                },
                {
                  label: isAr ? 'الطلبات الملغاة' : 'Cancelled Orders',
                  value: String(purchasingMetrics.cancelledOrdersCount),
                },
                {
                  label: isAr ? 'آخر طلب' : 'Last Order',
                  value: purchasingMetrics.lastOrderLabel,
                },
                {
                  label: isAr ? 'السلات المتروكة' : 'Abandoned Carts',
                  value: purchasingMetrics.abandonedCartsLabel,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                >
                  <dt className="text-slate-500 dark:text-slate-400">{row.label}</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200 text-end" dir="ltr">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Rewards */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'المكافآت' : 'Rewards'}
            </h3>
            {customerRewards.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'لا توجد مكافآت متاحة لهذا العميل'
                  : 'No Rewards Available for This Customer'}
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {customerRewards.map((r) => (
                  <li key={r.id}>{isAr ? r.titleAr || r.title : r.title || r.titleAr}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Customer Wallet */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'محفظة العميل' : 'Customer Wallet'}
              </h3>
              {canAdjustWallet ? (
                <button
                  type="button"
                  onClick={() => setShowWalletAdjust(true)}
                  className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 cursor-pointer"
                >
                  {isAr ? 'تعديل' : 'Adjust'}
                </button>
              ) : null}
            </div>
            <p className="text-lg font-bold text-emerald-600">{money(walletBalance)}</p>
            {walletTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'لا توجد معاملات مسجّلة' : 'No Transactions Recorded'}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? `${walletTransactions.length}معاملة في السجل`
                  : `${walletTransactions.length} transaction(s) on record`}
              </p>
            )}
          </div>

          {/* Loyalty Points */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'نقاط الولاء' : 'Loyalty Points'}
            </h3>
            {loyaltyPointsCount <= 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'لا توجد نقاط ولاء متاحة' : 'No Loyalty Points Available'}
              </p>
            ) : (
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{loyaltyPointsCount}</p>
            )}
          </div>

          {/* Wishlist */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'قائمة الأمنيات' : 'Wishlist'}
              </h3>
            </div>
            {wishlistItems.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'لا توجد عناصر في قائمة الأمنيات' : 'No Wishlist Items Available'}
              </p>
            ) : (
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                {wishlistItems.map((w) => (
                  <li key={w.id}>{isAr ? w.nameAr || w.name : w.name || w.nameAr}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Messaging Details — Email, SMS, WhatsApp consistent order */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'تفاصيل المراسلة' : 'Messaging Details'}
              </h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
                </div>
                <span className="font-medium truncate max-w-[160px]" dir="ltr">
                  {hasEmail ? customer.email : isAr ? 'غير متوفر' : 'Not available'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <span>{isAr ? 'رسالة نصية' : 'SMS'}</span>
                </div>
                <span className="font-medium" dir="ltr">
                  {hasPhone ? customer.phone : isAr ? 'غير متوفر' : 'Not available'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <WhatsAppBrandIcon className="w-4 h-4 text-[#25D366]" title="WhatsApp" />
                  <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                </div>
                <span className="font-medium" dir="ltr">
                  {hasPhone ? customer.phone : isAr ? 'غير متوفر' : 'Not available'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Tags Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'وسوم العميل' : 'Customer Tags'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddTagInput(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-teal-600" />
                <span>{isAr ? 'إضافة وسم' : 'Add Tag'}</span>
              </button>
            </div>

            {/* Tag Chips — localized labels, no EN/AR mix */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {tags.map((tg) => {
                const tagLabelMap: Record<string, { en: string; ar: string }> = {
                  flower_lover: { en: 'Flower lover', ar: 'محب للزهور' },
                  regular_customer: { en: 'Regular customer', ar: 'عميل منتظم' },
                  offers: { en: 'Interested in offers', ar: 'مهتم بالعروض' },
                  vip: { en: 'VIP', ar: 'عميل مميز' },
                };
                const mapped = tagLabelMap[tg];
                const label = mapped ? (isAr ? mapped.ar : mapped.en) : tg;
                return (
                <span
                  key={tg}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 text-xs font-medium"
                >
                  <span>{label}</span>
                  <button
                    onClick={() => handleRemoveTag(tg)}
                    className="text-teal-500 hover:text-teal-700 dark:hover:text-teal-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
              })}

              {/* Inline Add Tag Input */}
              {showAddTagInput ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder={isAr ? 'اكتب الوسم...' : 'Type tag...'}
                    autoFocus
                    className="px-2.5 py-1 text-xs rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    onClick={handleAddTag}
                    className="p-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowAddTagInput(false)}
                    className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddTagInput(true)}
                  className="w-7 h-7 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-teal-600 hover:border-teal-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Modal */}
      {showAiModal && (
        <GlobalModal
          onClose={() => setShowAiModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={
            isAr
              ? 'مساعد الذكاء الاصطناعي لتحليل وسلوك العملاء'
              : 'AI Customer Intelligence & Retention Assistant'
          }
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isAr
                      ? 'مساعد الذكاء الاصطناعي لتحليل وسلوك العملاء'
                      : 'AI Customer Intelligence & Retention Assistant'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? `السياق:${customer.name}•${activeStore.nameAr || activeStore.name}`
                      : `Context: ${customer.name} • ${activeStore.nameEn || activeStore.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3 rounded-bl-sm text-slate-500 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>
                      {isAr
                        ? 'الذكاء الاصطناعي يقوم بتحليل سلوك ونمط الشراء للعميل...'
                        : 'AI is analyzing customer purchase patterns...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendAiMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder={
                  isAr
                    ? 'اسأل الذكاء الاصطناعي عن توصية تسويقية أو كوبون ولاء مخصص...'
                    : 'Ask AI for retention recommendation or personalized coupon...'
                }
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                type="submit"
                disabled={!aiInputText.trim() || isAiTyping}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </GlobalModal>
      )}

      {showGroupsModal ? (
        <GlobalModal
          onClose={() => setShowGroupsModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'تعيين المجموعات' : 'Assign Groups'}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'تعيين المجموعات' : 'Assign Groups'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGroupsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {customGroups.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'لا توجد مجموعات بعد. أنشئ مجموعة من صفحة العملاء أولاً.'
                  : 'No groups yet. Create a group from the Customers page first.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customGroups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-teal-400"
                  >
                    <input
                      type="checkbox"
                      checked={groupsDraft.includes(g.name)}
                      onChange={() => toggleGroupDraft(g.name)}
                      className="rounded border-slate-300 text-teal-600"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{g.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveGroups}
                className="flex-1 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 cursor-pointer"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowGroupsModal(false)}
                className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </GlobalModal>
      ) : null}

      <CustomerWalletAdjustModal
        isOpen={showWalletAdjust}
        onClose={() => setShowWalletAdjust(false)}
        storeId={activeStore.id}
        customerId={customer.id}
        customerName={customer.name}
        currentBalance={walletBalance}
        isAr={isAr}
        onApplied={(result) => {
          setWalletBalance(result.balance);
          setWalletLoyaltyPoints(result.loyaltyPoints);
          updateCustomer(customer.id, {
            cashbackBalance: result.balance,
            loyaltyPoints: result.loyaltyPoints,
            walletBalance: result.balance,
          });
          setCustomer((prev) => ({
            ...prev,
            cashbackBalance: result.balance,
            loyaltyPoints: result.loyaltyPoints,
            walletBalance: result.balance,
          }));
          refreshWallet();
        }}
      />

      {/* Customer Avatar Media Upload Modal */}
      <CustomerAvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        customerId={customer.id}
        customerName={customer.name}
        customerGender={customer.gender}
        currentAvatar={customer.avatar}
        onAvatarUpdated={(newAvatarUrl) => {
          setCustomer((prev) => ({ ...prev, avatar: newAvatarUrl }));
        }}
      />
    </div>
  );
};

// Simple User Icon helper
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
