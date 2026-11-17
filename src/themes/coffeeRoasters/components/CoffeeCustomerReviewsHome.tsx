import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import {
  fetchStoreReviewsApi,
  submitStoreReviewApi,
  type StoreReviewRecord,
} from '../../../api/tenantApi';
import type { CustomerReviewsSettings } from '../../settings/coffeeModularSettings';
import { CoffeeCustomerReviewsSection } from './CoffeeCustomerReviewsSection';

/** Homepage host — loads reviews API rows; chrome from `customerReviews` settings. */
export const CoffeeCustomerReviewsHome: React.FC<{
  settings: CustomerReviewsSettings | null | undefined;
}> = ({ settings }) => {
  const { language, showToast } = useCart();
  const { activeStore } = useTenant();
  const isAr = language === 'AR';
  const [rows, setRows] = useState<StoreReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const storeId = activeStore?.id;
    if (!storeId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchStoreReviewsApi(storeId)
      .then((list) => {
        if (!cancel) setRows(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancel) setRows([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [activeStore?.id]);

  if (!settings?.enabled) return null;

  return (
    <CoffeeCustomerReviewsSection
      settings={settings}
      rows={rows}
      lang={isAr ? 'ar' : 'en'}
      loading={loading}
      onSubmitReview={async ({ rating, comment }) => {
        if (!activeStore?.id) return;
        try {
          const created = await submitStoreReviewApi(activeStore.id, {
            author: isAr ? 'عميل' : 'Customer',
            city: '',
            product: '',
            rating,
            title: '',
            comment,
            verified: false,
            active: settings.requireApproval === false,
            likes: 0,
            date: new Date().toISOString().slice(0, 10),
          });
          if (created?.active) setRows((prev) => [created, ...prev]);
          showToast(
            settings.requireApproval !== false
              ? isAr
                ? 'تم إرسال التقييم وهو بانتظار الموافقة'
                : 'Review submitted and pending approval'
              : isAr
                ? 'تم نشر تقييمك'
                : 'Your review was published',
          );
        } catch {
          showToast(isAr ? 'تعذر إرسال التقييم' : 'Could not submit review');
          throw new Error('submit failed');
        }
      }}
    />
  );
};
