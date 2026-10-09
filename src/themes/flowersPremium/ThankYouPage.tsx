import React from 'react';
import { CheckCircle2, Package, ArrowRight, User } from 'lucide-react';

type Props = {
  lang: string;
  storeName: string;
  orderRef?: string;
  district?: string;
  moneyTotal?: string;
  onContinueShopping: () => void;
  onOpenProfile: () => void;
};

export const ThankYouPage: React.FC<Props> = ({
  lang,
  storeName,
  orderRef,
  district,
  moneyTotal,
  onContinueShopping,
  onOpenProfile,
}) => {
  const ar = lang === 'ar';

  return (
    <section
      className="px-4 sm:px-8 py-12 sm:py-16 flex flex-col items-center text-center gap-5"
      style={{ background: 'var(--sf-bg)', color: 'var(--sf-text)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
        style={{ background: 'var(--sf-accent)' }}
      >
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-md">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          {ar ? 'شكراً لطلبك!' : 'Thank you for your order!'}
        </h2>
        <p className="text-xs sm:text-sm" style={{ color: 'var(--sf-muted)' }}>
          {ar
            ? `تم استلام طلبك لدى ${storeName}. جارٍ تجهيز الورود للتوصيل.`
            : `Your order was received at ${storeName}. Fresh blooms are being prepared.`}
        </p>
      </div>

      <div
        className="w-full max-w-sm rounded-2xl border p-4 text-start space-y-2"
        style={{ background: 'var(--sf-surface)', borderColor: 'var(--sf-border)' }}
      >
        {orderRef ? (
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--sf-muted)' }}>{ar ? 'رقم الطلب' : 'Order ref'}</span>
            <span className="font-mono font-bold">{orderRef}</span>
          </div>
        ) : null}
        {moneyTotal ? (
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--sf-muted)' }}>{ar ? 'المجموع' : 'Total'}</span>
            <span className="font-bold tabular-nums">{moneyTotal}</span>
          </div>
        ) : null}
        {district ? (
          <div className="flex items-start justify-between gap-3 text-xs">
            <span className="shrink-0" style={{ color: 'var(--sf-muted)' }}>
              {ar ? 'التوصيل' : 'Delivery'}
            </span>
            <span className="font-medium text-end">{district}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2 pt-2 text-[11px]" style={{ color: 'var(--sf-accent)' }}>
          <Package className="w-3.5 h-3.5" />
          <span>{ar ? 'تحديثات الحالة من لوحة المتجر + ملفك' : 'Status updates via store ops + your profile'}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onContinueShopping}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer inline-flex items-center gap-1.5"
          style={{ background: 'var(--sf-accent)' }}
        >
          <span>{ar ? 'متابعة التسوق' : 'Continue shopping'}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
        <button
          type="button"
          onClick={onOpenProfile}
          className="px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer inline-flex items-center gap-1.5"
          style={{
            borderColor: 'var(--sf-border)',
            background: 'var(--sf-surface)',
            color: 'var(--sf-text)',
          }}
        >
          <User className="w-3.5 h-3.5" />
          <span>{ar ? 'ملفي وطلباتي' : 'My profile & orders'}</span>
        </button>
      </div>
    </section>
  );
};
