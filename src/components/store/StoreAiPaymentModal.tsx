import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { GlobalModal } from '../common/GlobalModal';
import { useToast } from '../common/ToastProvider';
import {
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
  const [selectedPkgId, setSelectedPkgId] = useState<string>('ai_pro');
  const [txRef, setTxRef] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [method, setMethod] = useState<string>('alrajhi');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofType, setProofType] = useState<'image' | 'pdf'>('image');
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  const activePkg = packages.find((p) => p.id === selectedPkgId) || packages[1] || packages[0];

  useEffect(() => {
    if (isOpen) {
      if (packages.length > 0 && !packages.some((p) => p.id === selectedPkgId)) {
        setSelectedPkgId(packages[1]?.id || packages[0]?.id || 'ai_pro');
      }
      setSuccessResult(null);
    }
  }, [isOpen, packages, selectedPkgId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast(isAr ? 'الحد الأقصى للملف 15 ميغابايت' : 'File must be under 15MB', 'error');
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

  const handleCopyIban = (iban: string) => {
    void navigator.clipboard.writeText(iban);
    toast(isAr ? 'تم نسخ الآيبان إلى الحافظة' : 'IBAN copied to clipboard', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txRef.trim()) {
      toast(isAr ? 'يرجى إدخال رقم الحوالة / المرجع' : 'Please enter transaction reference number', 'error');
      return;
    }

    if (!proofPreview && !proofFile) {
      toast(isAr ? 'يرجى إرفاق صورة أو ملف PDF لإيصال التحويل' : 'Please upload payment slip screenshot or PDF', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitAiPaymentProof(storeId, {
        package_id: activePkg?.id || 'ai_pro',
        transaction_ref: txRef.trim(),
        amount_sar: activePkg?.price_sar || 249,
        sender_name: senderName.trim(),
        payment_method: method,
        proof_base64: proofPreview || undefined,
        proof_filename: proofFile?.name,
      });

      if (res.ok) {
        setSuccessResult(
          isAr
            ? res.message_ar || 'تم تأكيد إيصال السداد بنجاح! تم رفع حدود وكافة مميزات أدوات الذكاء الاصطناعي للمتجر.'
            : res.message || 'Payment verified successfully! All AI Agents and limits have been unlocked.',
        );
        toast(isAr ? 'تم تأكيد السداد ورفع السعات بنجاح' : 'Payment approved and limits upgraded!', 'success');
        onPaymentSuccess?.();
      } else {
        toast(res.message || 'Payment submission failed', 'error');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} aria-label={isAr ? 'دفع وترقية أدوات الذكاء' : 'AI Tools Payment & Upgrade'}>
      <div
        className="rounded-2xl overflow-hidden w-[min(720px,96vw)] max-h-[90vh] flex flex-col"
        style={{ background: 'var(--surface)', color: 'var(--text)' }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ background: 'var(--portal-cta)', color: '#fff', borderColor: 'transparent' }}>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </span>
            <div>
              <div className="font-black text-sm">
                {isAr ? 'ترقية باقة الذكاء الاصطناعي وتأكيد الدفع' : 'Upgrade AI Agent Package & Confirm Payment'}
              </div>
              <div className="text-[11px] opacity-90">
                {isAr
                  ? 'سداد الرسوم وإرفاق إيصال التحويل (صورة أو PDF) لرفع السعات فوراً'
                  : 'Submit transaction reference and slip (screenshot/PDF) to unlock full capacity'}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {successResult ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="text-lg font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'تم التحقق من السداد وتفعيل الباقة بنجاح!' : 'Payment Verified & Plan Unlocked!'}
              </div>
              <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
                {successResult}
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="unity-btn-primary px-6 py-2.5 text-xs font-bold rounded-xl"
                >
                  {isAr ? 'العودة لصفحة وكلاء الذكاء' : 'Return to AI Agents'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Select Plan */}
              <div>
                <label className="block text-xs font-black mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isAr ? '1. اختر باقة الذكاء المناسبة لمتجرك' : '1. Select AI Plan'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {packages.map((pkg) => {
                    const active = (activePkg?.id || selectedPkgId) === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className="text-start rounded-xl border p-3 transition-all cursor-pointer relative"
                        style={{
                          borderColor: active ? 'var(--accent)' : 'var(--border)',
                          background: active ? 'color-mix(in srgb, var(--accent) 12%, var(--bg))' : 'var(--bg)',
                          boxShadow: active ? '0 0 0 2px var(--accent)' : 'none',
                        }}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-black truncate">{isAr ? pkg.label_ar : pkg.label_en}</span>
                          <span className="text-xs font-black shrink-0" style={{ color: 'var(--accent)' }}>
                            {pkg.price_sar} {isAr ? 'ر.س' : 'SAR'}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold leading-relaxed" style={{ color: 'var(--muted)' }}>
                          {isAr ? pkg.includes_ar : pkg.includes_en}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Official Bank Transfer Details */}
              <div
                className="rounded-xl border p-3.5 space-y-2.5 text-xs"
                style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--portal-cta) 4%, var(--bg))' }}
              >
                <div className="font-black flex items-center justify-between text-xs" style={{ color: 'var(--text)' }}>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    {isAr ? '2. بيانات الحساب البنكي الرسمي لمنصة سوق' : '2. Official Souq Bank Transfer Details'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {isAr ? 'معتمد وفوري' : 'Verified & Direct'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-black/30 border" style={{ borderColor: 'var(--border)' }}>
                    <span className="block text-[10px] text-muted-foreground font-semibold">
                      {isAr ? 'اسم البنك / المستفيد:' : 'Bank / Beneficiary:'}
                    </span>
                    <strong className="block text-xs mt-0.5">
                      {isAr ? (bankDetails?.bank_name_ar || 'مصرف الراجحي') : (bankDetails?.bank_name_en || 'Al Rajhi Bank')}
                    </strong>
                    <span className="text-[10px] text-muted-foreground">
                      {isAr ? (bankDetails?.beneficiary_name_ar || 'منصة سوق يونيتيك للتجارة') : (bankDetails?.beneficiary_name_en || 'Souq Platform Unityteck')}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/60 dark:bg-black/30 border" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] text-muted-foreground font-semibold">
                        {isAr ? 'رقم الآيبان (IBAN):' : 'IBAN:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyIban(bankDetails?.iban || 'SA0380000456608010123456')}
                        className="text-[10px] font-bold text-accent flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {isAr ? 'نسخ' : 'Copy'}
                      </button>
                    </div>
                    <code className="block text-[11px] font-mono font-bold mt-1 tracking-wider text-emerald-700 dark:text-emerald-400">
                      {bankDetails?.iban || 'SA0380000456608010123456'}
                    </code>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      STC Pay: {bankDetails?.stc_pay_phone || '+966 50 123 4567'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Transaction Details & Slip Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-black flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {isAr ? '3. بيانات التحويل وإرفاق إيصال الدفع' : '3. Payment Details & Receipt Slip Upload'}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text)' }}>
                      {isAr ? 'رقم الحوالة / المرجع (Transaction Ref) *' : 'Transaction Ref # *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'مثال: 9482018471' : 'e.g. TX-9482018'}
                      value={txRef}
                      onChange={(e) => setTxRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-transparent"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text)' }}>
                      {isAr ? 'اسم المحول / صاحب الحساب' : 'Sender / Account Holder Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: سعد الشمري' : 'e.g. Saad Al-Otaibi'}
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-transparent"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                {/* Upload Slip Box */}
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'إيصال التحويل (صورة لقطة شاشة أو ملف PDF) *' : 'Payment Slip (Screenshot or PDF) *'}
                  </label>
                  <label
                    className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: proofPreview ? 'var(--accent)' : 'var(--border)' }}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {proofPreview ? (
                      <div className="flex items-center gap-3 w-full">
                        {proofType === 'pdf' ? (
                          <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        ) : (
                          <img
                            src={proofPreview}
                            alt="Slip Preview"
                            className="w-16 h-16 object-cover rounded-lg border shrink-0"
                            style={{ borderColor: 'var(--border)' }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate">
                            {proofFile?.name || (isAr ? 'تم إرفاق الإيصال' : 'Slip attached')}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            {isAr ? 'جاهز للإرسال والتحقق الفوري' : 'Ready for instant verification'}
                          </div>
                        </div>
                        <span className="text-[11px] text-accent font-bold hover:underline shrink-0">
                          {isAr ? 'تغيير الملف' : 'Change'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-center" style={{ color: 'var(--text)' }}>
                          {isAr ? 'اضغط لاختيار صورة الإيصال أو ملف PDF' : 'Click to select slip screenshot or PDF'}
                        </div>
                        <div className="text-[10px] text-center" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'JPG, PNG, WEBP أو PDF حتى 15 ميغابايت' : 'JPG, PNG, WEBP or PDF up to 15MB'}
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="unity-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isAr ? 'جاري التحقق والتفعيل…' : 'Verifying & Unlocking…'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {isAr ? `تأكيد الدفع لـ (${activePkg?.price_sar} ر.س)` : `Confirm Payment (${activePkg?.price_sar} SAR)`}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </GlobalModal>
  );
};

export default StoreAiPaymentModal;
