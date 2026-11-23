import React from 'react';

type Props = {
  language: 'ar' | 'en';
};

/**
 * Storefront cashback card — DISABLED for now (all stores).
 * Cashback / promo must be applied only by pasting a code the merchant shares privately.
 * Do not re-enable a public offer card until product asks for it.
 */
export const CashbackStorefrontBanner: React.FC<Props> = () => null;
