import React from 'react';
import { CheckCircle2, Clock, Truck } from 'lucide-react';

export type CheckoutShippingMethodOption = {
  id: string;
  name: string;
  name_ar?: string | null;
  fee: number;
  is_free?: boolean;
  estimated_delivery?: string | null;
  courier_code?: string | null;
  fulfillment_mode?: string | null;
};

type Props = {
  isAr: boolean;
  methods: CheckoutShippingMethodOption[];
  selectedId: string | null;
  onSelect: (method: CheckoutShippingMethodOption) => void;
  loading?: boolean;
  money: (n: number) => string;
};

/**
 * Dynamic shipping method cards for checkout (RedBox / SMSA / Aramex / Local Delivery style).
 * Data comes from store-scoped API — never invents fees.
 */
export const CheckoutShippingMethods: React.FC<Props> = ({
  isAr,
  methods,
  selectedId,
  onSelect,
  loading,
  money,
}) => {
  if (loading) {
    return (
      <p className="text-xs text-neutral-500">
        {isAr ? 'جارٍ تحميل خيارات الشحن…' : 'Loading shipping options…'}
      </p>
    );
  }

  if (!methods.length) {
    return (
      <p className="text-xs text-neutral-500">
        {isAr
          ? 'لا توجد طرق شحن مفعّلة لهذا المتجر حالياً'
          : 'No shipping methods are active for this store yet'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 text-neutral-700" />
        <h4 className="text-sm font-extrabold text-neutral-900">
          {isAr ? 'طرق الشحن' : 'Shipping Methods'}
        </h4>
      </div>

      <div className="space-y-2">
        {methods.map((m) => {
          const selected = selectedId === m.id;
          const title = isAr ? m.name_ar || m.name : m.name;
          const feeLabel = m.is_free || m.fee <= 0
            ? isAr
              ? 'مجاني'
              : 'FREE'
            : money(m.fee);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className={`w-full text-start rounded-2xl border p-3.5 transition-all cursor-pointer ${
                selected
                  ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/30'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {selected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-neutral-300 shrink-0" />
                    )}
                    <span className="text-sm font-bold text-neutral-900 truncate">{title}</span>
                    {m.courier_code ? (
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                        {m.courier_code}
                      </span>
                    ) : null}
                  </div>
                  {m.estimated_delivery ? (
                    <p className="text-[11px] text-neutral-500 flex items-center gap-1 ps-6">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {isAr ? 'الوقت المتوقع للتوصيل: ' : 'Estimated delivery: '}
                        {m.estimated_delivery}
                      </span>
                    </p>
                  ) : null}
                </div>
                <span className="text-sm font-black text-neutral-900 tabular-nums shrink-0">
                  {feeLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-neutral-500 leading-relaxed">
        {isAr
          ? 'وقت التوصيل والرسوم يُؤكدان عند إتمام الشراء حسب عنوانك وطريقة الشحن المختارة.'
          : 'Delivery time and charges are confirmed at checkout based on your address and selected method.'}
      </p>
    </div>
  );
};
