import React, { useEffect, useState } from 'react';
import {
  fetchStoreReviews,
  fetchWidgetCategories,
  fetchWidgetProducts,
  subscribeStoreNewsletter,
} from '../../../../api/tenantApi';

type Device = 'desktop' | 'laptop' | 'tablet' | 'mobile';

function text(isAr: boolean, en?: string, ar?: string): string {
  return (isAr ? ar : en) || '';
}

function columnsFor(settings: Record<string, any> | undefined, device: Device): number {
  const columns = settings?.columns || {};
  if (device === 'mobile') return Number(columns.mobile || 1);
  if (device === 'tablet') return Number(columns.tablet || 2);
  return Number(columns.desktop || 4);
}

export function RichTextWidget({ settings, isAr }: { settings?: Record<string, any>; isAr: boolean }) {
  const html = text(isAr, settings?.htmlEn || settings?.contentEn || settings?.textEn, settings?.htmlAr || settings?.contentAr || settings?.textAr);
  if (!html.trim()) {
    return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'أضف نصاً' : 'Add text'}</p>;
  }
  return <div className="max-w-full px-4 py-3 text-sm break-words" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ImageWidget({ settings, isAr, device }: { settings?: Record<string, any>; isAr: boolean; device: Device }) {
  const [broken, setBroken] = useState(false);
  const mobile = device === 'mobile' ? settings?.mobileSrc || settings?.mobileImage : '';
  const src = String(mobile || settings?.src || settings?.image || settings?.imageUrl || '').trim();
  const alt = text(isAr, settings?.altEn, settings?.altAr);
  if (!src || broken) {
    return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'لا توجد صورة' : 'No image'}</p>;
  }
  const img = (
    <img
      src={src}
      alt={alt}
      className="max-w-full h-auto block"
      style={{ borderRadius: Number(settings?.radius || 0) }}
      onError={() => setBroken(true)}
    />
  );
  return settings?.link ? (
    <a href={settings.link} className="block max-w-full px-4 py-3">{img}</a>
  ) : (
    <div className="max-w-full px-4 py-3">{img}</div>
  );
}

export function ButtonWidget({ settings, isAr }: { settings?: Record<string, any>; isAr: boolean }) {
  const label = text(isAr, settings?.labelEn || settings?.buttonTextEn, settings?.labelAr || settings?.buttonTextAr);
  const href = String(settings?.buttonUrl || settings?.link || '').trim();
  if (!label && !href) {
    return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'أضف زراً' : 'Add a button'}</p>;
  }
  const external = /^https?:\/\//i.test(href);
  return (
    <div className="px-4 py-3">
      <a
        href={href || '#'}
        rel={settings?.rel || (external ? 'noopener noreferrer' : undefined)}
        target={external ? '_blank' : undefined}
        className="inline-flex max-w-full items-center gap-2 break-words px-4 py-2 text-sm font-bold text-white bg-slate-900"
      >
        {settings?.icon ? <span aria-hidden="true">{settings.icon}</span> : null}
        <span>{label || (isAr ? 'زر' : 'Button')}</span>
      </a>
    </div>
  );
}

export function BannerWidget({ settings, isAr }: { settings?: Record<string, any>; isAr: boolean }) {
  const ends = String(settings?.endsAt || '').trim();
  const endsTime = ends ? Date.parse(ends) : NaN;
  if (!ends || Number.isNaN(endsTime) || endsTime < Date.now()) {
    if (ends && !Number.isNaN(endsTime) && endsTime < Date.now()) return null;
  }
  const heading = text(isAr, settings?.headingEn || settings?.titleEn, settings?.headingAr || settings?.titleAr);
  const image = String(settings?.image || settings?.src || '').trim();
  if (!heading && !image) {
    return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'لا يوجد عرض' : 'No offer'}</p>;
  }
  return (
    <div className="max-w-full px-4 py-3">
      {image ? <img src={image} alt={heading} className="max-w-full h-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : null}
      {heading ? <h2 className="m-0 mt-2 text-lg font-bold break-words">{heading}</h2> : null}
      {ends && !Number.isNaN(endsTime) && endsTime >= Date.now() ? (
        <p className="m-0 mt-1 text-xs text-slate-600">{ends}</p>
      ) : null}
    </div>
  );
}

export function ProductsWidget({ settings, isAr, device, storeId }: { settings?: Record<string, any>; isAr: boolean; device: Device; storeId: string }) {
  const [rows, setRows] = useState<Array<{ id: string; name?: string; name_ar?: string; price?: string | number; store_id?: string }>>([]);
  const [ready, setReady] = useState(false);
  const source = settings?.source || 'latest';
  const limit = settings?.limit || 8;
  const category = settings?.category || '';
  const ids = Array.isArray(settings?.productIds) ? settings.productIds.join(',') : '';
  useEffect(() => {
    let alive = true;
    setReady(false);
    fetchWidgetProducts(storeId, { source, category, ids, limit }).then((data) => {
      if (alive) setRows(data.filter((row) => !row.store_id || row.store_id === storeId));
    }).catch(() => {
      if (alive) setRows([]);
    }).finally(() => {
      if (alive) setReady(true);
    });
    return () => { alive = false; };
  }, [storeId, source, limit, category, ids]);
  if (!ready) return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'جار التحميل' : 'Loading'}</p>;
  if (rows.length === 0) return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'لا توجد منتجات' : 'No products'}</p>;
  const cols = columnsFor(settings, device);
  return (
    <div className="grid gap-3 px-4 py-3 max-w-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {rows.map((row) => (
        <article key={row.id} className="min-w-0 border border-slate-200 p-2">
          <h3 className="m-0 text-sm font-bold break-words">{text(isAr, row.name, row.name_ar) || row.name || ''}</h3>
          <p className="m-0 text-xs">{row.price}</p>
        </article>
      ))}
    </div>
  );
}

export function CategoriesWidget({ settings, isAr, storeId }: { settings?: Record<string, any>; isAr: boolean; storeId: string }) {
  const [rows, setRows] = useState<Array<{ id: string; name?: string; name_ar?: string; store_id?: string }>>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchWidgetCategories(storeId).then((data) => {
      if (alive) setRows(data.filter((row) => !row.store_id || row.store_id === storeId));
    }).catch(() => { if (alive) setRows([]); }).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [storeId]);
  if (!ready) return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'جار التحميل' : 'Loading'}</p>;
  if (rows.length === 0) return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'لا توجد تصنيفات' : 'No categories'}</p>;
  return (
    <ul className="m-0 px-4 py-3 flex flex-wrap gap-2 list-none">
      {rows.slice(0, Number(settings?.limit || rows.length)).map((row) => (
        <li key={row.id} className="border border-slate-200 px-2 py-1 text-sm break-words">{text(isAr, row.name, row.name_ar)}</li>
      ))}
    </ul>
  );
}

export function FaqWidget({ settings, isAr }: { settings?: Record<string, any>; isAr: boolean }) {
  const items = (Array.isArray(settings?.items) ? settings.items : []).filter((item: any) => item?.visible !== false);
  if (items.length === 0) return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'لا توجد أسئلة' : 'No questions'}</p>;
  return (
    <div className="px-4 py-3 space-y-2">
      {items.map((item: any, index: number) => (
        <details key={index} className="border border-slate-200 px-3 py-2">
          <summary className="cursor-pointer text-sm font-bold break-words">{text(isAr, item.qEn, item.qAr)}</summary>
          <p className="m-0 mt-1 text-sm break-words">{text(isAr, item.aEn, item.aAr)}</p>
        </details>
      ))}
    </div>
  );
}

export function ReviewsWidget({ isAr, storeId }: { isAr: boolean; storeId: string }) {
  const [rows, setRows] = useState<Array<{ id?: string; rating?: number; comment?: string; commentAr?: string; author?: string }>>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchStoreReviews(storeId).then((data) => { if (alive) setRows(data); }).catch(() => { if (alive) setRows([]); }).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [storeId]);
  if (!ready) return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'جار التحميل' : 'Loading'}</p>;
  if (rows.length === 0) return <p className="m-0 px-4 py-3 text-xs text-slate-500">{isAr ? 'لا توجد تقييمات' : 'No reviews'}</p>;
  return (
    <ul className="m-0 px-4 py-3 space-y-2 list-none">
      {rows.map((row, index) => (
        <li key={row.id || index} className="border border-slate-200 p-2">
          <p className="m-0 text-xs">{Number(row.rating || 0)}/5</p>
          <p className="m-0 text-sm break-words">{text(isAr, row.comment, row.commentAr)}</p>
        </li>
      ))}
    </ul>
  );
}

export function UtilityWidget({ type, settings, isAr, storeId }: { type: string; settings?: Record<string, any>; isAr: boolean; storeId: string }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  if (type === 'video' || type === 'video_section' || type === 'w_video') {
    const url = String(settings?.videoUrl || '').trim();
    if (!url) return null;
    return <div className="px-4 py-3 max-w-full break-all text-sm">{url}</div>;
  }
  if (type === 'spacer') return <div style={{ height: Number(settings?.height || 24) }} />;
  if (type === 'divider') return <hr className="mx-4 my-3 border-slate-200" />;
  if (type === 'icon') return <p className="m-0 px-4 py-3 text-sm">{settings?.icon || ''}</p>;
  if (type === 'contact') {
    const value = text(isAr, settings?.addressEn, settings?.addressAr);
    return <p className="m-0 px-4 py-3 text-sm break-words">{value || (isAr ? 'لا توجد بيانات تواصل' : 'No contact details')}</p>;
  }
  if (type === 'newsletter') {
    return (
      <form
        className="px-4 py-3 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void subscribeStoreNewsletter(storeId, email).then(() => setDone(true)).catch(() => setDone(false));
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-w-0 flex-1 border border-slate-300 px-2 py-1 text-sm"
          placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
        />
        <button type="submit" className="px-3 py-1 text-sm font-bold bg-slate-900 text-white">{isAr ? 'اشتراك' : 'Subscribe'}</button>
        {done ? <span className="text-xs">{isAr ? 'تم الاشتراك' : 'Subscribed'}</span> : null}
      </form>
    );
  }
  return null;
}

const CONTENT_TYPES = new Set([
  'text_editor', 'w_text', 'rich_text',
  'image', 'image_widget', 'w_image', 'image_grid',
  'button', 'button_cta', 'w_button',
  'offer_banner', 'promo_banner', 'special_offer',
  'product_grid', 'product_section_natural', 'dynamic_product_row', 'w_product_grid',
  'circle_categories', 'category_grid', 'categories_grid', 'shop_by_category',
  'faq', 'reviews', 'customer_reviews', 'testimonials',
  'video', 'video_section', 'w_video', 'spacer', 'divider', 'icon', 'contact', 'newsletter',
]);

export function isContentWidget(type: string): boolean {
  return CONTENT_TYPES.has(type);
}

export function WidgetFields({
  type,
  settings,
  isAr,
  onChange,
}: {
  type: string;
  settings: Record<string, any>;
  isAr: boolean;
  onChange: (key: string, value: any) => void;
}) {
  if (!isContentWidget(type) && type !== 'hero_slider' && type !== 'hero' && type !== 'slider') return null;
  const field = (key: string, labelEn: string, labelAr: string, value: string) => (
    <label key={key} className="block text-[11px] font-bold text-slate-600">
      {isAr ? labelAr : labelEn}
      <input value={value} onChange={(event) => onChange(key, event.target.value)} className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-normal" />
    </label>
  );
  if (type === 'rich_text' || type === 'text_editor' || type === 'w_text') {
    return (
      <div className="space-y-2">
        {field('htmlEn', 'English text', 'النص الإنجليزي', settings.htmlEn || settings.textEn || '')}
        {field('htmlAr', 'Arabic text', 'النص العربي', settings.htmlAr || settings.textAr || '')}
      </div>
    );
  }
  if (type === 'image' || type === 'image_widget' || type === 'w_image' || type === 'image_grid') {
    return (
      <div className="space-y-2">
        {field('src', 'Image address', 'رابط الصورة', settings.src || settings.image || '')}
        {field('mobileSrc', 'Mobile image', 'صورة الجوال', settings.mobileSrc || '')}
        {field('altEn', 'English description', 'الوصف الإنجليزي', settings.altEn || '')}
        {field('altAr', 'Arabic description', 'الوصف العربي', settings.altAr || '')}
        {field('link', 'Link', 'الرابط', settings.link || '')}
      </div>
    );
  }
  if (type === 'button' || type === 'button_cta' || type === 'w_button') {
    return (
      <div className="space-y-2">
        {field('labelEn', 'English label', 'النص الإنجليزي', settings.labelEn || settings.buttonTextEn || '')}
        {field('labelAr', 'Arabic label', 'النص العربي', settings.labelAr || settings.buttonTextAr || '')}
        {field('buttonUrl', 'Link', 'الرابط', settings.buttonUrl || settings.link || '')}
      </div>
    );
  }
  if (type === 'hero_slider' || type === 'hero' || type === 'slider') {
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
          <input type="checkbox" checked={Boolean(settings.autoplay)} onChange={(event) => onChange('autoplay', event.target.checked)} />
          {isAr ? 'تشغيل تلقائي' : 'Autoplay'}
        </label>
      </div>
    );
  }
  if (type === 'offer_banner' || type === 'promo_banner' || type === 'special_offer') {
    return (
      <div className="space-y-2">
        {field('headingEn', 'English heading', 'العنوان الإنجليزي', settings.headingEn || '')}
        {field('headingAr', 'Arabic heading', 'العنوان العربي', settings.headingAr || '')}
        {field('endsAt', 'End time', 'وقت الانتهاء', settings.endsAt || '')}
      </div>
    );
  }
  if (type === 'faq') {
    const items = Array.isArray(settings.items) ? settings.items : [];
    const setItem = (index: number, key: string, value: string) => {
      const next = items.slice();
      next[index] = { ...items[index], [key]: value };
      onChange('items', next);
    };
    return (
      <div className="space-y-2">
        {items.map((item: any, index: number) => (
          <div key={index} className="space-y-1 border border-slate-200 rounded-lg p-2">
            <label className="block text-[11px] font-bold text-slate-600">
              {isAr ? 'السؤال العربي' : 'Arabic question'}
              <input
                value={item.qAr || ''}
                onChange={(event) => setItem(index, 'qAr', event.target.value)}
                className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-normal"
              />
            </label>
            <label className="block text-[11px] font-bold text-slate-600">
              {isAr ? 'السؤال الإنجليزي' : 'English question'}
              <input
                value={item.qEn || ''}
                onChange={(event) => setItem(index, 'qEn', event.target.value)}
                className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-normal"
              />
            </label>
            <label className="block text-[11px] font-bold text-slate-600">
              {isAr ? 'الجواب العربي' : 'Arabic answer'}
              <input
                value={item.aAr || ''}
                onChange={(event) => setItem(index, 'aAr', event.target.value)}
                className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-normal"
              />
            </label>
            <label className="block text-[11px] font-bold text-slate-600">
              {isAr ? 'الجواب الإنجليزي' : 'English answer'}
              <input
                value={item.aEn || ''}
                onChange={(event) => setItem(index, 'aEn', event.target.value)}
                className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-normal"
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-bold"
          onClick={() => onChange('items', [...items, { qEn: '', qAr: '', aEn: '', aAr: '', visible: true }])}
        >
          {isAr ? 'أضف سؤالاً' : 'Add a question'}
        </button>
      </div>
    );
  }
  return null;
}

export function ContentWidget(props: { type: string; settings?: Record<string, any>; isAr: boolean; device: Device; storeId: string }) {
  const { type, settings, isAr, device, storeId } = props;
  if (type === 'text_editor' || type === 'w_text' || type === 'rich_text') return <RichTextWidget settings={settings} isAr={isAr} />;
  if (type === 'image' || type === 'image_widget' || type === 'w_image' || type === 'image_grid') return <ImageWidget settings={settings} isAr={isAr} device={device} />;
  if (type === 'button' || type === 'button_cta' || type === 'w_button') return <ButtonWidget settings={settings} isAr={isAr} />;
  if (type === 'offer_banner' || type === 'promo_banner' || type === 'special_offer') return <BannerWidget settings={settings} isAr={isAr} />;
  if (type === 'product_grid' || type === 'product_section_natural' || type === 'dynamic_product_row' || type === 'w_product_grid') {
    return <ProductsWidget settings={settings} isAr={isAr} device={device} storeId={storeId} />;
  }
  if (type === 'circle_categories' || type === 'category_grid' || type === 'categories_grid' || type === 'shop_by_category') {
    return <CategoriesWidget settings={settings} isAr={isAr} storeId={storeId} />;
  }
  if (type === 'faq') return <FaqWidget settings={settings} isAr={isAr} />;
  if (type === 'reviews' || type === 'customer_reviews' || type === 'testimonials') return <ReviewsWidget isAr={isAr} storeId={storeId} />;
  return <UtilityWidget type={type} settings={settings} isAr={isAr} storeId={storeId} />;
}
