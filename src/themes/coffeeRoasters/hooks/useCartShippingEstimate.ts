import { useEffect, useMemo, useState } from 'react';
import { calculateShippingRates } from '../../../api/tenantApi';

export type CartShippingEstimate = {
  fee: number;
  isFree: boolean;
  /** True when API failed / no store config — do not show FREE */
  pending: boolean;
  loading: boolean;
  freeAbove: number | null;
  remainingToFree: number | null;
  methodLabel: string | null;
};

/**
 * Store-scoped shipping estimate for mini-cart / cart (never hardcoded FREE).
 * Uses real /shipping/calculate with cart product_ids + order total.
 */
export function useCartShippingEstimate(opts: {
  storeId?: string | null;
  cartTotal: number;
  productIds: string[];
  language?: 'AR' | 'EN';
  enabled?: boolean;
}): CartShippingEstimate {
  const { storeId, cartTotal, productIds, language = 'EN', enabled = true } = opts;
  const [fee, setFee] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [pending, setPending] = useState(true);
  const [loading, setLoading] = useState(false);
  const [freeAbove, setFreeAbove] = useState<number | null>(null);
  const [methodLabel, setMethodLabel] = useState<string | null>(null);

  const idsKey = useMemo(
    () =>
      productIds
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .sort()
        .join(','),
    [productIds],
  );

  useEffect(() => {
    if (!enabled || !storeId || cartTotal <= 0) {
      setFee(0);
      setIsFree(false);
      setPending(true);
      setFreeAbove(null);
      setMethodLabel(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const ids = idsKey ? idsKey.split(',').filter(Boolean) : [];

    void calculateShippingRates(storeId, {
      // Coffee warehouse origin = Makkah (default city for estimates).
      city: 'مكة',
      order_total: cartTotal,
      product_ids: ids.length ? ids : undefined,
      distance_km: 0,
    })
      .then((res) => {
        if (cancelled) return;
        const methods = Array.isArray(res?.available_methods) ? res.available_methods : [];
        const zoneFee = Number(res?.calculated_shipping_fee);
        const zoneFree = Boolean(res?.is_free_shipping);
        const hint = res?.fulfillment_hint ? String(res.fulfillment_hint) : '';
        const zoneThresholdRaw =
          res?.matched_zone?.free_above ?? res?.matched_zone?.freeAbove ?? null;
        const zoneThreshold =
          zoneThresholdRaw != null && Number.isFinite(Number(zoneThresholdRaw))
            ? Number(zoneThresholdRaw)
            : null;

        let pickedFee = Number.isFinite(zoneFee) ? zoneFee : 0;
        let pickedFree = zoneFree || pickedFee <= 0;
        let label: string | null = null;
        let threshold = zoneThreshold != null && zoneThreshold > 0 ? zoneThreshold : null;

        // Courier methods: show cheapest active method unless cart is own-delivery products.
        if (methods.length > 0 && hint !== 'own_delivery') {
          const ranked = [...methods].sort(
            (a, b) => (Number(a?.fee) || 0) - (Number(b?.fee) || 0),
          );
          const best = ranked[0];
          pickedFee = Number(best?.fee) || 0;
          pickedFree = Boolean(best?.is_free) || pickedFee <= 0;
          label =
            language === 'AR'
              ? String(best?.name_ar || best?.name || '').trim() || null
              : String(best?.name || best?.name_ar || '').trim() || null;
          const methodThreshold = best?.free_shipping_threshold ?? best?.freeShippingThreshold;
          if (methodThreshold != null && Number(methodThreshold) > 0) {
            threshold = Number(methodThreshold);
          }
        }

        const hasZone = Boolean(res?.matched_zone) || methods.length > 0 || hint === 'own_delivery';
        setFee(Math.max(0, Math.round(pickedFee * 100) / 100));
        setIsFree(Boolean(pickedFree));
        setPending(!hasZone && !Number.isFinite(zoneFee));
        setFreeAbove(threshold);
        setMethodLabel(label);
      })
      .catch(() => {
        if (cancelled) return;
        setFee(0);
        setIsFree(false);
        setPending(true);
        setFreeAbove(null);
        setMethodLabel(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeId, cartTotal, idsKey, language, enabled]);

  const remainingToFree =
    !isFree && freeAbove != null && freeAbove > 0 && cartTotal < freeAbove
      ? Math.max(0, Math.round((freeAbove - cartTotal) * 100) / 100)
      : null;

  return {
    fee: isFree ? 0 : fee,
    isFree: !pending && isFree,
    pending,
    loading,
    freeAbove,
    remainingToFree,
    methodLabel,
  };
}
