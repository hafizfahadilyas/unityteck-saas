import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { cartChoiceLine } from '../cartLine';
import {
  CheckCircle2,
  Package,
  Share2,
  Download,
  ArrowRight,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';

import { useTenant } from '../../../context/TenantContext';
import {
  thankYouOrderNumber,
  mapApiLineToCartItem,
  mergeOrderItemsPreferNonEmpty,
  normalizeOrderNumberKey,
  orderRecordFromApiLike,
  readPersistedLastOrder,
} from '../thankYouOrder';
import type { OrderItemRecord } from '../context/CartContext';
import {
  StorefrontTaxInvoice,
  type StorefrontInvoiceData,
} from '../../../components/storefront/invoice/StorefrontTaxInvoice';
import {
  buildInvoicePdfFromElement,
  downloadBlob,
  shareInvoicePdfViaWhatsApp,
} from '../../../utils/invoicePdf';
import { resolveStoreContact } from '../../settings/storeContact';
import { trackStorefrontOrder } from '../../../api/tenantApi';
import { isApiEnabled } from '../../../api/client';
import { localizePaymentMethod } from '../../../utils/domainLabels';

function tenantOrderToRecord(row: any, isAr: boolean): OrderItemRecord {
  return orderRecordFromApiLike(
    {
      id: row.id,
      order_number: row.orderNumber || row.order_number,
      order_date: row.date || row.order_date,
      items: (row.items || []).map((it: any) => ({
        id: it.id,
        product_id: it.productId || it.sku || it.id,
        product_name: it.name || it.productName,
        unit_price: it.price ?? it.unitPrice,
        quantity: it.quantity,
        image: it.image,
        image_url: it.image,
        variation_id: it.variationId,
        selected_options: it.selectedOptions,
      })),
      total_amount: row.total,
      shipping_cost: row.shippingFee,
      payment_method: row.paymentMethod,
      customer_name: row.customerName,
      customer_phone: row.customerPhone,
      delivery_location: row.deliveryLocation || row.shippingAddress,
      status: row.status,
      customer_notes: row.customerNotes,
    },
    isAr,
  );
}

export const ThankYouPage: React.FC = () => {
  const { lastOrder, setLastOrder, navigateTo, language, showToast, user } = useCart();
  const { activeStore, currentOrders } = useTenant();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'wa' | 'pdf' | null>(null);
  const [hydratedOrder, setHydratedOrder] = useState<OrderItemRecord | null>(null);
  const [hydrateBusy, setHydrateBusy] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'AR';
  const hydrateAttempted = useRef<string>('');

  const persisted = activeStore?.id ? readPersistedLastOrder(activeStore.id) : null;

  const fromTenant = useMemo(() => {
    if (!currentOrders?.length) return null;
    const want = normalizeOrderNumberKey(
      lastOrder?.orderNumber || persisted?.orderNumber || currentOrders[0]?.orderNumber,
    );
    const hit =
      (want
        ? currentOrders.find((o) => normalizeOrderNumberKey(o.orderNumber) === want)
        : null) || currentOrders[0];
    return hit ? tenantOrderToRecord(hit, isAr) : null;
  }, [currentOrders, lastOrder?.orderNumber, persisted?.orderNumber, isAr]);

  const baseOrder = useMemo(
    () =>
      mergeOrderItemsPreferNonEmpty(
        mergeOrderItemsPreferNonEmpty(lastOrder, persisted),
        fromTenant,
      ),
    [lastOrder, persisted, fromTenant],
  );

  const order = mergeOrderItemsPreferNonEmpty(hydratedOrder, baseOrder);

  useEffect(() => {
    if (!activeStore?.id || !isApiEnabled()) return;
    const seed = mergeOrderItemsPreferNonEmpty(lastOrder, persisted) || fromTenant;
    const number = thankYouOrderNumber(seed);
    if (!number) return;
    if (Array.isArray(seed?.items) && seed!.items.length > 0) {
      if (seed && (!lastOrder || (lastOrder.items || []).length === 0)) {
        setLastOrder(seed);
      }
      return;
    }
    const phone = seed?.shippingAddress?.phone || user?.phone || '';
    if (!phone || hydrateAttempted.current === number) return;
    hydrateAttempted.current = number;
    let cancelled = false;
    setHydrateBusy(true);
    void trackStorefrontOrder(activeStore.id, {
      order_number: number,
      phone,
      store_id: activeStore.id,
    })
      .then((res) => {
        if (cancelled || !res) return;
        const row = res as unknown as Record<string, unknown>;
        const items = Array.isArray(row.items) ? row.items : [];
        if (!items.length && !row.total_amount && !row.order_number) return;
        const mapped = orderRecordFromApiLike(
          {
            ...row,
            items: items.length
              ? items
              : (seed?.items || []).map((it, idx) => ({
                  id: it.id,
                  product_id: it.productId,
                  product_name: it.productName,
                  unit_price: it.unitPrice,
                  quantity: it.quantity,
                  image: it.image,
                })),
            customer_name: row.customer_name || seed?.shippingAddress?.name,
            customer_phone: row.customer_phone || seed?.shippingAddress?.phone,
            delivery_location:
              row.delivery_location ||
              [seed?.shippingAddress?.city, seed?.shippingAddress?.district, seed?.shippingAddress?.street]
                .filter(Boolean)
                .join(' - '),
            payment_method: row.payment_method || seed?.paymentMethod,
            total_amount: row.total_amount ?? seed?.total,
            shipping_cost: row.shipping_cost ?? seed?.shippingFee,
          },
          isAr,
        );
        if (!mapped.items.length && seed?.items?.length) {
          mapped.items = seed.items;
        }
        setHydratedOrder(mapped);
        setLastOrder(mergeOrderItemsPreferNonEmpty(mapped, seed));
      })
      .catch(() => {
        /* keep session order — never invent lines */
      })
      .finally(() => {
        if (!cancelled) setHydrateBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    activeStore?.id,
    lastOrder,
    persisted,
    fromTenant,
    user?.phone,
    isAr,
    setLastOrder,
  ]);

  const orderShippingFee =
    order && typeof order.shippingFee === 'number' && Number.isFinite(order.shippingFee)
      ? Math.max(0, order.shippingFee)
      : null;

  const shownNumber = thankYouOrderNumber(order);

  const contact = useMemo(() => {
    if (!activeStore?.id) return { phone: '', email: '', whatsapp: '' };
    return resolveStoreContact(activeStore.id, activeStore);
  }, [activeStore]);

  const invoiceData: StorefrontInvoiceData | null = useMemo(() => {
    if (!order || !shownNumber) return null;
    const grandTotal = Number(order.total) || 0;
    const ship = orderShippingFee;
    const goods = Math.max(0, grandTotal - (ship != null && ship > 0 ? ship : 0));
    const vatAmount = Math.round(((goods * 0.15) / 1.15) * 100) / 100;
    const subtotalExcl = Math.max(0, Math.round((goods - vatAmount) * 100) / 100);

    const storeName =
      activeStore?.nameEn ||
      activeStore?.name ||
      (isAr ? 'متجر القهوة المختصة' : 'Specialty Coffee Store');
    const storeNameAr = activeStore?.nameAr || activeStore?.name || storeName;
    const lineItems = Array.isArray(order.items) ? order.items : [];

    return {
      storeName,
      storeNameAr,
      storeSubtitleEn: 'Official Authorized Coffee Equipment Store',
      storeSubtitleAr: 'المتجر الرسمي المعتمد لمكائن ومستلزمات القهوة',
      storeAddressEn: activeStore?.domain
        ? `Saudi Arabia · ${activeStore.domain}`
        : 'Kingdom of Saudi Arabia',
      storeAddressAr: activeStore?.domain
        ? `المملكة العربية السعودية · ${activeStore.domain}`
        : 'المملكة العربية السعودية',
      storePhone: contact.phone || contact.whatsapp || activeStore?.phone || '',
      storeEmail: contact.email || '',
      vatNumber: activeStore?.taxNumber || '',
      crNumber: activeStore?.crNumber || '',
      logoUrl: activeStore?.logo || '',
      invoiceNumber: shownNumber,
      orderNumber: order.orderNumber || shownNumber,
      invoiceDate: order.date,
      orderDate: order.date,
      customerName: order.shippingAddress.name,
      customerPhone: order.shippingAddress.phone,
      customerEmail: order.customerEmail || user?.email || '',
      city: order.shippingAddress.city,
      district: order.shippingAddress.district,
      street: order.shippingAddress.street,
      paymentMethodLabel: localizePaymentMethod(order.paymentMethod, isAr ? 'ar' : 'en'),
      shippingLabel: order.shippingMethodLabel
        ? order.shippingMethodLabel
        : ship == null
          ? isAr
            ? 'حسب إعدادات المتجر'
            : 'Per store settings'
          : ship <= 0
            ? isAr
              ? 'مجاناً'
              : 'Free'
            : isAr
              ? `${ship.toLocaleString('ar-SA')} ⃁`
              : `⃁ ${ship.toLocaleString('en-SA')}`,
      warrantyLabel: isAr ? 'سنتان — وكيل معتمد' : '2-Year Official Agency',
      checkoutNotes: order.customerNotes || undefined,
      items: lineItems.map((item, idx) => {
        const cartLike =
          item && 'productName' in item
            ? item
            : mapApiLineToCartItem(item as unknown as Record<string, unknown>, idx, isAr);
        return {
          id: String(cartLike.id || idx),
          name: cartLike.productName || (isAr ? 'منتج' : 'Product'),
          sku: String(cartLike.productId || ''),
          image: cartLike.image,
          quantity: cartLike.quantity || 1,
          unitPrice: cartLike.unitPrice || 0,
          note: [
            cartChoiceLine(cartLike, isAr),
            'purchaseNotes' in cartLike && cartLike.purchaseNotes?.length
              ? cartLike.purchaseNotes.join(' · ')
              : '',
          ]
            .filter(Boolean)
            .join(' · '),
        };
      }),
      subtotal: subtotalExcl + vatAmount,
      shippingFee: ship,
      vatAmount,
      grandTotal,
      currencyLabel: '⃁',
    };
  }, [order, shownNumber, activeStore, contact, isAr, orderShippingFee, user?.email]);

  const handleCopyOrderId = () => {
    if (!shownNumber) return;
    void navigator.clipboard.writeText(shownNumber);
    setCopied(true);
    showToast(isAr ? 'تم نسخ رقم الطلب!' : 'Order ID copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const capturePdf = async () => {
    const el = invoiceRef.current;
    if (!el || !shownNumber) {
      throw new Error('invoice-missing');
    }
    return buildInvoicePdfFromElement(el, `invoice-${shownNumber}`);
  };

  const handleDownloadPdf = async () => {
    if (busy) return;
    setBusy('pdf');
    try {
      const pdf = await capturePdf();
      downloadBlob(pdf.blob, pdf.fileName);
      showToast(isAr ? 'تم تحميل فاتورة PDF بنجاح' : 'PDF invoice downloaded');
    } catch {
      window.print();
      showToast(
        isAr
          ? 'افتح نافذة الطباعة واختر حفظ كملف PDF'
          : 'Use the print dialog and choose Save as PDF',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleShareWhatsAppPdf = async () => {
    if (busy || !shownNumber || !invoiceData) return;
    setBusy('wa');
    try {
      const pdf = await capturePdf();
      const caption = isAr
        ? `فاتورة ضريبية PDF — رقم ${shownNumber}\nالمبلغ: ${invoiceData.grandTotal.toLocaleString('ar-SA')} ⃁\n(تم إرفاق / تنزيل ملف PDF)`
        : `Tax invoice PDF — ${shownNumber}\nAmount: ⃁ ${invoiceData.grandTotal.toLocaleString('en-SA')}\n(PDF attached / downloaded)`;

      const result = await shareInvoicePdfViaWhatsApp({
        file: pdf.file,
        caption,
      });

      showToast(
        result === 'shared'
          ? isAr
            ? 'تم مشاركة فاتورة PDF عبر واتساب'
            : 'PDF invoice shared on WhatsApp'
          : isAr
            ? 'تم تنزيل PDF — أرفقه في واتساب إن لزم'
            : 'PDF downloaded — attach it in WhatsApp if needed',
      );
    } catch {
      const short = isAr
        ? `مرحباً، فاتورة الطلب ${shownNumber} — يرجى طلب ملف PDF.`
        : `Hello, order invoice ${shownNumber} — please request the PDF file.`;
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(short)}`,
        '_blank',
        'noopener,noreferrer',
      );
      showToast(
        isAr
          ? 'تعذر إنشاء PDF تلقائياً — استخدم زر التحميل ثم أرفق الملف في واتساب'
          : 'Could not auto-build PDF — use Download then attach the file in WhatsApp',
      );
    } finally {
      setBusy(null);
    }
  };

  if (!order || !shownNumber || !invoiceData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-[#F8F9FA]">
        <Package className="w-16 h-16 text-neutral-400 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          {hydrateBusy
            ? isAr
              ? 'جاري تحميل الفاتورة…'
              : 'Loading invoice…'
            : isAr
              ? 'لا يوجد طلب حديث لعرضه'
              : 'No Recent Order Found'}
        </h2>
        <p className="text-xs text-neutral-500 mb-6 max-w-sm">
          {isAr
            ? 'لم يتم العثور على تفاصيل طلب في جلستك الحالية. يمكنك تصفح المنتجات وإجراء طلبك الآن.'
            : 'No active order details were found in your current session. Browse our catalog and place your order.'}
        </p>
        <button
          onClick={() => navigateTo('products')}
          className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {isAr ? 'تصفح المنتجات' : 'Browse Products'}
        </button>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F8F9FA] py-6 sm:py-12 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white overflow-x-hidden"
    >
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          body * { visibility: hidden !important; }
          #thankyou-invoice-print, #thankyou-invoice-print * { visibility: visible !important; }
          #thankyou-invoice-print {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #fff !important;
          }
          .no-print { display: none !important; visibility: hidden !important; }
        }
      `}</style>

      <div className="max-w-[960px] mx-auto px-3 sm:px-6 w-full min-w-0">
        <div className="no-print bg-white rounded-3xl p-5 sm:p-10 shadow-sm border border-neutral-100 text-center space-y-4 mb-5 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-block">
              {isAr ? 'تم تأكيد طلبك بنجاح' : 'Order Confirmed'}
            </span>
            <h1
              className={`honor-heading text-2xl sm:text-4xl font-extrabold text-neutral-950 ${
                isAr ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
              }`}
            >
              {isAr ? 'شكراً لطلبك!' : 'Thank You for Your Order!'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed">
              {isAr
                ? 'تم استلام طلبك وجاري تجهيزه للشحن السريع. يمكنك مشاركة فاتورة PDF عبر واتساب أو طباعتها وتحميلها.'
                : 'Your order has been received and is being prepared for express delivery. Share the PDF invoice on WhatsApp or print / download it.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-2 px-1">
            <button
              type="button"
              onClick={() => void handleShareWhatsAppPdf()}
              disabled={Boolean(busy) || invoiceData.items.length === 0}
              className="px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba5a] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
            >
              {busy === 'wa' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>
                {isAr ? 'مشاركة فاتورة PDF عبر واتساب' : 'Share PDF Invoice on WhatsApp'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={Boolean(busy)}
              className="px-5 py-3 rounded-full bg-neutral-900 hover:bg-black disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {busy === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isAr ? 'طباعة / تحميل PDF' : 'Print / Download PDF'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-1">
            <span>{isAr ? 'رقم الفاتورة:' : 'Invoice No:'}</span>
            <span className="font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
              {shownNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer"
              title={isAr ? 'نسخ' : 'Copy'}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div id="thankyou-invoice-print" className="mb-6">
          <StorefrontTaxInvoice
            ref={invoiceRef}
            data={invoiceData}
            isAr={isAr}
            mode="screen"
          />
        </div>

        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-neutral-300 hover:border-black text-xs font-bold text-neutral-900 transition-colors cursor-pointer text-center"
          >
            {isAr ? 'عرض حسابي وسجل الطلبات' : 'View Profile & Orders'}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95"
          >
            <span>{isAr ? 'متابعة التسوق' : 'Continue Shopping'}</span>
            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
