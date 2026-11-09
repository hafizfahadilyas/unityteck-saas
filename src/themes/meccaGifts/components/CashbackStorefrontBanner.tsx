import React, { useEffect, useState } from 'react';
import { fetchStorefrontActiveCashbackApi } from '../../../api/tenantApi';
import type { CashbackCampaign } from '../../../services/cashbackService';
import { CashbackOfferPreviewCard } from '../../../components/store/CashbackOfferPreviewCard';
import { useTenant } from '../../../context/TenantContext';

type Props = {
  language: 'ar' | 'en';
};

/**
 * Shows the active cashback offer on storefront cart (real API, per store_id).
 * Empty / no campaign → renders nothing (no fake offer).
 */
export const CashbackStorefrontBanner: React.FC<Props> = ({ language }) => {
  const { activeStore } = useTenant();
  const storeId = activeStore?.id || '';
  const isAr = language === 'ar';
  const [campaign, setCampaign] = useState<CashbackCampaign | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!storeId) {
      setCampaign(null);
      return;
    }
    void (async () => {
      try {
        const row = await fetchStorefrontActiveCashbackApi(storeId);
        if (!cancelled) setCampaign(row && row.storeId === storeId ? row : null);
      } catch {
        if (!cancelled) setCampaign(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (!campaign) return null;

  return (
    <div className="mb-6">
      <CashbackOfferPreviewCard
        isAr={isAr}
        type={campaign.type}
        value={campaign.value}
        minCartValue={campaign.minCartValue}
        enableMinCart={campaign.minCartValue > 0}
        imageUrl={campaign.imageUrl}
        compact
      />
    </div>
  );
};
