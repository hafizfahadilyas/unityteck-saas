import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';

type Locale = 'ar' | 'en';

export type CheckoutConfirmDialogProps = {
  open: boolean;
  locale: Locale;
  paymentLabel: string;
  totalLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Pre-payment “Are you sure?” — no native alert(). */
export function CheckoutConfirmDialog({
  open,
  locale,
  paymentLabel,
  totalLabel,
  busy,
  onCancel,
  onConfirm,
}: CheckoutConfirmDialogProps) {
  const isAr = locale === 'ar';
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      role="alertdialog"
      aria-modal="true"
      aria-label={isAr ? 'تأكيد الطلب والدفع' : 'Confirm order and payment'}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white text-neutral-900 shadow-2xl border border-neutral-200 p-5 sm:p-6 space-y-4"
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-base font-black">
              {isAr ? 'هل أنت متأكد من إتمام الطلب؟' : 'Are you sure you want to place this order?'}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {isAr
                ? 'سيتم إنشاء الطلب بوسيلة الدفع المختارة. للدفع الإلكتروني يلزم تأكيد البوابة — لن يُعلَّم مدفوعاً بدون تحقق حقيقي.'
                : 'The order will be created with your selected payment method. Online payments stay unpaid until the gateway verifies — no fake paid status.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-xs space-y-1.5">
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500">{isAr ? 'وسيلة الدفع' : 'Payment method'}</span>
            <span className="font-bold">{paymentLabel}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500">{isAr ? 'المبلغ' : 'Amount'}</span>
            <span className="font-mono font-black">{totalLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="py-3 rounded-full border border-neutral-300 text-xs font-bold cursor-pointer hover:bg-neutral-50 disabled:opacity-50"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="py-3 rounded-full bg-neutral-900 text-white text-xs font-extrabold cursor-pointer hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy
              ? isAr
                ? 'جاري التنفيذ…'
                : 'Processing…'
              : isAr
                ? 'نعم، تأكيد الطلب'
                : 'Yes, place order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export type CheckoutResultDialogProps = {
  open: boolean;
  locale: Locale;
  variant: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
};

/** Success / error result popup after place-order attempt. */
export function CheckoutResultDialog({
  open,
  locale,
  variant,
  title,
  message,
  onClose,
  primaryLabel,
  onPrimary,
}: CheckoutResultDialogProps) {
  const isAr = locale === 'ar';
  if (!open) return null;
  const ok = variant === 'success';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      onClick={onClose}
    >
      <style>{`
        @keyframes co-pop {
          0% { transform: scale(0.82); opacity: 0; }
          55% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes co-ring {
          0% { transform: scale(0.6); opacity: 0.55; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes co-check {
          0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
          70% { transform: scale(1.12) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes co-confetti {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(28px) scale(0.6); opacity: 0; }
        }
      `}</style>
      <div
        className="relative w-full max-w-md rounded-3xl bg-white text-neutral-900 shadow-2xl border border-neutral-200 p-5 sm:p-6 space-y-4 overflow-hidden"
        style={{ animation: 'co-pop 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {ok ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center gap-3" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'][i],
                  animation: `co-confetti 900ms ease-out ${i * 70}ms both`,
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-start gap-3 pt-1">
          <span className="relative p-2.5 rounded-2xl shrink-0">
            {ok ? (
              <>
                <span
                  className="absolute inset-0 rounded-2xl bg-emerald-200/70"
                  style={{ animation: 'co-ring 900ms ease-out infinite' }}
                />
                <span
                  className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700"
                  style={{ animation: 'co-check 520ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                >
                  <CheckCircle2 className="w-7 h-7" strokeWidth={2.25} />
                </span>
              </>
            ) : (
              <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-rose-50 text-rose-700">
                <XCircle className="w-6 h-6" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-base font-black">{title}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onPrimary) onPrimary();
            else onClose();
          }}
          className={`w-full py-3 rounded-full text-xs font-extrabold cursor-pointer ${
            ok ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-neutral-900 hover:bg-neutral-800 text-white'
          }`}
        >
          {primaryLabel || (isAr ? 'حسناً' : 'OK')}
        </button>
      </div>
    </div>
  );
}
