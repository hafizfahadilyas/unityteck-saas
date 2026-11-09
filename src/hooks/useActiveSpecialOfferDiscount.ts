import { useEffect, useMemo, useState } from 'react';
import { fetchStorefrontActiveSpecialOfferApi } from '../api/tenantApi';
import {
  computeSpecialOfferDiscount,
  type SpecialOffer,
  type SpecialOfferLineItem,
} from '../services/specialOfferService';

/**
 * Loads the active special offer for a store and computes checkout discount for cart lines.
 */
export function useActiveSpecialOfferDiscount(
  storeId: string | undefined | null,
  lines: SpecialOfferLineItem[],
): { offer: SpecialOffer | null; discount: number } {
  const [offer, setOffer] = useState<SpecialOffer | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = (storeId || '').trim();
    if (!id) {
      setOffer(null);
      return;
    }
    void (async () => {
      try {
        const row = await fetchStorefrontActiveSpecialOfferApi(id);
        if (!cancelled) setOffer(row && row.storeId === id ? row : null);
      } catch {
        if (!cancelled) setOffer(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const discount = useMemo(
    () => computeSpecialOfferDiscount(offer, lines),
    [offer, lines],
  );

  return { offer, discount };
}
