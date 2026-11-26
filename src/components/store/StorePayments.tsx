import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { commerceTerm } from '../../i18n/commerceTerms';
import type { Order } from '../../types';
import {
  fetchStoreBankAccountsApi,
  createStoreBankAccountApi,
  updateStoreBankAccountApi,
  deleteStoreBankAccountApi,
  fetchBankTransferProofs,
  approveBankTransferProof,
  rejectBankTransferProof,
  type StoreBankAccountRow,
  type StoreBankAccountPayload,
  type BankTransferProofRow,
} from '../../api/tenantApi';
import {
  CreditCard,
  Coins,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Check,
  Download,
  AlertCircle,
  Crown,
  DollarSign,
  Landmark,
  Save,
  FileText,
  Printer,
  Sparkles,
  Pencil,
  X,
  HelpCircle,
  Upload,
  Trash2,
  Copy,
  Zap,
  Key,
  RefreshCw,
  Sliders,
  Smartphone,
  Plus,
  Loader2,
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';
import {
  AdvancedDataTable,
  type AdvancedTableColumn,
} from '../common/AdvancedDataTable';
import { downloadCsv } from '../../utils/exportSpreadsheet';
import {
  TamaraGatewayModal,
  type TamaraGatewayFormState,
} from './payments/TamaraGatewayModal';
import { PAYMENT_METHOD_LOGO } from '../../utils/paymentMethodLogos';
import { PaymentTransactionsTrackingView } from './payments/PaymentTransactionsTrackingView';

export type PaymentHubSubTab = 'transactions' | 'gateways' | 'bank_accounts' | 'fees';

const RetailInvoiceModal = lazy(() =>
  import('../common/RetailInvoiceModal').then((m) => ({ default: m.RetailInvoiceModal })),
);

type PaymentPayoutRow = {
  id: string;
  txId: string;
  date: string;
  dateRaw: string;
  amount: number;
  fee: number;
  net: number;
  method: string;
  gateway: string;
  destination: string;
  status: string;
  statusRaw: string;
  ref: string;
  isRefundable: boolean;
  orderId?: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  trackingNumber: string;
};

/** Official PNG on white tile — Holst remaps colored pills so white glyphs vanish. */
function PaymentLogoTile({
  src,
  alt,
  fallback,
}: {
  src?: string;
  alt: string;
  fallback?: React.ReactNode;
}) {
  return (
    <div className="u-logo-tile w-11 h-9 rounded-xl flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden">
      {src ? (
        <img src={src} alt={alt} className="max-w-full max-h-full object-contain" loading="lazy" />
      ) : (
        fallback || <span className="text-[10px] font-black text-slate-800">{alt.slice(0, 4)}</span>
      )}
    </div>
  );
}

const emptyBankForm = (): StoreBankAccountPayload => ({
  bank_name: '',
  account_title: '',
  iban: '',
  account_number: '',
  payment_reference_prefix: '',
  is_default: false,
  is_active: true,
});

/** Shared RTL-aware toggle switch track classes */
const TOGGLE_TRACK =
  "w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600";

type PaymentProviderKey =
  | 'mada'
  | 'apple'
  | 'visa'
  | 'stc'
  | 'cod'
  | 'bnpl'
  | 'tabby'
  | 'tamara'
  | 'moyasar'
  | 'tap'
  | 'hyperpay'
  | 'stripe'
  | 'paytabs';

interface PaymentMethodCardConfig {
  key: PaymentProviderKey;
  name: string;
  sub: string;
  logo: React.ReactNode;
  desc: string;
  badge: string;
  badgeCls: string;
  gatewayType: 'moyasar' | 'tap' | 'hyperpay' | 'stripe' | 'paypal' | 'tabby' | 'tamara' | 'cod';
}

function maskSecret(value?: string | null): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.length <= 8) return '••••••••';
  return `${raw.slice(0, 4)}••••••••${raw.slice(-4)}`;
}

function buildPaymentWebhookUrl(origin: string, provider: string, storeId: string): string {
  return `${origin}/api/webhooks/payments/${provider}?store_id=${encodeURIComponent(storeId)}`;
}

export const StorePayments: React.FC = () => {
  const {
    activeStore,
    currentOrders,
    currentPaymentGateways,
    currentPaymentTransactions,
    savePaymentGatewayConfig,
    testPaymentGatewayConfig,
    refundPaymentOrder,
  } = useTenant();
  const { money, t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<PaymentHubSubTab>('transactions');

  useEffect(() => {
    const applyView = (view: string | null | undefined) => {
      if (!view) return;
      const allowed: PaymentHubSubTab[] = ['transactions', 'gateways', 'bank_accounts', 'fees'];
      if (allowed.includes(view as PaymentHubSubTab)) {
        setActiveSubTab(view as PaymentHubSubTab);
      }
    };
    const handlePaymentsView = (e: Event) => {
      applyView((e as CustomEvent<string>).detail);
    };
    window.addEventListener('unityteck-payments-view', handlePaymentsView);
    try {
      const saved = sessionStorage.getItem('unityteck-payments-view');
      applyView(saved);
      if (saved) sessionStorage.removeItem('unityteck-payments-view');
    } catch {
      /* storage may be unavailable */
    }
    return () => window.removeEventListener('unityteck-payments-view', handlePaymentsView);
  }, []);

  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);
  const [txSortKey, setTxSortKey] = useState<string | null>('date');
  const [txSortDir, setTxSortDir] = useState<'asc' | 'desc'>('desc');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Modal for gateway API credentials configuration
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderKey>('mada');
  const [gatewayTitle, setGatewayTitle] = useState('');
  const [gatewayMerchantId, setGatewayMerchantId] = useState('');
  const [gatewayPublicKey, setGatewayPublicKey] = useState('');
  const [gatewaySecretKey, setGatewaySecretKey] = useState('');
  const [gatewayWebhookSecret, setGatewayWebhookSecret] = useState('');
  const [gatewayIsSandbox, setGatewayIsSandbox] = useState(false);
  const [gatewayFeePct, setGatewayFeePct] = useState('1.5');
  const [gatewayFeeFixed, setGatewayFeeFixed] = useState('1.0');
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Method toggles — default off until live gateway rows say otherwise (zero mock)
  const [madaEnabled, setMadaEnabled] = useState(false);
  const [applePayEnabled, setApplePayEnabled] = useState(false);
  const [visaEnabled, setVisaEnabled] = useState(false);
  const [stcPayEnabled, setStcPayEnabled] = useState(false);
  const [codEnabled, setCodEnabled] = useState(false);
  const [bnplEnabled, setBnplEnabled] = useState(false);
  const [tabbyEnabled, setTabbyEnabled] = useState(false);
  const [tamaraEnabled, setTamaraEnabled] = useState(false);
  const [showTamaraModal, setShowTamaraModal] = useState(false);
  const [savingTamara, setSavingTamara] = useState(false);

  // Payment Offers / Fee structure
  const [feePercent, setFeePercent] = useState('1.5');
  const [feeFixed, setFeeFixed] = useState('1');

  // Real store bank accounts (API only — no mock IBAN rows)
  const [bankAccounts, setBankAccounts] = useState<StoreBankAccountRow[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksBusy, setBanksBusy] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBankRow, setEditingBankRow] = useState<StoreBankAccountRow | null>(null);
  const [bankForm, setBankForm] = useState<StoreBankAccountPayload>(emptyBankForm);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [bankProofs, setBankProofs] = useState<BankTransferProofRow[]>([]);
  const [proofsLoading, setProofsLoading] = useState(false);
  const [proofBusyId, setProofBusyId] = useState<string | null>(null);

  const loadBankAccounts = useCallback(async () => {
    if (!activeStore?.id) {
      setBankAccounts([]);
      return;
    }
    setBanksLoading(true);
    try {
      const rows = await fetchStoreBankAccountsApi(activeStore.id);
      setBankAccounts(Array.isArray(rows) ? rows : []);
    } catch {
      setBankAccounts([]);
    } finally {
      setBanksLoading(false);
    }
  }, [activeStore?.id]);

  const loadBankProofs = useCallback(async () => {
    if (!activeStore?.id) {
      setBankProofs([]);
      return;
    }
    setProofsLoading(true);
    try {
      const res = await fetchBankTransferProofs(activeStore.id);
      setBankProofs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBankProofs([]);
    } finally {
      setProofsLoading(false);
    }
  }, [activeStore?.id]);

  useEffect(() => {
    void loadBankAccounts();
  }, [loadBankAccounts]);

  useEffect(() => {
    void loadBankProofs();
  }, [loadBankProofs]);

  useEffect(() => {
    const byProvider = (provider: string) =>
      currentPaymentGateways.find((g) => String(g.provider) === provider);
    const moyasar = byProvider('moyasar');
    const stripe = byProvider('stripe');
    const cod = byProvider('cod');
    const tabby = byProvider('tabby');
    const tamara = byProvider('tamara');
    setMadaEnabled(Boolean(moyasar?.isEnabled));
    setApplePayEnabled(Boolean(moyasar?.isEnabled));
    setStcPayEnabled(Boolean(moyasar?.isEnabled));
    setVisaEnabled(Boolean(stripe?.isEnabled));
    setCodEnabled(Boolean(cod?.isEnabled));
    setTabbyEnabled(Boolean(tabby?.isEnabled));
    setTamaraEnabled(Boolean(tamara?.isEnabled));
    setBnplEnabled(Boolean(tabby?.isEnabled || tamara?.isEnabled));
  }, [currentPaymentGateways]);

  const openCreateBankModal = () => {
    setEditingBankRow(null);
    setBankForm(emptyBankForm());
    setShowBankModal(true);
  };

  const openEditBankModal = (row: StoreBankAccountRow) => {
    setEditingBankRow(row);
    setBankForm({
      bank_name: row.bank_name || '',
      account_title: row.account_title || '',
      iban: row.iban || '',
      account_number: row.account_number || '',
      payment_reference_prefix: row.payment_reference_prefix || '',
      is_default: Boolean(row.is_default),
      is_active: row.is_active !== false,
    });
    setShowBankModal(true);
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id) return;
    const payload: StoreBankAccountPayload = {
      bank_name: bankForm.bank_name.trim(),
      account_title: bankForm.account_title.trim(),
      iban: bankForm.iban.trim().replace(/\s+/g, '').toUpperCase(),
      account_number: bankForm.account_number?.trim() || null,
      payment_reference_prefix: bankForm.payment_reference_prefix?.trim() || null,
      is_default: Boolean(bankForm.is_default),
      is_active: bankForm.is_active !== false,
    };
    if (!payload.bank_name || !payload.account_title || !payload.iban) {
      toast(
        isAr ? 'يرجى تعبئة اسم البنك واسم الحساب والآيبان' : 'Bank name, account title, and IBAN are required',
        'error',
      );
      return;
    }
    setBanksBusy(true);
    try {
      if (editingBankRow) {
        await updateStoreBankAccountApi(activeStore.id, editingBankRow.id, payload);
        toast(isAr ? 'تم تحديث الحساب البنكي' : 'Bank account updated', 'success');
      } else {
        await createStoreBankAccountApi(activeStore.id, payload);
        toast(isAr ? 'تم إضافة الحساب البنكي' : 'Bank account added', 'success');
      }
      setShowBankModal(false);
      setEditingBankRow(null);
      setBankForm(emptyBankForm());
      await loadBankAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast(
        msg || (isAr ? 'تعذر حفظ الحساب البنكي' : 'Could not save bank account'),
        'error',
      );
    } finally {
      setBanksBusy(false);
    }
  };

  const handleDeleteBankAccount = async (row: StoreBankAccountRow) => {
    if (!activeStore?.id) return;
    setBanksBusy(true);
    try {
      await deleteStoreBankAccountApi(activeStore.id, row.id);
      toast(isAr ? 'تم حذف الحساب البنكي' : 'Bank account deleted', 'success');
      await loadBankAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast(
        msg || (isAr ? 'تعذر حذف الحساب البنكي' : 'Could not delete bank account'),
        'error',
      );
    } finally {
      setBanksBusy(false);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    toast(
      isAr
        ? 'احفظ الرسوم من إعداد كل بوابة دفع.'
        : 'Save fees inside each gateway Config panel.',
      'info',
    );
  };

  // Real payment transactions from DB — enrich with this store's orders (customer / tracking / invoice)
  const payouts = useMemo(() => {
    const orderById = new Map((currentOrders || []).map((o) => [o.id, o]));
    const orderByNumber = new Map(
      (currentOrders || []).map((o) => [String(o.orderNumber || '').toLowerCase(), o]),
    );
    const statusLabel = (raw: string) => {
      const s = String(raw || '').toLowerCase();
      if (isAr) {
        if (s === 'paid') return 'مدفوع';
        if (s === 'pending' || s === 'authorized') return 'قيد المعالجة';
        if (s === 'failed') return 'فشل';
        if (s === 'cancelled' || s === 'canceled') return 'ملغي';
        if (s.includes('refund')) return 'مسترجع';
        return raw || 'غير محدد';
      }
      if (s.includes('refund')) return 'Refunded';
      if (s === 'paid') return 'Paid';
      if (s === 'pending' || s === 'authorized') return 'Pending';
      if (s === 'failed') return 'Failed';
      return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Pending';
    };

    const fromTx: PaymentPayoutRow[] = (currentPaymentTransactions || []).map((tx) => {
      const order =
        (tx.orderId ? orderById.get(tx.orderId) : undefined) ||
        (tx.orderNumber ? orderByNumber.get(String(tx.orderNumber).toLowerCase()) : undefined);
      const providerStr = String(tx.gatewayProvider || tx.paymentMethod || (isAr ? 'بوابة' : 'Gateway')).toUpperCase();
      const methodStr = String(tx.cardBrand || tx.paymentMethod || (isAr ? 'بطاقة' : 'Card'));
      const dateRaw = tx.createdAt || '';
      return {
        id: tx.transactionReference || tx.id,
        txId: tx.id,
        date: dateRaw
          ? new Date(dateRaw).toLocaleString(isAr ? 'ar-SA' : 'en-GB')
          : isAr
            ? 'بدون تاريخ'
            : 'No date',
        dateRaw,
        amount: Number(tx.amount || 0),
        fee: Number(tx.feeAmount || 0),
        net: Number(tx.netAmount || tx.amount || 0),
        method: tx.paymentMethod || (isAr ? 'غير محدد' : 'Unspecified'),
        gateway: tx.gatewayProvider || '—',
        destination: `${providerStr} (${methodStr})`,
        status: statusLabel(String(tx.status || 'pending')),
        statusRaw: String(tx.status || 'pending').toLowerCase(),
        ref: tx.gatewayTransactionId || tx.transactionReference || tx.id,
        isRefundable: String(tx.status || '').toLowerCase() === 'paid',
        orderId: tx.orderId || order?.id,
        orderNumber:
          tx.orderNumber ||
          order?.orderNumber ||
          (tx.orderId ? `#${String(tx.orderId).slice(-8)}` : '—'),
        customerName: tx.payerName || order?.customerName || (isAr ? '—' : '—'),
        customerPhone: tx.payerPhone || order?.customerPhone || '',
        trackingNumber: tx.trackingNumber || order?.trackingNumber || '',
      };
    });

    // Bridge recent orders that still lack a payment_transactions row (zero-mock — real order fields only)
    const covered = new Set(fromTx.map((r) => r.orderId).filter(Boolean));
    (currentOrders || []).forEach((ord) => {
      if (!ord?.id || covered.has(ord.id) || ord.status === 'cancelled') return;
      const payRaw = String((ord as any).paymentStatus || (ord as any).payment_status || 'pending').toLowerCase();
      const dateRaw = ord.createdAt || ord.date || '';
      fromTx.push({
        id: `ordpay-${ord.id}`,
        txId: `ordpay-${ord.id}`,
        date: dateRaw
          ? new Date(dateRaw).toLocaleString(isAr ? 'ar-SA' : 'en-GB')
          : isAr
            ? 'بدون تاريخ'
            : 'No date',
        dateRaw: String(dateRaw || ''),
        amount: Number(ord.total || (ord as any).totalAmount || 0),
        fee: 0,
        net: Number(ord.total || (ord as any).totalAmount || 0),
        method: ord.paymentMethod || (isAr ? 'غير محدد' : 'Unspecified'),
        gateway: '—',
        destination: String(ord.paymentMethod || (isAr ? 'طلب' : 'Order')),
        status: statusLabel(payRaw.includes('paid') || payRaw === 'completed' ? 'paid' : payRaw || 'pending'),
        statusRaw: payRaw.includes('paid') || payRaw === 'completed' ? 'paid' : payRaw || 'pending',
        ref: ord.orderNumber || ord.id,
        isRefundable: false,
        orderId: ord.id,
        orderNumber: ord.orderNumber || `#${ord.id.slice(-8)}`,
        customerName: ord.customerName || '—',
        customerPhone: ord.customerPhone || '',
        trackingNumber: ord.trackingNumber || '',
      });
    });

    return fromTx;
  }, [currentPaymentTransactions, currentOrders, isAr]);

  const filteredPayouts = useMemo(() => {
    let rows = payouts.slice();
    if (txStatusFilter !== 'all') {
      rows = rows.filter((r) => {
        const s = r.statusRaw;
        if (txStatusFilter === 'refunded') return s.includes('refund');
        if (txStatusFilter === 'pending') return s === 'pending' || s === 'authorized';
        if (txStatusFilter === 'failed') return s === 'failed' || s === 'cancelled' || s === 'canceled';
        return s === txStatusFilter;
      });
    }
    if (txDateFrom || txDateTo) {
      rows = rows.filter((r) => {
        const ts = Date.parse(r.dateRaw);
        if (!Number.isFinite(ts)) return false;
        if (txDateFrom) {
          const fromTs = Date.parse(txDateFrom);
          if (Number.isFinite(fromTs) && ts < fromTs) return false;
        }
        if (txDateTo) {
          const toTs = Date.parse(txDateTo) + 86_400_000 - 1;
          if (Number.isFinite(toTs) && ts > toTs) return false;
        }
        return true;
      });
    }
    if (txSearch.trim()) {
      const q = txSearch.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.ref.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.orderNumber.toLowerCase().includes(q) ||
          r.method.toLowerCase().includes(q) ||
          r.gateway.toLowerCase().includes(q) ||
          (r.trackingNumber || '').toLowerCase().includes(q) ||
          (r.customerPhone || '').includes(q),
      );
    }
    if (txSortKey) {
      rows.sort((a, b) => {
        const dir = txSortDir === 'asc' ? 1 : -1;
        const av = (a as any)[txSortKey === 'date' ? 'dateRaw' : txSortKey];
        const bv = (b as any)[txSortKey === 'date' ? 'dateRaw' : txSortKey];
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av || '').localeCompare(String(bv || '')) * dir;
      });
    }
    return rows;
  }, [payouts, txStatusFilter, txDateFrom, txDateTo, txSearch, txSortKey, txSortDir]);

  const pagedPayouts = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return filteredPayouts.slice(start, start + txPageSize);
  }, [filteredPayouts, txPage, txPageSize]);

  useEffect(() => {
    setTxPage(1);
  }, [txSearch, txStatusFilter, txDateFrom, txDateTo, txPageSize]);

  const openInvoiceForRow = useCallback(
    (row: PaymentPayoutRow) => {
      const order =
        (row.orderId ? (currentOrders || []).find((o) => o.id === row.orderId) : undefined) ||
        (currentOrders || []).find((o) => o.orderNumber === row.orderNumber);
      if (!order) {
        toast(
          isAr ? 'لا يوجد طلب مرتبط بهذه المعاملة لعرض الفاتورة' : 'No linked order found for invoice',
          'error',
        );
        return;
      }
      setInvoiceOrder(order);
    },
    [currentOrders, isAr, toast],
  );

  const methodsList: PaymentMethodCardConfig[] = [
    // 1. Mada
    {
      key: 'mada',
      name: isAr ? 'مدى' : 'Mada',
      sub: isAr ? 'بطاقة مدى السعودية' : 'National Saudi Debit',
      gatewayType: 'moyasar',
      logo: <PaymentLogoTile src={PAYMENT_METHOD_LOGO.mada} alt="Mada" />,
      desc: isAr
        ? 'اقبل بطاقات مدى من أكثر من 30 بنكاً سعودياً، بأقل رسوم معالجة وتسوية فورية تلقائية.'
        : 'Accept all 30+ Saudi retail bank debit cards. Lowest merchant processing fees with instant auto-settlement.',
      badge: isAr ? 'تسوية تلقائية عبر ساما' : 'Auto-settled via SAMA',
      badgeCls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    },
    // 2. Apple Pay
    {
      key: 'apple',
      name: 'Apple Pay',
      sub: isAr ? 'دفع بلمسة واحدة عبر أجهزة آبل' : 'iOS Biometric 1-Tap',
      gatewayType: 'moyasar',
      logo: <PaymentLogoTile src={PAYMENT_METHOD_LOGO.apple} alt="Apple Pay" />,
      desc: isAr
        ? 'أكثر من 68% من المتسوقين السعوديين عبر الجوال يُتمّون الشراء عبر دفع آبل. دفع سريع بالبصمة دون إدخال بيانات البطاقة.'
        : 'Over 68% of Saudi mobile shoppers convert with Apple Pay. Fast biometric checkout with zero card entry friction.',
      badge: isAr ? 'معرّف تاجر آبل مفعّل' : 'Apple Merchant ID Active',
      badgeCls: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10',
    },
    // 3. Visa / Mastercard
    {
      key: 'visa',
      name: 'Visa/Mastercard',
      sub: isAr ? 'بطاقات ائتمان ومدى عالمية' : 'Global Credit & Debit',
      gatewayType: 'stripe',
      logo: <PaymentLogoTile src={PAYMENT_METHOD_LOGO.visa} alt="Visa" />,
      desc: isAr
        ? 'قبول البطاقات حول العالم للهدايا الدولية والمشترين من الخارج الذين يرسلون الزهور إلى المملكة.'
        : 'Worldwide card acceptance for international gifts and overseas buyers sending flowers to Saudi Arabia.',
      badge: isAr ? 'التحقق الآمن بمصادقة ثلاثية الأبعاد مفعّل' : '3D Secure 2.0 Enabled',
      badgeCls: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10',
    },
    // 4. STC Pay
    {
      key: 'stc',
      name: 'STC Pay',
      sub: isAr ? 'محفظة رقمية عبر الجوال' : 'Digital Mobile Wallet',
      gatewayType: 'moyasar',
      logo: <PaymentLogoTile src={PAYMENT_METHOD_LOGO.stc} alt="STC Pay" />,
      desc: isAr
        ? 'تواصل مع أكثر من 8 ملايين مستخدم نشط لـ إس تي سي باي في المملكة. دفع فوري عبر رمز QR أو رمز التحقق.'
        : 'Connect to 8+ million active Saudi STC Pay users. Instant direct QR and OTP mobile checkout.',
      badge: isAr ? 'معرّف التاجر مرتبط' : 'Merchant ID Linked',
      badgeCls: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10',
    },
    // 5. Cash on Delivery
    {
      key: 'cod',
      name: isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery',
      sub: isAr ? 'الدفع للمندوب عند الباب' : 'Pay Courier at Doorstep',
      gatewayType: 'cod',
      logo: (
        <PaymentLogoTile
          alt={isAr ? 'الدفع عند الاستلام' : 'COD'}
          fallback={<Coins className="w-5 h-5 text-slate-800" strokeWidth={2.25} aria-hidden />}
        />
      ),
      desc: isAr
        ? 'يدفع العملاء نقداً مباشرةً لمندوب سمسا أو أرامكس أو شركات توصيل الزهور المبرّدة المحلية في مكة.'
        : 'Customers hand cash directly to SMSA Express, Aramex, or Makkah local refrigerated flower couriers.',
      badge: isAr ? 'تحويل مبالغ المندوب مفعّل' : 'Courier Remittance Enabled',
      badgeCls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    },
    // 6. Tabby BNPL
    {
      key: 'tabby',
      name: isAr ? 'تابي' : 'Tabby',
      sub: isAr ? 'التقسيط على 4 دفعات' : 'Split in 4 installments',
      gatewayType: 'tabby',
      logo: <PaymentLogoTile src={PAYMENT_METHOD_LOGO.tabby} alt="Tabby" />,
      desc: isAr
        ? 'قسّم مشتريات العملاء على 4 دفعات شهرية بدون فوائد عبر تابي، ويستلم التاجر المبلغ كاملاً مقدماً.'
        : 'Split purchases into 4 interest-free monthly payments via Tabby. Merchant is paid in full upfront.',
      badge: isAr ? 'اشتر الآن وادفع لاحقاً' : 'Buy now, pay later',
      badgeCls: 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10',
    },
    // 7. Tamara BNPL (full connect modal)
    {
      key: 'tamara',
      name: isAr ? 'تمارا' : 'Tamara',
      sub: isAr ? 'قسّم فاتورتك على 4 دفعات' : 'Split your bill into 4 payments',
      gatewayType: 'tamara',
      logo: <PaymentLogoTile src={PAYMENT_METHOD_LOGO.tamara} alt="Tamara" />,
      desc: isAr
        ? 'ربط تمارا بمفتاح التاجر والمفتاح العام، مع خيار إظهار الشعار في صفحة المنتج وتقسيط متوافق مع الشريعة.'
        : 'Connect Tamara with merchant + public keys, optional product-page logo, and Sharia-compliant installments.',
      badge: isAr ? 'متوافقة مع الشريعة' : 'Sharia compliant',
      badgeCls: 'text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10',
    },
  ];

  const resolveGatewayForMethod = useCallback(
    (method: PaymentMethodCardConfig) =>
      currentPaymentGateways.find(
        (g) =>
          String(g.provider) === method.gatewayType ||
          String(g.provider) === method.key ||
          (method.key === 'stc' && String(g.provider) === 'stcpay'),
      ),
    [currentPaymentGateways],
  );

  const accountLabelForGateway = (method: PaymentMethodCardConfig) => {
    const gw = resolveGatewayForMethod(method);
    if (!gw) return isAr ? 'غير مضبوط' : 'Not set';
    const masked = maskSecret(gw.publicKey) || maskSecret(gw.maskedSecretKey);
    if (masked) return masked;
    if (method.gatewayType === 'cod') return isAr ? 'الدفع عند الاستلام' : 'Cash on delivery';
    return gw.title || (isAr ? 'محفوظ' : 'Saved');
  };

  const connectionBadge = (method: PaymentMethodCardConfig) => {
    const gw = resolveGatewayForMethod(method);
    const status = gw?.status;
    if (status === 'connected') {
      return {
        label: isAr ? 'متصل' : 'Connected',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      };
    }
    if (status === 'error') {
      return {
        label: isAr ? 'خطأ' : 'Error',
        cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      };
    }
    return {
      label: isAr ? 'غير متصل' : 'Not Connected',
      cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    };
  };

  const keyDisplayForGateway = (method: PaymentMethodCardConfig) => {
    const gw = resolveGatewayForMethod(method);
    const masked = maskSecret(gw?.publicKey) || maskSecret(gw?.maskedSecretKey);
    if (!masked) return isAr ? 'لا يوجد مفتاح محفوظ' : 'No key saved';
    return masked;
  };

  const webhookUrlForMethod = (method: PaymentMethodCardConfig) => {
    const gw = resolveGatewayForMethod(method);
    if (gw?.webhookUrl) return gw.webhookUrl;
    if (!activeStore?.id) return '';
    return buildPaymentWebhookUrl(window.location.origin, method.gatewayType, activeStore.id);
  };

  const getMethodEnabled = (k: PaymentProviderKey): boolean => {
    switch (k) {
      case 'mada':
        return madaEnabled;
      case 'apple':
        return applePayEnabled;
      case 'visa':
        return visaEnabled;
      case 'stc':
        return stcPayEnabled;
      case 'cod':
        return codEnabled;
      case 'bnpl':
        return bnplEnabled;
      case 'tabby':
        return tabbyEnabled;
      case 'tamara':
        return tamaraEnabled;
      default:
        return true;
    }
  };

  const getMethodSetter = (k: PaymentProviderKey) => {
    switch (k) {
      case 'mada':
        return setMadaEnabled;
      case 'apple':
        return setApplePayEnabled;
      case 'visa':
        return setVisaEnabled;
      case 'stc':
        return setStcPayEnabled;
      case 'cod':
        return setCodEnabled;
      case 'bnpl':
        return setBnplEnabled;
      case 'tabby':
        return setTabbyEnabled;
      case 'tamara':
        return setTamaraEnabled;
      default:
        return () => {};
    }
  };

  const tamaraGateway = useMemo(
    () => currentPaymentGateways.find((g) => g.provider === 'tamara'),
    [currentPaymentGateways],
  );

  const tamaraModalInitial: TamaraGatewayFormState = useMemo(
    () => ({
      merchantKey: '',
      publicKey: tamaraGateway?.publicKey || '',
      isSandbox: tamaraGateway?.isSandbox ?? false,
      showProductLogo: tamaraGateway?.showProductLogo !== false,
      policyAccepted: Boolean(
        tamaraGateway?.supportedMethods?.includes('policy_accepted') ||
          tamaraGateway?.status === 'connected',
      ),
    }),
    [tamaraGateway],
  );

  const handleConfigureMethodOrGateway = (method: PaymentMethodCardConfig) => {
    if (method.key === 'tamara' || method.gatewayType === 'tamara') {
      setShowTamaraModal(true);
      return;
    }

    // COD needs no API keys — enable/persist via real gateway row
    if (method.gatewayType === 'cod') {
      void (async () => {
        const res = await savePaymentGatewayConfig({
          provider: 'cod',
          title: isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery',
          titleAr: 'الدفع عند الاستلام',
          isEnabled: true,
          isSandbox: false,
          transactionFeePercent: 0,
          transactionFeeFixed: 0,
          supportedMethods: ['cod'],
        });
        if (res?.success) {
          setCodEnabled(true);
          toast(
            isAr ? 'تم تفعيل الدفع عند الاستلام' : 'Cash on delivery enabled',
            'success',
          );
        } else {
          toast(
            res?.message ||
              (isAr ? 'تعذر تفعيل الدفع عند الاستلام' : 'Could not enable cash on delivery'),
            'error',
          );
        }
      })();
      return;
    }

    setSelectedProvider(method.key);
    setGatewayTitle(method.name);

    const existing = resolveGatewayForMethod(method);

    // Zero-mock: never invent placeholder merchant IDs / API keys
    setGatewayMerchantId('');
    if (existing) {
      setGatewayPublicKey(existing.publicKey || '');
      setGatewayIsSandbox(existing.isSandbox);
      setGatewayFeePct(existing.transactionFeePercent.toString());
      setGatewayFeeFixed(existing.transactionFeeFixed.toString());
      setGatewaySecretKey('');
      setGatewayWebhookSecret('');
    } else {
      setGatewayPublicKey('');
      setGatewayIsSandbox(false);
      setGatewayFeePct('1.5');
      setGatewayFeeFixed('1.0');
      setGatewaySecretKey('');
      setGatewayWebhookSecret('');
    }
    setShowGatewayModal(true);
  };

  const handleSaveTamara = async (next: TamaraGatewayFormState) => {
    setSavingTamara(true);
    try {
      const res = await savePaymentGatewayConfig({
        provider: 'tamara',
        title: 'Tamara',
        titleAr: 'تمارا',
        apiKey: next.merchantKey,
        secretKey: next.merchantKey,
        publicKey: next.publicKey,
        isSandbox: next.isSandbox,
        isEnabled: true,
        showProductLogo: next.showProductLogo,
        supportedMethods: [
          'tamara',
          ...(next.showProductLogo ? ['show_product_logo'] : []),
          ...(next.policyAccepted ? ['policy_accepted'] : []),
        ],
        transactionFeePercent: 0,
        transactionFeeFixed: 0,
      });
      if (res?.success) {
        setTamaraEnabled(true);
        setShowTamaraModal(false);
        toast(
          isAr ? 'تم ربط تمارا وحفظ الإعدادات بنجاح' : 'Tamara connected and settings saved',
          'success',
        );
      } else {
        toast(
          res?.message ||
            (isAr
              ? 'تعذر التحقق من مفاتيح تمارا. راجع المفاتيح وحاول مرة أخرى.'
              : 'Could not verify Tamara keys. Check credentials and try again.'),
          'error',
        );
      }
    } catch {
      toast(isAr ? 'فشل حفظ إعدادات تمارا' : 'Failed to save Tamara settings', 'error');
    } finally {
      setSavingTamara(false);
    }
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedConfig = methodsList.find((m) => m.key === selectedProvider);
    const resolvedGatewayType = matchedConfig?.gatewayType || 'moyasar';

    try {
      const res = await savePaymentGatewayConfig({
        provider: resolvedGatewayType,
        title: gatewayTitle,
        apiKey: gatewayMerchantId.trim() || undefined,
        publicKey: gatewayPublicKey,
        secretKey: gatewaySecretKey,
        webhookSecret: gatewayWebhookSecret.trim() || undefined,
        isSandbox: gatewayIsSandbox,
        transactionFeePercent: parseFloat(gatewayFeePct) || 1.5,
        transactionFeeFixed: parseFloat(gatewayFeeFixed) || 1.0,
        isEnabled: true,
        supportedMethods: matchedConfig ? [matchedConfig.key, resolvedGatewayType] : [resolvedGatewayType],
      });

      if (res?.success) {
        setShowGatewayModal(false);
        toast(
          isAr
            ? `تم ربط وتفعيل إعدادات ${gatewayTitle} بنجاح`
            : `Payment provider ${gatewayTitle} credentials saved and connected`,
          'success',
        );
      } else {
        toast(
          res?.message ||
            (isAr
              ? 'تم الحفظ لكن فشل التحقق من الاتصال. راجع المفاتيح.'
              : 'Saved but connection test failed. Check credentials.'),
          'error',
        );
      }
    } catch {
      toast(
        isAr ? 'فشل حفظ إعدادات بوابة الدفع' : 'Failed to save payment gateway settings',
        'error',
      );
    }
  };

  const handleTestGatewayApi = async (providerKey: PaymentProviderKey, name: string) => {
    setIsTestingGateway(true);
    const matchedConfig = methodsList.find((m) => m.key === providerKey);
    const gateway = matchedConfig ? resolveGatewayForMethod(matchedConfig) : undefined;

    try {
      if (!gateway?.id) {
        toast(
          isAr
            ? `بوابة ${name} غير متصلة. احفظ المفاتيح أولاً ثم أعد الفحص.`
            : `${name} is not connected. Save credentials first, then test again.`,
          'error',
        );
        return;
      }
      const res = await testPaymentGatewayConfig(gateway.id);
      if (res?.success) {
        toast(
          res.message ||
            (isAr ? `تم التحقق من اتصال ${name} بنجاح` : `${name} connection verified`),
          'success',
        );
      } else {
        toast(
          res?.message ||
            (isAr ? `فشل التحقق من اتصال ${name}` : `${name} connection test failed`),
          'error',
        );
      }
    } catch {
      toast(
        isAr ? `فشل التحقق من اتصال ${name}` : `${name} connection test failed`,
        'error',
      );
    } finally {
      setIsTestingGateway(false);
    }
  };

  const handleCopyWebhook = async (method: PaymentMethodCardConfig) => {
    const gw = resolveGatewayForMethod(method);
    if (!gw || gw.status !== 'connected') {
      toast(
        isAr
          ? 'اربط البوابة أولاً ثم انسخ رابط الإشعارات'
          : 'Connect the gateway first, then copy the webhook URL',
        'info',
      );
      return;
    }
    const url = webhookUrlForMethod(method);
    if (!url) {
      toast(isAr ? 'لا يوجد رابط إشعارات' : 'No webhook URL available', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedWebhook(true);
      window.setTimeout(() => setCopiedWebhook(false), 2000);
      toast(isAr ? 'تم نسخ رابط الإشعارات' : 'Webhook URL copied', 'info');
    } catch {
      toast(isAr ? 'تعذر نسخ الرابط' : 'Could not copy webhook URL', 'error');
    }
  };

  const handleRefund = useCallback(
    async (transactionId?: string, amount?: number) => {
      if (!transactionId || String(transactionId).startsWith('ordpay-')) {
        toast(
          isAr ? 'لا يوجد معاملة دفع قابلة للاسترجاع' : 'No refundable payment transaction found',
          'error',
        );
        return;
      }
      if (
        !window.confirm(
          isAr ? 'هل أنت متأكد من استرجاع هذا المبلغ للعميل؟' : 'Are you sure you want to issue a refund for this transaction?',
        )
      ) {
        return;
      }
      try {
        const res = await refundPaymentOrder(transactionId, amount ?? 0, 'Merchant initiated refund');
        if (res?.success !== false) {
          toast(
            isAr ? 'تم استرجاع المبلغ بنجاح عبر بوابة الدفع!' : 'Payment refunded successfully via gateway!',
            'success',
          );
        } else {
          toast(res?.message || (isAr ? 'فشل الاسترجاع' : 'Refund failed'), 'error');
        }
      } catch {
        toast(isAr ? 'فشل الاسترجاع' : 'Failed to issue refund', 'error');
      }
    },
    [isAr, refundPaymentOrder, toast],
  );

  const paymentColumns = useMemo<AdvancedTableColumn<PaymentPayoutRow>[]>(() => {
    return [
      {
        key: 'ref',
        header: isAr ? 'المرجع' : 'Ref',
        sortable: true,
        render: (r) => <span className="font-mono font-bold text-[11px]">{r.id}</span>,
      },
      {
        key: 'date',
        header: isAr ? 'التاريخ' : 'Date',
        sortable: true,
        render: (r) => <span className="text-[11px] text-slate-500">{r.date}</span>,
      },
      {
        key: 'customerName',
        header: isAr ? 'العميل' : 'Customer',
        sortable: true,
        render: (r) => (
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white truncate">{r.customerName}</div>
            {r.customerPhone ? (
              <div className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                {r.customerPhone}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: 'orderNumber',
        header: isAr ? 'الطلب' : 'Order',
        sortable: true,
        render: (r) => <span className="font-bold text-teal-700 dark:text-teal-300">{r.orderNumber}</span>,
      },
      {
        key: 'method',
        header: isAr ? 'طريقة الدفع' : 'Method',
        sortable: true,
        render: (r) => (
          <div>
            <div className="font-bold">{r.method}</div>
            <div className="text-[10px] text-slate-400 uppercase">{r.gateway}</div>
          </div>
        ),
      },
      {
        key: 'trackingNumber',
        header: isAr ? 'التتبع' : 'Tracking',
        render: (r) =>
          r.trackingNumber ? (
            <span className="font-mono text-[11px]">{r.trackingNumber}</span>
          ) : (
            <span className="text-slate-400 text-[11px]">—</span>
          ),
      },
      {
        key: 'amount',
        header: isAr ? 'المبلغ' : 'Amount',
        sortable: true,
        align: 'right',
        render: (r) => <span className="font-black tabular-nums">{money(r.amount)}</span>,
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        align: 'center',
        render: (r) => (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              r.statusRaw === 'paid'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : r.statusRaw.includes('refund')
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : r.statusRaw === 'failed' || r.statusRaw === 'cancelled'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
            }`}
          >
            {r.status}
          </span>
        ),
      },
      {
        key: 'actions',
        header: isAr ? 'الإجراءات' : 'Actions',
        align: 'right',
        render: (r) => (
          <div className="flex items-center justify-end gap-1.5">
            {r.isRefundable && !String(r.txId).startsWith('ordpay-') ? (
              <button
                type="button"
                onClick={() => void handleRefund(r.txId, r.amount)}
                className="px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900 cursor-pointer"
                title={isAr ? 'استرجاع المبلغ' : 'Issue Refund'}
              >
                {isAr ? 'استرجاع' : 'Refund'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openInvoiceForRow(r)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-teal-600 dark:text-teal-400 cursor-pointer"
              title={isAr ? 'عرض الفاتورة' : 'View Invoice'}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ];
  }, [handleRefund, isAr, money, openInvoiceForRow]);

  /** Toggle a payment method — persist is_enabled on real gateway row only */
  const toggleMethod = async (method: PaymentMethodCardConfig, next: boolean) => {
    const gateway = resolveGatewayForMethod(method);
    if (!gateway?.id) {
      if (next) {
        handleConfigureMethodOrGateway(method);
        toast(
          isAr
            ? 'اربط البوابة بمفاتيح حقيقية قبل التفعيل'
            : 'Connect the gateway with real keys before enabling',
          'info',
        );
      }
      return;
    }
    const res = await savePaymentGatewayConfig({
      provider: gateway.provider,
      title: gateway.title,
      titleAr: gateway.titleAr,
      isEnabled: next,
      isSandbox: gateway.isSandbox,
      publicKey: gateway.publicKey,
      supportedMethods: gateway.supportedMethods,
      showProductLogo: gateway.showProductLogo,
      transactionFeePercent: gateway.transactionFeePercent,
      transactionFeeFixed: gateway.transactionFeeFixed,
    });
    if (res?.success === false && next) {
      toast(
        res.message ||
          (isAr ? 'تعذر تفعيل البوابة — تحقق من الاتصال' : 'Could not enable gateway — check connection'),
        'error',
      );
      return;
    }
    const setter = getMethodSetter(method.key);
    setter(next);
    toast(
      next
        ? isAr
          ? `تم تفعيل ${method.name} في صفحة الدفع`
          : `${method.name} enabled at checkout`
        : isAr
          ? `تم إيقاف ${method.name} في صفحة الدفع`
          : `${method.name} disabled at checkout`,
      next ? 'success' : 'info',
    );
  };

  /** Export filtered payment rows as CSV (Excel-safe columns) */
  const exportReceiptsCsv = () => {
    if (!filteredPayouts.length) {
      toast(isAr ? 'لا توجد معاملات للتصدير' : 'No transactions to export', 'info');
      return;
    }
    const header = isAr
      ? ['المرجع', 'التاريخ', 'العميل', 'الطلب', 'طريقة الدفع', 'المبلغ', 'الرسوم', 'الحالة', 'التتبع']
      : ['Ref', 'Date', 'Customer', 'Order', 'Method', 'Amount', 'Fee', 'Status', 'Tracking'];
    const rows = filteredPayouts.map((p) => [
      String(p.id ?? ''),
      String(p.date ?? ''),
      String(p.customerName ?? ''),
      String(p.orderNumber ?? ''),
      String(p.method ?? ''),
      String(p.amount ?? ''),
      String(p.fee ?? ''),
      String(p.status ?? ''),
      String(p.trackingNumber ?? ''),
    ]);
    downloadCsv(
      `payment-transactions-${activeStore.name.replace(/\s+/g, '-').toLowerCase()}.csv`,
      [header, ...rows],
    );
    toast(isAr ? 'تم تصدير معاملات الدفع بنجاح' : 'Payment transactions exported (CSV)', 'success');
  };

  const inputCls =
    'w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500';

  return (
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
      {/* Header bar matching 14_payments.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'المدفوعات' : 'Payments'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'طرق الدفع وبوابات الدفع والعروض' : 'Payment methods, gateways and offers'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleConfigureMethodOrGateway(methodsList[0])}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? '+ ربط بوابة دفع' : '+ Connect Gateway'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>{isAr ? '📘 دليل الاستخدام' : '📘 Docs & Guide'}</span>
          </button>

          <span className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'موثّق من ساما وهيئة الزكاة والضريبة' : 'SAMA & ZATCA Verified'}</span>
          </span>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'transactions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isAr ? 'المعاملات والتتبع المباشر' : 'Transactions & Live Tracking'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('gateways')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'gateways'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'بوابات وطرق الدفع' : 'Payment Gateways & Rails'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bank_accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'bank_accounts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>{isAr ? 'الحسابات البنكية والإثباتات' : 'Bank Accounts & Wire Proofs'}</span>
          {bankProofs.filter((p) => p.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('fees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'fees'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isAr ? 'عروض الدفع وهيكل الرسوم' : 'Offers & Fee Structure'}</span>
        </button>
      </div>

      {/* ── SubTab 1: Transactions & Live Tracking View (Pixel-Perfect Image Twin) ── */}
      {activeSubTab === 'transactions' && (
        <PaymentTransactionsTrackingView
          onNavigateToGateways={() => setActiveSubTab('gateways')}
          onNavigateToBankAccounts={() => setActiveSubTab('bank_accounts')}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: Official Payment Rails (Identical to Shipping Layout)
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'gateways' && (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isAr ? 'طرق وبوابات الدفع الإلكتروني المعتمدة' : 'Official Payment Methods & Gateway Integrations'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'ربط مباشر عبر واجهات برمجة التطبيقات ومفاتيح التاجر للتحقق الفوري من عمليات الشراء.'
                : 'Direct REST API connections for instant merchant settlement, tokenization & webhook callbacks.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleConfigureMethodOrGateway(methodsList[0])}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isAr ? '+ ربط مزود دفع' : '+ Connect Provider'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methodsList.map((m) => {
            const isEnabled = getMethodEnabled(m.key);
            const badge = connectionBadge(m);
            const gw = resolveGatewayForMethod(m);
            const isLive = gw?.status === 'connected' && !gw.isSandbox;

            return (
              <div
                key={m.key}
                className={`p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between space-y-4 transition-all ${
                  isEnabled ? '' : 'opacity-70'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Header: Logo + Title + Status + Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {m.logo}
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">{m.name}</h3>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {isAr ? 'الحساب:' : 'Account:'} {accountLabelForGateway(m)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                        {badge.label}
                      </span>

                      <label
                        className="relative inline-flex items-center cursor-pointer"
                        aria-label={isAr ? `تفعيل ${m.name}` : `Enable ${m.name}`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => void toggleMethod(m, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={TOGGLE_TRACK}></div>
                      </label>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {m.desc}
                  </p>

                  {/* Masked Key Display — real saved key only */}
                  <div className="text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {isAr ? 'المفتاح:' : 'Key:'} {keyDisplayForGateway(m)}
                    </span>
                    <span
                      className={`font-bold uppercase shrink-0 ${
                        isLive
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {isLive
                        ? isAr
                          ? 'مباشر'
                          : 'LIVE'
                        : gw?.isSandbox
                          ? isAr
                            ? 'تجريبي'
                            : 'SANDBOX'
                          : isAr
                            ? 'غير متصل'
                            : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={isTestingGateway}
                    onClick={() => handleTestGatewayApi(m.key, m.name)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {isAr ? 'فحص الاتصال' : 'Test Connection'}
                  </button>

                  <button
                    type="button"
                    disabled={!gw || gw.status !== 'connected'}
                    onClick={() => void handleCopyWebhook(m)}
                    className="px-2.5 py-1 text-[11px] font-bold text-teal-600 hover:text-teal-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {copiedWebhook
                      ? isAr
                        ? 'تم النسخ'
                        : 'Copied'
                      : isAr
                        ? 'رابط الإشعارات'
                        : 'Webhook URL'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfigureMethodOrGateway(m)}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  >
                    {isAr ? 'إعداد' : 'Config'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: Payment Offers & Transaction Fee Structure (14_payments.png)
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'fees' && (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
          {isAr ? 'عروض الدفع وهيكل الرسوم' : 'Payment Offers & Fee Structure'}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {isAr ? 'رسوم المعاملات (⃁):' : 'Transaction Fees (⃁):'}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                dir="ltr"
                value={`${feePercent}% +`}
                onChange={(e) => setFeePercent(e.target.value.replace(/[^0-9.]/g, ''))}
                aria-label={isAr ? 'نسبة رسوم المعاملة' : 'Transaction fee percentage'}
                className="w-24 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-center text-slate-800 dark:text-slate-200"
              />
              <select
                value={feeFixed}
                onChange={(e) => setFeeFixed(e.target.value)}
                aria-label={isAr ? 'الرسوم الثابتة' : 'Fixed fee'}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="1">{isAr ? '1 ⃁' : '⃁ 1'}</option>
                <option value="1.5">{isAr ? '1.5 ⃁' : '⃁ 1.5'}</option>
                <option value="2">{isAr ? '2 ⃁' : '⃁ 2'}</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: Store Bank Accounts (real API, store_id scoped)
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'bank_accounts' && (
      <>
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'الحساب البنكي' : 'Bank Accounts'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'حسابات التحويل البنكي الخاصة بهذا المتجر فقط.'
                : 'Bank transfer accounts for this store only.'}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateBankModal}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-teal-600 hover:bg-teal-500 text-white shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة حساب' : 'Add Account'}</span>
          </button>
        </div>

        {banksLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isAr ? 'جاري التحميل…' : 'Loading…'}</span>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Landmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'لا توجد سجلات' : 'No records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                  <th className="py-2.5 px-3 font-medium text-start">{isAr ? 'اسم البنك' : 'Bank Name'}</th>
                  <th className="py-2.5 px-3 font-medium text-start">{isAr ? 'اسم صاحب الحساب' : 'Account Title'}</th>
                  <th className="py-2.5 px-3 font-medium text-start">{isAr ? 'الآيبان' : 'IBAN'}</th>
                  <th className="py-2.5 px-3 font-medium text-start">{isAr ? 'رقم الحساب' : 'Account Number'}</th>
                  <th className="py-2.5 px-3 font-medium text-start">{isAr ? 'بادئة المرجع' : 'Ref Prefix'}</th>
                  <th className="py-2.5 px-3 font-medium text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-2.5 px-3 font-medium text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {bankAccounts.map((row) => (
                  <tr key={row.id} className="font-semibold">
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{(isAr && row.bank_name_ar) || row.bank_name}</span>
                        {row.is_default ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold">
                            {isAr ? 'افتراضي' : 'Default'}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {(isAr && row.account_title_ar) || row.account_title}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-teal-700 dark:text-teal-300" dir="ltr">
                      {row.iban}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400" dir="ltr">
                      {row.account_number || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400" dir="ltr">
                      {row.payment_reference_prefix || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          row.is_active !== false
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {row.is_active !== false
                          ? isAr
                            ? 'نشط'
                            : 'Active'
                          : isAr
                            ? 'غير نشط'
                            : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={banksBusy}
                          onClick={() => openEditBankModal(row)}
                          className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                          title={commerceTerm('update', isAr)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={banksBusy}
                          onClick={() => void handleDeleteBankAccount(row)}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer disabled:opacity-50"
                          title={commerceTerm('delete', isAr)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3b: Bank transfer proof review (never auto-paid)
      ───────────────────────────────────────────────────────────── */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">
              {isAr ? 'إثباتات التحويل البنكي' : 'Bank Transfer Proofs'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isAr
                ? 'لا يُعلَّم الطلب مدفوعاً إلا بعد موافقتك — مع سجل تدقيق.'
                : 'Orders stay unpaid until you approve — with an audit trail.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBankProofs()}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-500 cursor-pointer flex items-center gap-1"
            disabled={proofsLoading}
            aria-busy={proofsLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${proofsLoading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
        {proofsLoading ? (
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {isAr ? 'جارٍ التحميل…' : 'Loading…'}
          </p>
        ) : bankProofs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            {isAr ? 'لا توجد إثباتات تحويل بعد' : 'No transfer proofs yet'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60">
                <tr>
                  <th className="px-3 py-2 text-start font-bold text-slate-500">{isAr ? 'الطلب' : 'Order'}</th>
                  <th className="px-3 py-2 text-start font-bold text-slate-500">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-3 py-2 text-start font-bold text-slate-500">{isAr ? 'الإثبات' : 'Proof'}</th>
                  <th className="px-3 py-2 text-start font-bold text-slate-500">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="px-3 py-2 text-start font-bold text-slate-500">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {bankProofs.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-mono">{p.order_id || '—'}</td>
                    <td className="px-3 py-2 font-bold">
                      {p.status === 'approved'
                        ? isAr
                          ? 'مقبول'
                          : 'Approved'
                        : p.status === 'rejected'
                          ? isAr
                            ? 'مرفوض'
                            : 'Rejected'
                          : isAr
                            ? 'قيد المراجعة'
                            : 'Pending'}
                    </td>
                    <td className="px-3 py-2">
                      {p.media_url ? (
                        <a
                          href={p.media_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-600 dark:text-teal-400 font-bold underline"
                        >
                          {isAr ? 'عرض' : 'View'}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {p.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={proofBusyId === p.id}
                            className="unity-btn-primary text-[11px] px-2.5 py-1 rounded-lg"
                            onClick={async () => {
                              if (!activeStore?.id) return;
                              setProofBusyId(p.id);
                              try {
                                await approveBankTransferProof(activeStore.id, p.id);
                                toast(
                                  isAr ? 'تمت الموافقة وتم تعليم الطلب مدفوعاً' : 'Approved — order marked paid',
                                  'success',
                                );
                                await loadBankProofs();
                              } catch (e) {
                                toast(e instanceof Error ? e.message : 'Failed', 'error');
                              } finally {
                                setProofBusyId(null);
                              }
                            }}
                          >
                            {isAr ? 'موافقة' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={proofBusyId === p.id}
                            className="text-[11px] px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 font-bold"
                            onClick={async () => {
                              if (!activeStore?.id) return;
                              setProofBusyId(p.id);
                              try {
                                await rejectBankTransferProof(
                                  activeStore.id,
                                  p.id,
                                  isAr ? 'مرفوض من التاجر' : 'Rejected by merchant',
                                );
                                toast(isAr ? 'تم الرفض — الطلب ما زال غير مدفوع' : 'Rejected — order stays unpaid', 'info');
                                await loadBankProofs();
                              } catch (e) {
                                toast(e instanceof Error ? e.message : 'Failed', 'error');
                              } finally {
                                setProofBusyId(null);
                              }
                            }}
                          >
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">
                          {p.reviewed_by || '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {invoiceOrder ? (
        <Suspense fallback={null}>
          <RetailInvoiceModal
            isOpen={!!invoiceOrder}
            onClose={() => setInvoiceOrder(null)}
            order={invoiceOrder}
            store={activeStore}
          />
        </Suspense>
      ) : null}

      {/* Bank Account Add / Edit Modal */}
      {showBankModal && (
        <GlobalModal
          onClose={() => {
            if (banksBusy) return;
            setShowBankModal(false);
            setEditingBankRow(null);
          }}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={
            editingBankRow
              ? isAr
                ? 'تعديل الحساب البنكي'
                : 'Edit Bank Account'
              : isAr
                ? 'إضافة حساب بنكي'
                : 'Add Bank Account'
          }
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 rounded-xl">
                  <Landmark className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingBankRow
                    ? isAr
                      ? 'تعديل الحساب البنكي'
                      : 'Edit Bank Account'
                    : isAr
                      ? 'إضافة حساب بنكي'
                      : 'Add Bank Account'}
                </h3>
              </div>
              <button
                type="button"
                disabled={banksBusy}
                onClick={() => {
                  setShowBankModal(false);
                  setEditingBankRow(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'اسم البنك *' : 'Bank Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'اسم صاحب الحساب *' : 'Account Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.account_title}
                  onChange={(e) => setBankForm((f) => ({ ...f, account_title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'الآيبان *' : 'IBAN *'}
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.iban}
                  onChange={(e) => setBankForm((f) => ({ ...f, iban: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  dir="ltr"
                  placeholder={isAr ? 'SA…' : 'SA…'}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'رقم الحساب' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    value={bankForm.account_number || ''}
                    onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'بادئة مرجع الدفع' : 'Payment Reference Prefix'}
                  </label>
                  <input
                    type="text"
                    value={bankForm.payment_reference_prefix || ''}
                    onChange={(e) =>
                      setBankForm((f) => ({ ...f, payment_reference_prefix: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(bankForm.is_default)}
                    onChange={(e) => setBankForm((f) => ({ ...f, is_default: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <span>{isAr ? 'افتراضي' : 'Default'}</span>
                </label>
                <label className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankForm.is_active !== false}
                    onChange={(e) => setBankForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <span>{isAr ? 'نشط' : 'Active'}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={banksBusy}
                  onClick={() => {
                    setShowBankModal(false);
                    setEditingBankRow(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 cursor-pointer disabled:opacity-50"
                >
                  {commerceTerm('cancel', isAr)}
                </button>
                <button
                  type="submit"
                  disabled={banksBusy}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {banksBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{commerceTerm('saveChanges', isAr)}</span>
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PAYMENT GATEWAY CONFIGURATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {showGatewayModal && (
        <GlobalModal
          onClose={() => setShowGatewayModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? `إعدادات بوابة${gatewayTitle}` : `Configure ${gatewayTitle} API`}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {isAr ? `إعدادات بوابة${gatewayTitle}` : `Configure ${gatewayTitle} API`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? 'ربط رسمي ومفاتيح مشفرة ومحمية وفق أنظمة مؤسسة النقد العربي السعودي'
                      : 'Encrypted store credentials for live payment settlement'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGatewayModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'معرّف التاجر / الحساب' : 'Merchant / Account ID'}
                  </label>
                  <input
                    type="text"
                    value={gatewayMerchantId}
                    onChange={(e) => setGatewayMerchantId(e.target.value)}
                    placeholder={isAr ? 'معرّف التاجر من مزود الدفع' : 'Merchant ID from your provider'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'بيئة التشغيل' : 'Environment Mode'}
                  </label>
                  <select
                    value={gatewayIsSandbox ? 'sandbox' : 'live'}
                    onChange={(e) => setGatewayIsSandbox(e.target.value === 'sandbox')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="live">{isAr ? '🟢 إنتاج حقيقي' : '🟢 Live Production'}</option>
                    <option value="sandbox">{isAr ? '🟡 وضع الاختبار التجريبي' : '🟡 Sandbox Test'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'المفتاح العام *' : 'Public API Key / Publishable Key *'}
                </label>
                <input
                  type="text"
                  required
                  value={gatewayPublicKey}
                  onChange={(e) => setGatewayPublicKey(e.target.value)}
                  placeholder="e.g. pk_live_... or pk_test_..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'المفتاح السري (مشفر على الخادم) *' : 'Secret Key / Private Token *'}
                </label>
                <input
                  type="password"
                  required
                  value={gatewaySecretKey}
                  onChange={(e) => setGatewaySecretKey(e.target.value)}
                  placeholder="sk_live_••••••••••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  dir="ltr"
                />
              </div>

              {/* Webhook Endpoint */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'رابط الإشعارات اللحظية:' : 'Live Webhook IPN Endpoint:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const matched = methodsList.find((m) => m.key === selectedProvider);
                      const provider = matched?.gatewayType || selectedProvider;
                      const url = buildPaymentWebhookUrl(
                        window.location.origin,
                        provider,
                        activeStore.id,
                      );
                      void navigator.clipboard.writeText(url).then(
                        () => {
                          setCopiedWebhook(true);
                          window.setTimeout(() => setCopiedWebhook(false), 2000);
                          toast(isAr ? 'تم نسخ رابط الإشعارات' : 'Webhook URL copied', 'info');
                        },
                        () => toast(isAr ? 'تعذر نسخ الرابط' : 'Could not copy webhook URL', 'error'),
                      );
                    }}
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedWebhook ? (isAr ? 'تم النسخ ✓' : 'Copied ✓') : isAr ? 'نسخ الرابط' : 'Copy URL'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all" dir="ltr">
                  {buildPaymentWebhookUrl(
                    window.location.origin,
                    methodsList.find((m) => m.key === selectedProvider)?.gatewayType || selectedProvider,
                    activeStore.id,
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'نسبة الرسوم (%)' : 'Gateway Fee (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={gatewayFeePct}
                    onChange={(e) => setGatewayFeePct(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'الرسوم الثابتة (⃁)' : 'Fixed Fee (⃁)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={gatewayFeeFixed}
                    onChange={(e) => setGatewayFeeFixed(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isTestingGateway}
                  onClick={() => handleTestGatewayApi(selectedProvider, gatewayTitle)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {isTestingGateway ? (isAr ? 'جاري الفحص...' : 'Testing...') : isAr ? 'فحص الاتصال' : 'Test Connection'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGatewayModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    {isAr ? 'حفظ وتفعيل البوابة' : 'Save & Enable Gateway'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </GlobalModal>
      )}

      <TamaraGatewayModal
        open={showTamaraModal}
        isAr={isAr}
        initial={tamaraModalInitial}
        saving={savingTamara}
        statusLabel={
          tamaraGateway
            ? tamaraGateway.status === 'connected'
              ? isAr
                ? 'الحالة: متصل'
                : 'Status: Connected'
              : tamaraGateway.status === 'error'
                ? isAr
                  ? 'الحالة: خطأ في التحقق'
                  : 'Status: Verification error'
                : isAr
                  ? 'الحالة: غير متصل'
                  : 'Status: Disconnected'
            : undefined
        }
        onClose={() => setShowTamaraModal(false)}
        onSave={handleSaveTamara}
      />

      {/* Docs Guide Modal */}
      <PageDocsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pageId="payments"
      />
    </div>
  );
};
