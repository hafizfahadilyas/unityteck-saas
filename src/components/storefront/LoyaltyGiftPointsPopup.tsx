import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Sparkles, X, Coins } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { fetchStorefrontLoyaltyBalanceApi } from '../../api/tenantApi';

export type LoyaltyGiftPayload = {
  points: number;
  reason?: string;
  balanceAfter?: number;
  sourceEventId?: string;
};

const SEEN_KEY = (storeId: string, customerId: string) =>
  `unityteck_loyalty_gift_seen_${storeId}_${customerId}`;

function readSeen(storeId: string, customerId: string): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY(storeId, customerId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function markSeen(storeId: string, customerId: string, eventId: string) {
  if (!eventId) return;
  const next = [...new Set([...readSeen(storeId, customerId), eventId])].slice(-40);
  try {
    localStorage.setItem(SEEN_KEY(storeId, customerId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Dispatch from spin / bonus / order flows so the popup opens immediately. */
export function emitLoyaltyGift(detail: LoyaltyGiftPayload & { storeId?: string }) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('unityteck-loyalty-gift', { detail }));
}

interface LoyaltyGiftPointsPopupProps {
  storeId: string;
  customerId?: string | null;
  /** Poll server for new credits (order / birthday awards). */
  pollMs?: number;
}

/**
 * Storefront gift popup when the customer earns loyalty points.
 * Shows on custom event + polls recent credits for this store_id only.
 */
export const LoyaltyGiftPointsPopup: React.FC<LoyaltyGiftPointsPopupProps> = ({
  storeId,
  customerId,
  pollMs = 45000,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [gift, setGift] = useState<LoyaltyGiftPayload | null>(null);

  const showGift = useCallback(
    (payload: LoyaltyGiftPayload) => {
      if (!payload.points || payload.points <= 0) return;
      const sid = storeId;
      const cid = customerId || '';
      if (payload.sourceEventId && cid) {
        const seen = readSeen(sid, cid);
        if (seen.includes(payload.sourceEventId)) return;
        markSeen(sid, cid, payload.sourceEventId);
      }
      setGift(payload);
      setOpen(true);
    },
    [storeId, customerId],
  );

  useEffect(() => {
    const onGift = (e: Event) => {
      const detail = (e as CustomEvent<LoyaltyGiftPayload>).detail;
      if (!detail) return;
      showGift(detail);
    };
    window.addEventListener('unityteck-loyalty-gift', onGift);
    return () => window.removeEventListener('unityteck-loyalty-gift', onGift);
  }, [showGift]);

  useEffect(() => {
    if (!storeId || !customerId) return;

    let cancelled = false;
    const check = async () => {
      try {
        const data = await fetchStorefrontLoyaltyBalanceApi(storeId, customerId);
        if (cancelled) return;
        const seen = readSeen(storeId, customerId);
        const newest = (data.recent_credits || []).find(
          (c) => c.source_event_id && !seen.includes(c.source_event_id),
        );
        if (newest && newest.points > 0) {
          showGift({
            points: newest.points,
            reason: newest.reason || newest.method,
            balanceAfter: data.loyalty_points,
            sourceEventId: newest.source_event_id,
          });
        }
        window.dispatchEvent(
          new CustomEvent('unityteck-loyalty-balance', {
            detail: { storeId, customerId, points: data.loyalty_points },
          }),
        );
      } catch {
        /* storefront may be offline — no fake points */
      }
    };

    void check();
    const t = window.setInterval(() => void check(), pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [storeId, customerId, pollMs, showGift]);

  if (!open || !gift) return null;

  return (
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'مكافأة نقاط الولاء' : 'Loyalty points gift'}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-2xl overflow-hidden animate-[fadeIn_0.25s_ease]">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 end-3 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-6 pt-8 pb-6 text-center text-white">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-3 shadow-lg">
            <Gift className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm font-bold opacity-95">
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'هدية نقاط الولاء' : 'Loyalty Points Gift'}</span>
          </div>
          <div className="mt-3 text-4xl font-black tracking-tight">
            +{gift.points}
          </div>
          <div className="text-sm font-semibold opacity-90 mt-1">
            {isAr ? 'نقطة مكافآت' : 'reward points'}
          </div>
        </div>

        <div className="px-6 py-5 space-y-3 text-center">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isAr
              ? 'تهانينا! تمت إضافة النقاط إلى رصيد ولاء هذا المتجر.'
              : 'Congrats! Points were added to this store’s loyalty balance.'}
          </p>
          {gift.reason ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{gift.reason}</p>
          ) : null}
          {typeof gift.balanceAfter === 'number' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-bold">
              <Coins className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? `رصيدك الحالي: ${gift.balanceAfter} نقطة`
                  : `Current balance: ${gift.balanceAfter} points`}
              </span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full mt-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm"
          >
            {isAr ? 'رائع!' : 'Awesome!'}
          </button>
          <p className="text-[10px] text-slate-400">
            {isAr
              ? 'تظهر النقاط في ملفك الشخصي وبطاقة الولاء داخل هذا المتجر فقط.'
              : 'Points appear in your profile & loyalty card for this store only.'}
          </p>
        </div>
      </div>
    </div>
  );
};
