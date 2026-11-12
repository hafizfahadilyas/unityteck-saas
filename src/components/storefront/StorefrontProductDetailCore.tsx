/**
 * Dynamic single-product sections driven by catalog/API data (per store_id).
 * Themes wrap this with their chrome; empty configured fields render nothing.
 */
import React, { useMemo, useState } from 'react';
import type { Product } from '../../types';
import { ProductDynamicPurchase } from './ProductDynamicPurchase';
import { effectiveProductPricing } from '../../utils/productSaleSchedule';
import type { StoreReviewRow } from '../../api/tenantApi';
import { Star, ChevronDown, ShieldCheck } from 'lucide-react';
import { pickLocaleText } from '../../utils/localeLabel';

export interface StorefrontProductDetailCoreProps {
  product: Product;
  storeId: string;
  isAr: boolean;
  reviews?: StoreReviewRow[];
  reviewsLoading?: boolean;
  onAddToCart?: (opts: {
    selectedOptions: Record<string, string>;
    fieldValues: Record<string, unknown>;
    unitPrice: number;
  }) => void;
  onBuyNow?: () => void;
  tone?: 'coffee' | 'mecca' | 'neutral';
}

function money(amount: number, isAr: boolean): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const text = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return isAr ? `${text} ر.س` : `SAR ${text}`;
}

function discountPercent(regular: number, sale: number): number | null {
  if (regular <= 0 || sale >= regular) return null;
  return Math.round(((regular - sale) / regular) * 100);
}

export const StorefrontProductDetailCore: React.FC<StorefrontProductDetailCoreProps> = ({
  product,
  storeId,
  isAr,
  reviews = [],
  reviewsLoading = false,
  onAddToCart,
  onBuyNow,
  tone = 'neutral',
}) => {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [moreOpen, setMoreOpen] = useState(false);

  const title = pickLocaleText(product.name, product.nameAr, isAr);
  const subtitle = pickLocaleText(product.subtitle ?? '', product.subtitleAr ?? '', isAr);
  const pricing = useMemo(() => effectiveProductPricing(product), [product]);
  const pct = pricing.compareAt ? discountPercent(pricing.compareAt, pricing.price) : null;

  const gallery = useMemo(() => {
    const urls = [product.image, ...(product.galleryUrls || [])].filter((u) => u && String(u).trim());
    return Array.from(new Set(urls));
  }, [product]);

  const categories = product.categories?.length ? product.categories : product.category ? [product.category] : [];

  const avgRating = useMemo(() => {
    const rated = reviews.filter((r) => r.rating && r.rating > 0);
    if (!rated.length) return null;
    const sum = rated.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }, [reviews]);

  const inStock = product.stock > 0 || (product.variations || []).some((v) => v.isActive !== false && (v.unlimitedStock || (v.stock ?? 0) > 0));

  const hasMore =
    Boolean(product.description?.trim()) ||
    (product.customFields?.length ?? 0) > 0 ||
    Boolean(product.seoDescription?.trim()) ||
    Boolean(product.videoUrl) ||
    (gallery.length > 1);

  const purchaseTone = tone === 'coffee' ? 'coffee' : 'mecca';

  return (
    <div className="space-y-6" data-store-id={storeId} data-product-id={product.id}>
      <motionTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text, #0f172a)' }}>
        {title}
      </motionTitle>
      {subtitle ? (
        <p className="text-sm opacity-80" style={{ color: 'var(--muted, #64748b)' }}>
          {subtitle}
        </p>
      ) : null}

      {gallery.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {gallery.map((url) => (
            <div key={url} className="aspect-square rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-50">
              <img src={url} alt={title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <span className="text-2xl font-black font-mono" style={{ color: 'var(--text)' }}>
          {money(pricing.price, isAr)}
        </span>
        {pricing.compareAt != null ? (
          <span className="text-sm line-through opacity-60 font-mono">{money(pricing.compareAt, isAr)}</span>
        ) : null}
        {pct != null && pricing.saleActive ? (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            {isAr ? `خصم ${pct}%` : `${pct}% off`}
          </span>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <span
              key={cat}
              className="text-[11px] font-bold px-2 py-1 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              {cat}
            </span>
          ))}
        </div>
      ) : null}

      <p className="text-sm font-semibold" style={{ color: inStock ? '#059669' : '#e11d48' }}>
        {inStock
          ? isAr
            ? `متوفر — ${product.stock} قطعة`
            : `In stock — ${product.stock} units`
          : isAr
            ? 'غير متوفر'
            : 'Out of stock'}
      </p>

      {avgRating != null ? (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-current' : 'opacity-30'}`} />
            ))}
          </div>
          <span className="font-bold">{avgRating}</span>
          <span className="opacity-70">
            ({reviews.length} {isAr ? 'تقييم' : 'reviews'})
          </span>
        </div>
      ) : null}

      <ProductDynamicPurchase
        options={product.productOptions || []}
        variations={product.variations}
        fields={product.customFields}
        rules={product.conditionalRules}
        selected={selected}
        onSelect={setSelected}
        fieldValues={fieldValues}
        onFieldValues={setFieldValues}
        isAr={isAr}
        tone={purchaseTone}
        basePrice={pricing.price}
      />

      <div className="flex flex-wrap gap-2">
        {onAddToCart ? (
          <button
            type="button"
            disabled={!inStock}
            onClick={() =>
              onAddToCart({
                selectedOptions: selected,
                fieldValues,
                unitPrice: pricing.price,
              })
            }
            className="unity-btn-primary px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {isAr ? 'أضف إلى السلة' : 'Add to cart'}
          </button>
        ) : null}
        {onBuyNow ? (
          <button
            type="button"
            disabled={!inStock}
            onClick={onBuyNow}
            className="px-5 py-2.5 rounded-xl text-sm font-bold border"
            style={{ borderColor: 'var(--border)' }}
          >
            {isAr ? 'اشتري الآن' : 'Buy now'}
          </button>
        ) : null}
      </div>

      {hasMore ? (
        <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold"
            onClick={() => setMoreOpen((o) => !o)}
          >
            <span>{isAr ? 'خيارات إضافية' : 'More options'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </button>
          {moreOpen ? (
            <div className="px-4 pb-4 space-y-4 text-sm border-t" style={{ borderColor: 'var(--border)' }}>
              {product.description?.trim() ? (
                <motionBlock
                  className={PRODUCT_DESCRIPTION_PROSE_CLASS}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : null}
              {product.videoUrl ? (
                <video src={product.videoUrl} controls className="w-full max-h-80 rounded-xl" />
              ) : null}
              {product.seoDescription?.trim() ? (
                <p className="opacity-80 whitespace-pre-wrap">{product.seoDescription}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {reviews.length > 0 || reviewsLoading ? (
        <section className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-extrabold">{isAr ? 'تقييمات العملاء' : 'Customer reviews'}</h3>
          {reviewsLoading ? (
            <p className="text-sm opacity-70">{isAr ? 'جاري التحميل...' : 'Loading…'}</p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((rev) => (
                <li key={rev.id || `${rev.author}-${rev.date}`} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{rev.author || (isAr ? 'عميل' : 'Customer')}</span>
                    {rev.verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {isAr ? 'شراء موثق' : 'Verified purchase'}
                      </span>
                    ) : null}
                    {rev.rating ? (
                      <span className="text-amber-500 text-xs font-bold">
                        {'★'.repeat(rev.rating)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm mt-1 opacity-90">{isAr ? rev.commentAr || rev.comment : rev.comment || rev.commentAr}</p>
                  {rev.media_urls?.length || rev.image_url ? (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(rev.media_urls?.length ? rev.media_urls : rev.image_url ? [rev.image_url] : []).map((url) => (
                        <img key={url} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
};

/** Tiny helpers to avoid pulling framer-motion into every theme */
function motionTitle({ children, className, style }: React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) {
  return (
    <h1 className={className} style={style}>
      {children}
    </h1>
  );
}

function motionBlock({ className, dangerouslySetInnerHTML }: { className?: string; dangerouslySetInnerHTML?: { __html: string } }) {
  return <div className={className} dangerouslySetInnerHTML={dangerouslySetInnerHTML} />;
}

const PRODUCT_DESCRIPTION_PROSE_CLASS = 'prose prose-sm max-w-none dark:prose-invert';
