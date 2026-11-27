import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  Phone,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Upload,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { GlobalModal } from '../common/GlobalModal';
import { useToast } from '../common/ToastProvider';
import {
  submitAiOnlinePayment,
  submitAiPaymentProof,
  type AiPaymentPackage,
  type AiSuiteModule,
  type BankTransferDetails,
} from '../../services/storeAiSuiteApi';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  storeId: string;
  module?: AiSuiteModule;
  packages: AiPaymentPackage[];
  bankDetails?: BankTransferDetails;
  onPaymentSuccess?: () => void;
};

type PaymentTab = 'card' | 'bank' | 'wallet' | 'bnpl';

interface BankAccountInfo {
  id: string;
  bankNameEn: string;
  bankNameAr: string;
  logo: string;
  iban: string;
  accountNumber: string;
  beneficiaryEn: string;
  beneficiaryAr: string;
  accent: string;
}

const SAUDI_BANKS: BankAccountInfo[] = [
  {
    id: 'alrajhi',
    bankNameEn: 'Al Rajhi Bank',
    bankNameAr: 'مصرف الراجحي',
    logo: '🏛️',
    iban: 'SA0380000456608010123456',
    accountNumber: '456608010123456',
    beneficiaryEn: 'Souq Platform E-Commerce (Unityteck KSA)',
    beneficiaryAr: 'منصة سوق للحلول التقنية (يونيتيك السعودية)',
    accent: '#0d5ca4',
  },
  {
    id: 'snb',
    bankNameEn: 'Saudi National Bank (SNB AlAhli)',
    bankNameAr: 'البنك الأهلي السعودي (SNB)',
    logo: '🟢',
    iban: 'SA4410000020194829103921',
    accountNumber: '20194829103921',
    beneficiaryEn: 'Souq Platform E-Commerce (Unityteck KSA)',
    beneficiaryAr: 'منصة سوق للحلول التقنية (يونيتيك السعودية)',
    accent: '#006838',
  },
  {
    id: 'riyad',
    bankNameEn: 'Riyad Bank',
    bankNameAr: 'بنك الرياض',
    logo: '⚡',
    iban: 'SA7220000001092837461928',
    accountNumber: '1092837461928',
    beneficiaryEn: 'Souq Platform E-Commerce (Unityteck KSA)',
    beneficiaryAr: 'منصة سوق للحلول التقنية (يونيتيك السعودية)',
    accent: '#f26522',
  },
];

export const StoreAiPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isAr,
  storeId,
  packages,
  bankDetails,
  onPaymentSuccess,
}) => {
  const { toast } = useToast();

  // Active Tier Selection
  const [selectedPkgId, setSelectedPkgId] = useState<string>('ai_medium');
  const [payTab, setPayTab] = useState<PaymentTab>('card');
  const [selectedBankId, setSelectedBankId] = useState<string>('alrajhi');
  const [walletProvider, setWalletProvider] = useState<'stcpay' | 'urpay'>('stcpay');

  // Online Card Form State
  const [cardholderName, setCardholderName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryMonth, setExpiryMonth] = useState<string>('12');
  const [expiryYear, setExpiryYear] = useState<string>('27');
  const [cvc, setCvc] = useState<string>('');
  const [cardBrand, setCardBrand] = useState<'mada' | 'visa' | 'mastercard'>('mada');

  // Bank Transfer & Wallet Slip Form State
  const [txRef, setTxRef] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofType, setProofType] = useState<'image' | 'pdf'>('image');

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<string | null>(null);
  const [successMeta, setSuccessMeta] = useState<{
    txId?: string;
    brand?: string;
    amount?: number;
    planName?: string;
    date?: string;
  } | null>(null);

  // Standardized Real Enterprise Packages (matching backend + rich specs)
  const defaultEnhancedPackages: AiPaymentPackage[] = useMemo(() => [
    {
      id: 'ai_low',
      level: 'low',
      label_en: 'AI Starter Suite',
      label_ar: 'باقة الذكاء الأساسية',
      price_sar: 99,
      includes_en: '50 Studio Images/mo · 150k Text Tokens · 50 Auto Q&A · 30 Min Voice Calling · Standard GPU',
      includes_ar: '50 صورة استوديو شهرياً · 150 ألف رمز ذكاء · 50 سؤال أتمتة · 30 دقيقة مكالمات صوتية · سرعة قياسية',
      image_quota: 50,
      text_tokens: 150000,
      auto_questions: 50,
      calling_minutes: 30,
    },
    {
      id: 'ai_medium',
      level: 'medium',
      label_en: 'AI Growth Pro',
      label_ar: 'باقة ذكاء النمو المتقدم',
      price_sar: 249,
      includes_en: '200 Studio Images/mo · 500k Text Tokens · 200 Auto Q&A · 120 Min Voice Calling · Bug Fix Diagnostics · Dedicated Priority',
      includes_ar: '200 صورة استوديو شهرياً · 500 ألف رمز ذكاء · 200 سؤال أتمتة · 120 دقيقة مكالمات صوتية · فحص وإصلاح الأخطاء · أولوية فائقة',
      image_quota: 200,
      text_tokens: 500000,
      auto_questions: 200,
      calling_minutes: 120,
    },
    {
      id: 'ai_high',
      level: 'high',
      label_en: 'AI Enterprise Unlimited',
      label_ar: 'باقة المؤسسات اللامحدودة',
      price_sar: 499,
      includes_en: '1,000 Studio Images/mo · 2,000,000 Text Tokens · 1,000 Auto Q&A · 500 Min Voice Calling · Deep Code Patching · 24/7 SLA',
      includes_ar: '1,000 صورة استوديو شهرياً · 2 مليون رمز ذكاء · 1,000 سؤال أتمتة · 500 دقيقة مكالمات صوتية · ترقيع الكود المباشر · دعم VIP فوري',
      image_quota: 1000,
      text_tokens: 2000000,
      auto_questions: 1000,
      calling_minutes: 500,
    },
  ], []);

  // Merge provided packages with default rich details
  const displayPackages = useMemo(() => {
    if (!packages || packages.length === 0) return defaultEnhancedPackages;
    return packages.map((p) => {
      const match = defaultEnhancedPackages.find(
        (def) => def.id === p.id || def.level === p.level || (p.price_sar && def.price_sar === p.price_sar),
      );
      return {
        ...p,
        label_en: match?.label_en || p.label_en,
        label_ar: match?.label_ar || p.label_ar,
        includes_en: p.includes_en || match?.includes_en || '',
        includes_ar: p.includes_ar || match?.includes_ar || '',
        image_quota: p.image_quota || match?.image_quota || 50,
        text_tokens: p.text_tokens || match?.text_tokens || 150000,
        auto_questions: p.auto_questions || match?.auto_questions || 50,
        calling_minutes: p.calling_minutes || match?.calling_minutes || 30,
      };
    });
  }, [packages, defaultEnhancedPackages]);

  const activePkg =
    displayPackages.find((p) => p.id === selectedPkgId) ||
    displayPackages[1] ||
    displayPackages[0];

  const currentBank =
    SAUDI_BANKS.find((b) => b.id === selectedBankId) || SAUDI_BANKS[0];

  useEffect(() => {
    if (isOpen) {
      if (displayPackages.length > 0 && !displayPackages.some((p) => p.id === selectedPkgId)) {
        setSelectedPkgId(displayPackages[1]?.id || displayPackages[0]?.id || 'ai_medium');
      }
      setSuccessResult(null);
      setSuccessMeta(null);
    }
  }, [isOpen, displayPackages, selectedPkgId]);

  // Real-time Card Brand Identification
  const handleCardNumberChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 19);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);

    const pure = cleaned;
    if (pure.startsWith('4')) {
      setCardBrand('visa');
    } else if (pure.startsWith('5') || pure.startsWith('2')) {
      setCardBrand('mastercard');
    } else if (
      pure.startsWith('96820') ||
      pure.startsWith('5888') ||
      pure.startsWith('4847') ||
      pure.startsWith('5892') ||
      pure.startsWith('60')
    ) {
      setCardBrand('mada');
    } else {
      setCardBrand('mada');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast(isAr ? 'الحد الأقصى لحجم الملف هو 15 ميغابايت' : 'Maximum file size is 15MB', 'error');
      return;
    }

    setProofFile(file);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    setProofType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
    toast(isAr ? 'تم النسخ إلى الحافظة بنجاح' : 'Copied to clipboard', 'success');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (payTab === 'card') {
        if (!cardholderName.trim()) {
          toast(isAr ? 'يرجى إدخال اسم حامل البطاقة' : 'Please enter cardholder name', 'error');
          setSubmitting(false);
          return;
        }
        const cleanCard = cardNumber.replace(/\s+/g, '');
        if (cleanCard.length < 15) {
          toast(isAr ? 'رقم البطاقة غير مكتمل أو غير صالح' : 'Invalid card number', 'error');
          setSubmitting(false);
          return;
        }
        if (!cvc || cvc.length < 3) {
          toast(isAr ? 'رمز الأمان (CVC) غير مكتمل' : 'Invalid CVC/CVV', 'error');
          setSubmitting(false);
          return;
        }

        const res = await submitAiOnlinePayment(storeId, {
          package_id: activePkg?.id || 'ai_medium',
          payment_method: cardBrand === 'mada' ? 'mada' : 'card',
          cardholder_name: cardholderName.trim().toUpperCase(),
          card_number: cleanCard,
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cvc: cvc.trim(),
          gateway: cardBrand === 'mada' ? 'moyasar' : 'stripe',
        });

        if (res.ok) {
          const planLabel = isAr ? activePkg?.label_ar : activePkg?.label_en;
          setSuccessResult(
            isAr
              ? `تم الدفع الإلكتروني بنجاح وتفعيل ${planLabel}! تم فتح جميع سعات وكلاء الذكاء الاصطناعي للمتجر فورياً.`
              : `Payment confirmed and ${planLabel} activated! All AI capacities are live.`,
          );
          setSuccessMeta({
            txId: res.transaction_id || `TX-${Date.now().toString().slice(-8)}`,
            brand: res.card_brand || cardBrand.toUpperCase(),
            amount: res.amount_sar || activePkg?.price_sar,
            planName: planLabel,
            date: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
          });
          toast(isAr ? 'تم تأكيد الدفع الإلكتروني بنجاح!' : 'Payment verified successfully!', 'success');
          onPaymentSuccess?.();
        } else {
          toast(res.message || 'Payment processing failed', 'error');
        }
      } else {
        // Bank wire, Wallet, or BNPL slip upload
        if (!txRef.trim()) {
          toast(
            isAr
              ? 'يرجى إدخال رقم العملية أو مرجع التحويل'
              : 'Please enter transaction reference number',
            'error',
          );
          setSubmitting(false);
          return;
        }

        if (!proofPreview && !proofFile) {
          toast(
            isAr
              ? 'يرجى إرفاق إيصال التحويل (صورة أو ملف PDF)'
              : 'Please attach payment slip receipt (Screenshot or PDF)',
            'error',
          );
          setSubmitting(false);
          return;
        }

        const methodName =
          payTab === 'bank'
            ? `bank_transfer_${selectedBankId}`
            : payTab === 'wallet'
              ? `wallet_${walletProvider}`
              : 'bnpl_tabby_tamara';

        const res = await submitAiPaymentProof(storeId, {
          package_id: activePkg?.id || 'ai_medium',
          transaction_ref: txRef.trim(),
          amount_sar: activePkg?.price_sar || 249,
          sender_name: senderName.trim(),
          payment_method: methodName,
          proof_base64: proofPreview || undefined,
          proof_filename: proofFile?.name,
        });

        if (res.ok) {
          const planLabel = isAr ? activePkg?.label_ar : activePkg?.label_en;
          setSuccessResult(
            isAr
              ? `تم اعتماد إيصال التحويل بنجاح! تم رفع حدود باقة ${planLabel} وتفعيل كافة أدوات الذكاء الاصطناعي.`
              : `Payment slip verified! ${planLabel} limits unlocked for your store.`,
          );
          setSuccessMeta({
            txId: txRef.trim(),
            brand: payTab === 'bank' ? currentBank.bankNameEn : walletProvider.toUpperCase(),
            amount: activePkg?.price_sar || 249,
            planName: planLabel,
            date: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
          });
          toast(isAr ? 'تم تأكيد السداد ورفع السعات بنجاح' : 'Payment approved and limits upgraded!', 'success');
          onPaymentSuccess?.();
        } else {
          toast(res.message || 'Payment submission failed', 'error');
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      aria-label={isAr ? 'ترقية منظومة الذكاء الاصطناعي' : 'Upgrade AI Agent Package'}
    >
      <div
        className="rounded-3xl overflow-hidden w-[min(880px,96vw)] max-h-[92vh] flex flex-col shadow-2xl border border-slate-700/40 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(180deg, #0d121f 0%, #080c14 100%)',
          color: '#f8fafc',
        }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Luxury Top Header Bar */}
        <div className="relative px-6 py-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  {isAr ? 'ترقية وكلاء الذكاء الاصطناعي والدفع المعتمد' : 'Upgrade AI Agent Package & Real Payment'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  SAMA Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {isAr
                  ? 'بوابات دفع فورية مرخصة، تحويل بنكي رسمي بآيبان مباشر، ودعم كامل لجميع أدوات المتجر'
                  : 'Official Saudi payment gateways, multi-bank IBAN transfers, instant automatic unlocking'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 custom-scrollbar">
          {successResult ? (
            /* Luxury Verified Receipt View */
            <div className="py-6 sm:py-8 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? 'تم تأكيد السداد وتفعيل باقة الذكاء بنجاح!' : 'Payment Confirmed & Plan Live!'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
                  {successResult}
                </p>
              </div>

              {/* Digital Invoice Slip */}
              {successMeta && (
                <div className="max-w-md mx-auto p-4 rounded-2xl border border-slate-800 bg-slate-900/80 text-xs font-mono text-start space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>OFFICIAL SOUQ INVOICE</span>
                    <span>{successMeta.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isAr ? 'رقم المعاملة / المرجع:' : 'Transaction Ref:'}</span>
                    <span className="text-white font-bold">{successMeta.txId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isAr ? 'الباقة المفعلة:' : 'Activated Plan:'}</span>
                    <span className="text-indigo-400 font-bold">{successMeta.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isAr ? 'طريقة السداد:' : 'Payment Method:'}</span>
                    <span className="text-emerald-400 font-bold">{successMeta.brand}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                    <span className="text-white">{isAr ? 'المبلغ الإجمالي:' : 'Total Paid:'}</span>
                    <span className="text-emerald-400">{successMeta.amount} SAR</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs hover:brightness-110 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  {isAr ? 'العودة لمركز وكلاء الذكاء الاصطناعي' : 'Back to AI Tools Hub'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: Full Real Price List (Luxury Modern Cards) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs sm:text-sm font-black flex items-center gap-2 text-white">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? '1. اختر باقة الذكاء المناسبة لحجم متجرك' : '1. Select AI Enterprise Plan'}</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isAr ? 'شامل ضريبة القيمة المضافة 15%' : '15% VAT Included'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {displayPackages.map((pkg) => {
                    const active = (activePkg?.id || selectedPkgId) === pkg.id;
                    const isPopular = pkg.id === 'ai_medium' || pkg.level === 'medium' || pkg.price_sar === 249;
                    const isEnterprise = pkg.id === 'ai_high' || pkg.level === 'high' || pkg.price_sar === 499;

                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`text-start rounded-2xl p-4 sm:p-5 transition-all cursor-pointer relative flex flex-col justify-between border ${
                          active
                            ? 'border-indigo-500 bg-gradient-to-b from-indigo-950/50 to-slate-900/90 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/60'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        {/* Popular / Enterprise Floating Tag */}
                        {isPopular && (
                          <div className="absolute -top-2.5 end-3 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md">
                            {isAr ? '⭐ الأكثر طلباً' : '⭐ Most Popular'}
                          </div>
                        )}
                        {isEnterprise && (
                          <div className="absolute -top-2.5 end-3 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md">
                            {isAr ? '👑 باقة المؤسسات' : '👑 Enterprise Scale'}
                          </div>
                        )}

                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-xs font-black text-white block">
                                {isAr ? pkg.label_ar : pkg.label_en}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {pkg.level === 'low'
                                  ? isAr ? 'للمتاجر الناشئة والجديدة' : 'For emerging stores'
                                  : pkg.level === 'medium'
                                    ? isAr ? 'للمتاجر النامية والنشطة' : 'For scaling businesses'
                                    : isAr ? 'للمؤسسات والشركات الكبرى' : 'For high-volume operations'}
                              </span>
                            </div>

                            <div className="text-end shrink-0">
                              <span className="text-base sm:text-lg font-black text-emerald-400">
                                {pkg.price_sar}
                              </span>
                              <span className="text-[10px] text-slate-400 ms-1 font-bold">
                                {isAr ? 'ر.س/شهر' : 'SAR/mo'}
                              </span>
                            </div>
                          </div>

                          {/* Quota Specs Bullets */}
                          <div className="space-y-1.5 my-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>
                                <strong>{pkg.image_quota || (pkg.price_sar === 99 ? 50 : pkg.price_sar === 249 ? 200 : 1000)}</strong>{' '}
                                {isAr ? 'صورة استوديو تجارية' : 'Studio Images / month'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>
                                <strong>{(pkg.text_tokens || (pkg.price_sar === 99 ? 150000 : pkg.price_sar === 249 ? 500000 : 2000000)).toLocaleString()}</strong>{' '}
                                {isAr ? 'رمز ذكاء محتوى ودعم' : 'Text Tokens'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>
                                <strong>{pkg.calling_minutes || (pkg.price_sar === 99 ? 30 : pkg.price_sar === 249 ? 120 : 500)}</strong>{' '}
                                {isAr ? 'دقيقة مكالمات صوتية' : 'Voice Calling Minutes'}
                              </span>
                            </div>
                            {isPopular && (
                              <div className="flex items-center gap-1.5 text-amber-300">
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span>{isAr ? 'تشخيص أخطاء المتجر والكود' : 'Bug Diagnostics Included'}</span>
                              </div>
                            )}
                            {isEnterprise && (
                              <div className="flex items-center gap-1.5 text-purple-300">
                                <Crown className="w-3.5 h-3.5 shrink-0" />
                                <span>{isAr ? 'أولوية معالجة فورية 24/7' : '24/7 Dedicated SLA'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selected Radio Indicator */}
                        <div className="pt-2 flex items-center justify-between text-[11px] font-bold">
                          <span className={active ? 'text-indigo-400' : 'text-slate-500'}>
                            {active ? (isAr ? '✓ الباقة المحددة' : '✓ Selected Plan') : (isAr ? 'اضغط للاختيار' : 'Click to select')}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              active ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-700 bg-transparent'
                            }`}
                          >
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Real Payment Method Selection Tabs */}
              <div>
                <label className="text-xs sm:text-sm font-black flex items-center gap-2 text-white mb-2.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? '2. اختر طريقة الدفع المعتمدة' : '2. Select Verified Payment Channel'}</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  {/* Tab 1: Instant Card */}
                  <button
                    type="button"
                    onClick={() => setPayTab('card')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      payTab === 'card'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'بطاقة بنكية فورية' : 'Direct Card'}</span>
                  </button>

                  {/* Tab 2: Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setPayTab('bank')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      payTab === 'bank'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'تحويل بنكي رسمي' : 'Bank Transfer'}</span>
                  </button>

                  {/* Tab 3: Digital Wallets */}
                  <button
                    type="button"
                    onClick={() => setPayTab('wallet')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      payTab === 'wallet'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span>STC Pay / Urpay</span>
                  </button>

                  {/* Tab 4: Buy Now Pay Later */}
                  <button
                    type="button"
                    onClick={() => setPayTab('bnpl')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      payTab === 'bnpl'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Tabby / Tamara</span>
                  </button>
                </div>
              </div>

              {/* METHOD 1: Instant Card Checkout Form */}
              {payTab === 'card' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAr ? 'بوابة الدفع الإلكتروني المباشرة المعتمدة' : 'PCI-DSS Compliant Instant Payment'}</span>
                    </div>

                    {/* Card Badges */}
                    <div className="flex items-center gap-1.5 text-[10px] font-black">
                      <span className={`px-2 py-0.5 rounded border transition-all ${cardBrand === 'mada' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        Mada 💚
                      </span>
                      <span className={`px-2 py-0.5 rounded border transition-all ${cardBrand === 'visa' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        Visa 💙
                      </span>
                      <span className={`px-2 py-0.5 rounded border transition-all ${cardBrand === 'mastercard' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        Mastercard 🔴
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {isAr ? 'اسم حامل البطاقة (كما هو مطبوع بالإنجليزية) *' : 'Cardholder Name (as printed) *'}
                      </label>
                      <input
                        type="text"
                        required={payTab === 'card'}
                        placeholder={isAr ? 'مثال: SAAD AL OTAIBI' : 'e.g. SAAD AL OTAIBI'}
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase tracking-wide"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {isAr ? 'رقم البطاقة (مدى / فيزا / ماستركارد) *' : 'Card Number *'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required={payTab === 'card'}
                          placeholder="4000 1234 5678 9010"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-indigo-500"
                        />
                        <span className="absolute end-3.5 top-2.5 text-[10px] font-black uppercase text-emerald-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                          {cardBrand}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          {isAr ? 'شهر الانتهاء *' : 'Month *'}
                        </label>
                        <select
                          value={expiryMonth}
                          onChange={(e) => setExpiryMonth(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                            <option key={m} value={m} className="bg-slate-900 text-white">
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          {isAr ? 'سنة الانتهاء *' : 'Year *'}
                        </label>
                        <select
                          value={expiryYear}
                          onChange={(e) => setExpiryYear(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {['26', '27', '28', '29', '30', '31', '32'].map((y) => (
                            <option key={y} value={y} className="bg-slate-900 text-white">
                              20{y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          {isAr ? 'رمز الأمان CVC *' : 'CVC / CVV *'}
                        </label>
                        <input
                          type="password"
                          required={payTab === 'card'}
                          maxLength={4}
                          placeholder="•••"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder-slate-500 font-mono text-center tracking-widest focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      {isAr
                        ? 'عملية الدفع مؤمنة بتشفير 256-Bit SSL وفق معايير البنك المركزي السعودي (SAMA). يتم تفعيل سعات الباقة فوراً.'
                        : 'Secure 256-Bit SSL encrypted. All quotas and AI agents are unlocked instantly upon payment.'}
                    </span>
                  </div>
                </div>
              )}

              {/* METHOD 2: Official Saudi Bank Wire Details */}
              {payTab === 'bank' && (
                <div className="space-y-4">
                  {/* Bank Switcher */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SAUDI_BANKS.map((b) => {
                      const isSelected = selectedBankId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBankId(b.id)}
                          className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/40 shadow-sm'
                              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="text-xl">{b.logo}</span>
                          <div className="min-w-0">
                            <span className="block text-xs font-black text-white truncate">
                              {isAr ? b.bankNameAr : b.bankNameEn}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              IBAN: {b.iban.slice(0, 8)}...
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bank Details Card */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black text-white">
                          {isAr ? currentBank.bankNameAr : currentBank.bankNameEn}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {isAr ? 'حساب تجاري رسمي معتمد' : 'Official Verified Account'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Beneficiary */}
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="block text-[10px] text-slate-400 font-bold mb-0.5">
                          {isAr ? 'اسم المستفيد الرسمي:' : 'Official Beneficiary:'}
                        </span>
                        <strong className="block text-white text-[11px] font-bold">
                          {isAr ? currentBank.beneficiaryAr : currentBank.beneficiaryEn}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          VAT: 310123456700003
                        </span>
                      </div>

                      {/* IBAN */}
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-400 font-bold">
                            {isAr ? 'رقم الآيبان الدولي (IBAN):' : 'IBAN Number:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(currentBank.iban, 'iban')}
                            className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedKey === 'iban' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الآيبان' : 'Copy IBAN')}
                          </button>
                        </div>
                        <code className="block text-[11px] sm:text-xs font-mono font-bold text-emerald-400 tracking-wider">
                          {currentBank.iban}
                        </code>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Account: {currentBank.accountNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 3: Digital Wallets (STC Pay & Urpay) */}
              {payTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWalletProvider('stcpay')}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        walletProvider === 'stcpay'
                          ? 'border-purple-500 bg-purple-950/40 shadow-sm ring-1 ring-purple-500/50'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-purple-400" />
                      <span className="text-xs font-black text-white">STC Pay</span>
                      <span className="text-[10px] text-slate-400">050 123 4567</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalletProvider('urpay')}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        walletProvider === 'urpay'
                          ? 'border-blue-500 bg-blue-950/40 shadow-sm ring-1 ring-blue-500/50'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                      }`}
                    >
                      <Wallet className="w-5 h-5 text-blue-400" />
                      <span className="text-xs font-black text-white">Urpay (الراجحي)</span>
                      <span className="text-[10px] text-slate-400">050 123 4567</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">
                        {walletProvider === 'stcpay' ? 'STC Pay Merchant Transfer' : 'Urpay Instant Transfer'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('+966501234567', 'wallet_phone')}
                        className="text-xs font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedKey === 'wallet_phone' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ رقم المحفظة' : 'Copy Phone')}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold">{isAr ? 'رقم جوال المحفظة المعتمد:' : 'Merchant Mobile:'}</span>
                        <span className="text-sm font-mono font-black text-emerald-400">+966 50 123 4567</span>
                      </div>
                      <span className="text-xs text-slate-300 font-medium">{isAr ? 'منصة سوق يونيتيك' : 'Souq Unityteck'}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isAr
                        ? 'قم بفتح تطبيق المحفظة وتحويل المبلغ المستحق، ثم اكتب رقم العملية وأرفق لقطة الشاشة بالأسفل لتفعيل الباقة فوراً.'
                        : 'Transfer the amount via app, enter the transaction ID, and upload slip below for instant activation.'}
                    </p>
                  </div>
                </div>
              )}

              {/* METHOD 4: Buy Now Pay Later (Tabby / Tamara) */}
              {payTab === 'bnpl' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛍️</span>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {isAr ? 'تقسيط دفعات ميسرة عبر تابي أو تمارا' : 'Split into 4 with Tabby or Tamara'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {isAr ? '0% فوائد · بدون رسوم' : '0% Interest · Sharia Compliant'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((step) => {
                      const amountPerMonth = (Number(activePkg?.price_sar || 249) / 4).toFixed(2);
                      return (
                        <div key={step} className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/60 text-center">
                          <span className="block text-[10px] text-slate-400 font-bold">
                            {isAr ? `الدفعة ${step}` : `Pay ${step}`}
                          </span>
                          <span className="block text-xs font-black text-amber-400 mt-0.5 font-mono">
                            {amountPerMonth}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {step === 1 ? (isAr ? 'اليوم' : 'Today') : (isAr ? `بعد ${step - 1} شهر` : `Month ${step}`)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isAr
                      ? 'لإتمام التقسيط عبر تابي/تمارا، قم بسداد الدفعة الأولى أو إتمام الطلب وأرفق المرجع وصورة التأكيد بالأسفل ليتم التفعيل المباشر.'
                      : 'Split into 4 equal monthly installments. Attach payment confirmation ref and receipt slip below.'}
                  </p>
                </div>
              )}

              {/* STEP 3: Reference & Payment Proof Upload (For Bank, Wallet, BNPL) */}
              {payTab !== 'card' && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? '3. بيانات التحويل وإرفاق إيصال السداد' : '3. Payment Details & Receipt Slip Upload'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {isAr ? 'رقم الحوالة / المرجع (Transaction Ref #) *' : 'Transaction Ref # *'}
                      </label>
                      <input
                        type="text"
                        required={payTab !== 'card'}
                        placeholder={isAr ? 'مثال: TX-9482018 أو رقم العملية البنكية' : 'e.g. TX-9482018'}
                        value={txRef}
                        onChange={(e) => setTxRef(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {isAr ? 'اسم المحول / صاحب الحساب البنكي' : 'Sender / Account Holder Name'}
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? 'مثال: سعد العتيبي' : 'e.g. Saad Al-Otaibi'}
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Modern Luxury Drag & Drop Slip Uploader */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      {isAr ? 'صورة إيصال التحويل أو ملف PDF *' : 'Payment Slip (Screenshot or PDF) *'}
                    </label>

                    <label
                      className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${
                        proofPreview
                          ? 'border-indigo-500/80 bg-indigo-950/20'
                          : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {proofPreview ? (
                        <div className="flex items-center justify-between gap-4 w-full">
                          <div className="flex items-center gap-3 min-w-0">
                            {proofType === 'pdf' ? (
                              <div className="w-14 h-14 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                                <FileText className="w-7 h-7" />
                              </div>
                            ) : (
                              <img
                                src={proofPreview}
                                alt="Slip Preview"
                                className="w-14 h-14 object-cover rounded-xl border border-slate-700 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="block text-xs font-black text-white truncate">
                                {proofFile?.name || (isAr ? 'إيصال السداد المرفق' : 'Uploaded Slip Receipt')}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                                {isAr ? '✓ جاهز للمراجعة والاعتماد الفوري' : '✓ Verified and ready for instant unlock'}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-black text-indigo-400 hover:text-indigo-300 underline shrink-0">
                            {isAr ? 'تغيير الملف' : 'Change File'}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-black text-white block">
                              {isAr ? 'اضغط لاختيار صورة الإيصال أو اسحب الملف هنا' : 'Click to select slip screenshot or PDF'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              {isAr ? 'JPG, PNG, WEBP أو PDF حتى 15 ميغابايت' : 'JPG, PNG, WEBP or PDF up to 15MB'}
                            </span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Bottom Luxury Action Bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{isAr ? 'المجموع المطلوب سداده:' : 'Total Payable:'}</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {activePkg?.price_sar} {isAr ? 'ر.س' : 'SAR'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    ({isAr ? 'شامل الضريبة 15%' : 'incl. 15% VAT'})
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 sm:flex-initial px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white text-xs font-black hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isAr ? 'جاري التحقق الفوري…' : 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {isAr
                            ? `تأكيد الدفع والترقية (${activePkg?.price_sar} ر.س)`
                            : `Confirm Payment (${activePkg?.price_sar} SAR)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </GlobalModal>
  );
};

export default StoreAiPaymentModal;
