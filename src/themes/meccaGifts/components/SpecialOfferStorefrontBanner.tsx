import React, { useEffect, useState } from 'react';
import { fetchStorefrontActiveSpecialOfferApi } from '../../../api/tenantApi';
import type { SpecialOffer } from '../../../services/specialOfferService';
import { resolveProductThumb } from '../../../services/specialOfferService';
import { SpecialOfferPreviewCard } from '../../../components/store/SpecialOfferPreviewCard';
import { useTenant } from '../../../context/TenantContext';

type Props = {
  language: 'ar' | 'en';
};

/**
 * Active special offer customer banner on storefront (real API, per store_id).
 * Empty / no offer → renders nothing (no fake banner).
 */
export const SpecialOfferStorefrontBanner: React.FC<Props> = ({ language }) => {
  const { activeStore, currentProducts } = useTenant();
  const storeId = activeStore?.id || '';
  const isAr = language === 'ar';
  const [offer, setOffer] = useState<SpecialOffer | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!storeId) {
      setOffer(null);
      return;
    }
    void (async () => {
      try {
        const row = await fetchStorefrontActiveSpecialOfferApi(storeId);
        if (!cancelled) setOffer(row && row.storeId === storeId ? row : null);
      } catch {
        if (!cancelled) setOffer(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (!offer) return null;

  const title = isAr ? offer.titleAr || offer.titleEn : offer.titleEn || offer.titleAr;
  const discountLabel =
    offer.offerType === 'fixed'
      ? isAr
        ? `${offer.discountValue} ر.س خصم`
        : `${offer.discountValue} SAR OFF`
      : `${offer.discountValue}% OFF`;

  const thumbs = (offer.productIds || [])
    .map((id) => currentProducts.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 3)
    .map((p) => ({
      id: p!.id,
      name: isAr ? p!.nameAr || p!.name : p!.nameEn || p!.name,
      image: resolveProductThumb(p!) || null,
    }));

  return (
    <div className="mb-6">
      <SpecialOfferPreviewCard
        isAr={isAr}
        title={title}
        discountLabel={discountLabel}
        bannerBgColor={offer.bannerBgColor}
        bannerImage={offer.bannerImage}
        productThumbs={thumbs}
        compact
      />
    </div>
  );
};
