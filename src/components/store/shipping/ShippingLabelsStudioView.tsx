import React, { useMemo, useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { ModernSegmentedTabs } from '../../common/ModernSegmentedTabs';
import {
  generateCode128Svg,
  type CourierCarrierCode,
} from '../../../utils/courierBarcode';
import { generateQrSvgDataUri } from '../../../utils/zatca';
import {
  Truck,
  HelpCircle,
  CheckCircle2,
  Package,
  Printer,
  Download,
  MoreHorizontal,
  MapPin,
  ShieldCheck,
  Layers,
  ExternalLink,
  Eye,
} from 'lucide-react';
import {
  getCustomerDisplayName,
  getLocalizedAddress,
  getLocalizedCity,
} from '../../../utils/storeLocalization';
import { resolveStoreContact } from '../../../themes/settings/storeContact';
import { fetchNotificationSettingsApi } from '../../../api/tenantApi';
import { ShippingOrderDetailsSheet } from './ShippingOrderDetailsSheet';
import { ShippingOrderDetailsModal } from './ShippingOrderDetailsModal';

/** True only when THIS store has a real WhatsApp / SMS / Email channel connected. */
async function storeHasCustomerNotifyChannel(storeId: string | undefined | null): Promise<boolean> {
  if (!storeId) return false;
  try {
    const ns = await fetchNotificationSettingsApi(storeId);
    const ch = (ns as any)?.data?.channels ?? (ns as any)?.channels ?? {};
    return Boolean(ch?.whatsapp?.connected || ch?.sms?.connected || ch?.email?.connected);
  } catch {
    return false;
  }
}

interface ShippingLabelsStudioViewProps {
  initialOrderId?: string;
}

/** Real carrier refs only — never invent SPL… numbers. */
function realOrderAwb(order: {
  awbNumber?: string;
  shippingLabelNumber?: string;
  trackingNumber?: string;
} | null | undefined): string {
  if (!order) return '';
  return String(
    (order as { awbNumber?: string }).awbNumber ||
      order.shippingLabelNumber ||
      order.trackingNumber ||
      '',
  ).trim();
}

function realOrderTracking(order: {
  trackingNumber?: string;
  awbNumber?: string;
  shippingLabelNumber?: string;
} | null | undefined): string {
  if (!order) return '';
  return String(
    order.trackingNumber ||
      (order as { awbNumber?: string }).awbNumber ||
      order.shippingLabelNumber ||
      '',
  ).trim();
}

export const ShippingLabelsStudioView: React.FC<ShippingLabelsStudioViewProps> = ({ initialOrderId }) => {
  const { currentOrders, activeStore, currentShipments, createShipmentForOrder } = useTenant();
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history' | 'bulk' | 'failed'>('create');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const eligibleOrders = useMemo(() => {
    return (currentOrders || []).filter(
      (o) => o.status !== 'cancelled' && o.status !== 'completed' && o.status !== 'delivered',
    );
  }, [currentOrders]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrderId || (eligibleOrders[0]?.id ?? currentOrders[0]?.id ?? ''),
  );

  const selectedOrder = useMemo(() => {
    return (currentOrders || []).find((o) => o.id === selectedOrderId) || currentOrders[0] || null;
  }, [currentOrders, selectedOrderId]);

  const matchingShipment = useMemo(() => {
    if (!selectedOrder) return null;
    const list = currentShipments || [];
    return (
      list.find((s) => s.orderId === selectedOrder.id) ||
      list.find(
        (s) =>
          selectedOrder.trackingNumber &&
          (s.trackingNumber === selectedOrder.trackingNumber ||
            s.awbNumber === selectedOrder.trackingNumber),
      ) ||
      null
    );
  }, [currentShipments, selectedOrder]);

  const [selectedCourier, setSelectedCourier] = useState<CourierCarrierCode>('spl');
  const [serviceType, setServiceType] = useState<string>('standard');
  const [packageType, setPackageType] = useState<'box' | 'flyer' | 'pallet'>('box');
  const [weightKg, setWeightKg] = useState<number>(0.5);
  const [dimLength, setDimLength] = useState<number>(20);
  const [dimWidth, setDimWidth] = useState<number>(15);
  const [dimHeight, setDimHeight] = useState<number>(10);
  const [isCodEnabled, setIsCodEnabled] = useState<boolean>(selectedOrder?.paymentMethod === 'COD');
  const [isInsuranceEnabled, setIsInsuranceEnabled] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [generatedAwb, setGeneratedAwb] = useState<string>(() => realOrderAwb(selectedOrder));
  const [generatedTracking, setGeneratedTracking] = useState<string>(() => realOrderTracking(selectedOrder));
  const [capturedLabelUrl, setCapturedLabelUrl] = useState<string>(() =>
    String(matchingShipment?.labelUrl || '').trim(),
  );

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalOrderId, setDetailsModalOrderId] = useState<string | null>(null);
  const [detailsModalLabelUrl, setDetailsModalLabelUrl] = useState<string | null>(null);

  const storeContact = useMemo(() => {
    if (!activeStore?.id) return null;
    return resolveStoreContact(activeStore.id, activeStore);
  }, [activeStore]);

  const storePhone =
    storeContact?.phone ||
    storeContact?.whatsapp ||
    activeStore?.phone ||
    activeStore?.contactPhone ||
    '';
  const storeCity =
    getLocalizedCity((activeStore as { city?: string; cityAr?: string } | null)?.city, locale) || '';
  const storeAddressLine = storeCity || '—';

  React.useEffect(() => {
    if (!selectedOrder) {
      setGeneratedAwb('');
      setGeneratedTracking('');
      setCapturedLabelUrl('');
      return;
    }
    setIsCodEnabled(selectedOrder.paymentMethod === 'COD');
    const courier = (selectedOrder as { courierCode?: string }).courierCode || selectedOrder.shippingCompany;
    if (courier) {
      const c = String(courier).toLowerCase();
      if (c.includes('spl')) setSelectedCourier('spl');
      else if (c.includes('aramex')) setSelectedCourier('aramex');
      else if (c.includes('smsa')) setSelectedCourier('smsa');
      else if (c.includes('dhl')) setSelectedCourier('dhl');
    }
    setGeneratedAwb(realOrderAwb(selectedOrder));
    setGeneratedTracking(realOrderTracking(selectedOrder));
    const ship =
      (currentShipments || []).find((s) => s.orderId === selectedOrder.id) || null;
    setCapturedLabelUrl(String(ship?.labelUrl || '').trim());
  }, [selectedOrder, currentShipments]);

  const effectiveLabelUrl = String(
    capturedLabelUrl || matchingShipment?.labelUrl || '',
  ).trim();

  const orderItemsTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    return Number((selectedOrder as { totalAmount?: number }).totalAmount || selectedOrder.total || 0);
  }, [selectedOrder]);

  const shippingCost = useMemo(() => {
    if (!selectedOrder) return null as number | null;
    if (typeof selectedOrder.shippingFee === 'number' && Number.isFinite(selectedOrder.shippingFee)) {
      return selectedOrder.shippingFee;
    }
    const alt = (selectedOrder as { shippingCost?: number }).shippingCost;
    if (typeof alt === 'number' && Number.isFinite(alt)) return alt;
    return null;
  }, [selectedOrder]);

  const grandTotal = useMemo(() => {
    return orderItemsTotal + (shippingCost ?? 0);
  }, [orderItemsTotal, shippingCost]);

  const awbBarcodeSvg = useMemo(() => {
    if (!generatedTracking) return '';
    return generateCode128Svg(generatedTracking, {
      height: 48,
      barWidth: 2,
      showText: true,
    });
  }, [generatedTracking]);

  const qrDataUri = useMemo(() => {
    if (effectiveLabelUrl) return generateQrSvgDataUri(effectiveLabelUrl, 90);
    if (!generatedAwb && !selectedOrder) return generateQrSvgDataUri('WAITING', 90);
    const data =
      'ORDER:' +
      (selectedOrder?.orderNumber || selectedOrderId) +
      '|STORE:' +
      (activeStore?.id || '') +
      '|TRACK:' +
      (generatedAwb || generatedTracking || '');
    return generateQrSvgDataUri(data, 90);
  }, [
    effectiveLabelUrl,
    selectedCourier,
    generatedAwb,
    generatedTracking,
    selectedOrder,
    selectedOrderId,
    activeStore?.id,
  ]);

  const detailsModalOrder = useMemo(() => {
    if (!detailsModalOrderId) return null;
    return (currentOrders || []).find((o) => o.id === detailsModalOrderId) || null;
  }, [currentOrders, detailsModalOrderId]);

  const openOrderDetailsModal = (orderId: string, labelUrl?: string | null) => {
    setDetailsModalOrderId(orderId);
    setDetailsModalLabelUrl(labelUrl ? String(labelUrl).trim() : null);
    setDetailsModalOpen(true);
  };

  const handleCreateShipment = async () => {
    if (!selectedOrder) {
      toast(isAr ? 'يرجى اختيار طلب أولاً' : 'Please select an order first', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createShipmentForOrder(selectedOrder.id, selectedCourier as any, weightKg);
      if (res.success) {
        if (res.awb) setGeneratedAwb(res.awb);
        if (res.trackingNumber) setGeneratedTracking(res.trackingNumber);
        const fromRes = String(res.labelUrl || '').trim();
        if (fromRes) {
          setCapturedLabelUrl(fromRes);
        } else {
          const ship =
            (currentShipments || []).find((s) => s.orderId === selectedOrder.id) || null;
          const url = String(ship?.labelUrl || '').trim();
          if (url) setCapturedLabelUrl(url);
        }
        setCurrentStep(4);
        toast(
          isAr
            ? `تم إنشاء بوليصة الشحن بنجاح (رقم التتبع: ${res.trackingNumber || res.awb || '—'})`
            : `Shipping waybill created successfully (AWB: ${res.awb || res.trackingNumber || '—'})`,
          'success',
        );
        const channelsOk = await storeHasCustomerNotifyChannel(activeStore?.id);
        toast(
          channelsOk
            ? isAr
              ? 'سيتم إشعار العميل عبر واتساب / الرسائل النصية / البريد إن كانت القنوات متصلة لهذا المتجر'
              : 'Customer will be notified via WhatsApp / SMS / Email if channels are connected for this store'
            : isAr
              ? 'لم يتم الإشعار — اربط واتساب أو الرسائل النصية أو البريد لهذا المتجر أولاً'
              : 'Not notified — connect WhatsApp, SMS, or Email for this store first',
          channelsOk ? 'info' : 'info',
        );
      } else {
        toast(
          isAr ? 'فشل إنشاء بوليصة الشحن مع الناقل' : 'Failed to generate shipment waybill with carrier',
          'error',
        );
      }
    } catch {
      toast(isAr ? 'حدث خطأ في الاتصال بالخدمة' : 'Error connecting to carrier API', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintOrderDetails = () => {
    if (!selectedOrder) {
      toast(isAr ? 'لا توجد سجلات' : 'No records found', 'info');
      return;
    }
    openOrderDetailsModal(selectedOrder.id, effectiveLabelUrl || null);
  };

  const handleDownloadPdf = () => {
    if (!selectedOrder) {
      toast(isAr ? 'لا توجد سجلات' : 'No records found', 'info');
      return;
    }
    openOrderDetailsModal(selectedOrder.id, effectiveLabelUrl || null);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Truck className="w-5 h-5 rtl:rotate-180" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'بوالص الشحن والعمليات' : 'Shipping Labels & Operations'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إنشاء وطباعة وإدارة بوالص الشحن لطلبات متجرك بدقة وسرعة.'
                : 'Create, print, and manage shipping labels for your orders.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            toast(
              isAr
                ? 'دليل الربط اللوجستي: يمكنك طباعة تفاصيل الطلب أو البوليصة الرسمية عند توفر رابط الناقل.'
                : 'Help Guide: Print Order Details, or open the official carrier label when a label URL exists.',
              'info',
            )
          }
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs self-start sm:self-auto transition-colors"
        >
          <HelpCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span>{isAr ? 'دليل المساعدة' : 'Help Guide'}</span>
        </button>
      </div>

      <ModernSegmentedTabs
        accent="blue"
        aria-label={isAr ? 'أقسام بوالص الشحن' : 'Shipping label sections'}
        value={activeSubTab}
        onChange={(key) => setActiveSubTab(key as typeof activeSubTab)}
        items={[
          { id: 'create', label: isAr ? 'إنشاء بوليصة شحن' : 'Create Shipping Label' },
          { id: 'history', label: isAr ? 'سجل البوالص' : 'Label History' },
          { id: 'bulk', label: isAr ? 'إجراءات جماعية' : 'Bulk Actions' },
          { id: 'failed', label: isAr ? 'البوالص المتعثرة' : 'Failed Labels' },
        ]}
      />

      {activeSubTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between max-w-3xl mx-auto relative">
              <div className="absolute top-1/2 -translate-y-1/2 start-8 end-8 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />

              {[
                { step: 1, label: isAr ? 'اختيار الطلب' : 'Select Order' },
                { step: 2, label: isAr ? 'مراجعة التفاصيل' : 'Review Details' },
                { step: 3, label: isAr ? 'إنشاء البوليصة' : 'Create Label' },
                { step: 4, label: isAr ? 'الطباعة والإنجاز' : 'Print & Complete' },
              ].map((s) => {
                const isCompleted = currentStep > s.step;
                const isCurrent = currentStep === s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCurrentStep(s.step as 1 | 2 | 3 | 4)}
                    className="flex items-center gap-2 relative z-10 bg-white dark:bg-slate-900 px-2 group cursor-pointer"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'text-white ring-4 ring-[color:var(--accent)]/20'
                          : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                      style={isCurrent ? { background: 'var(--portal-cta)' } : undefined}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:inline ${
                        isCurrent
                          ? 'font-bold'
                          : isCompleted
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400'
                      }`}
                      style={isCurrent ? { color: 'var(--accent)' } : undefined}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {!selectedOrder ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600 rtl:rotate-180" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'لا توجد طلبات لإصدار بوالص الشحن' : 'No Orders Available for Shipping Labels'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isAr
                  ? 'بمجرد استلام طلبات جديدة في المتجر، ستتمكن من إصدار بوالص الشحن الرسمية وتتبعها وطباعتها فوراً.'
                  : 'Once customers place orders in your store, you will be able to generate and print official carrier waybills here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold" style={{ color: 'var(--accent)' }}>
                        {selectedOrder?.orderNumber ||
                          (selectedOrder ? `#${selectedOrder.id.slice(-8)}` : '—')}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isAr ? 'جاهز للشحن' : 'Ready to Ship'}</span>
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                        {(getCustomerDisplayName(selectedOrder?.customerName, locale) || 'C')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          {getCustomerDisplayName(selectedOrder?.customerName, locale)}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5" dir="ltr">
                          {selectedOrder?.customerPhone || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 pt-1">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {getLocalizedCity(
                            (selectedOrder as { city?: string })?.city,
                            locale,
                          ) ||
                            getLocalizedAddress(selectedOrder?.deliveryLocation, locale) ||
                            '—'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {getLocalizedAddress(
                            typeof selectedOrder?.shippingAddress === 'string'
                              ? selectedOrder.shippingAddress
                              : (selectedOrder?.shippingAddress as { address?: string } | undefined)
                                  ?.address || selectedOrder?.deliveryLocation,
                            locale,
                          ) || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                      {isAr ? 'تبديل الطلب' : 'Switch Order'}
                    </label>
                    <select
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    >
                      {eligibleOrders.map((ord) => (
                        <option key={ord.id} value={ord.id}>
                          {ord.orderNumber || `#${ord.id.slice(-8)}`} —{' '}
                          {getCustomerDisplayName(ord.customerName, locale)} (
                          {getLocalizedCity((ord as { city?: string }).city, locale) ||
                            getLocalizedAddress(ord.deliveryLocation, locale) ||
                            '—'}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2.5">
                      {isAr ? 'المنتجات' : 'Items'}
                    </span>

                    <div className="space-y-2">
                      {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.slice(0, 3).map((item, idx) => {
                          const itemImg = item.image || (item as { productImage?: string }).productImage;
                          const itemTitle =
                            item.name || (item as { productTitle?: string }).productTitle || '—';
                          const itemVar =
                            (item as { variantTitle?: string }).variantTitle ||
                            (isAr ? 'طرد الشحنة' : 'Package parcel');
                          return (
                            <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-amber-950/20 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                  {itemImg ? (
                                    <img
                                      src={itemImg}
                                      alt={itemTitle}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-semibold text-slate-900 dark:text-white truncate">
                                    {itemTitle}
                                  </h5>
                                  <p className="text-[11px] text-slate-500">{itemVar}</p>
                                </div>
                              </div>
                              <div className="text-end shrink-0">
                                <span className="text-[11px] font-bold text-slate-400 block">
                                  x {item.quantity}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {money(item.price)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-1 opacity-40" />
                          <p className="text-xs font-semibold">
                            {isAr ? 'لا توجد سجلات' : 'No records found'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'مجموع الطلب' : 'Order Total'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {money(orderItemsTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span>{isAr ? 'طريقة الشحن' : 'Shipping Method'}</span>
                      <button
                        type="button"
                        onClick={() =>
                          toast(
                            isAr ? 'يمكنك تغيير طريقة الشحن في الخطوة 2' : 'Change courier in section 2',
                            'info',
                          )
                        }
                        className="font-semibold hover:underline text-[11px]"
                        style={{ color: 'var(--accent)' }}
                      >
                        {isAr ? 'تعديل' : 'Edit'}
                      </button>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {selectedCourier.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isAr ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {shippingCost == null
                        ? '—'
                        : shippingCost === 0
                          ? isAr
                            ? 'مجاني'
                            : 'Free'
                          : money(shippingCost)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
                    <span>{isAr ? 'الإجمالي الكلي' : 'Total'}</span>
                    <span>{money(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <div className="space-y-4 text-xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                    {isAr ? 'تفاصيل الشحن والطرود' : 'Shipping Details'}
                  </h3>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'شركة الشحن' : 'Courier'}
                    </label>
                    <select
                      value={selectedCourier}
                      onChange={(e) => setSelectedCourier(e.target.value as CourierCarrierCode)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[color:var(--accent)]/20"
                    >
                      <option value="spl">{isAr ? 'البريد السعودي' : 'SPL'}</option>
                      <option value="aramex">{isAr ? 'أرامكس' : 'Aramex'}</option>
                      <option value="smsa">{isAr ? 'سمسا إكسبريس' : 'SMSA Express'}</option>
                      <option value="dhl">{isAr ? 'دي إتش إل إكسبريس' : 'DHL Express'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'نوع الخدمة' : 'Service Type'}
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[color:var(--accent)]/20"
                    >
                      <option value="standard">
                        {isAr ? 'توصيل قياسي (2-4 أيام)' : 'Standard Delivery (2-4 days)'}
                      </option>
                      <option value="express">
                        {isAr ? 'توصيل سريع (نفس اليوم / 24 ساعة)' : 'Express Delivery (Same Day / 24h)'}
                      </option>
                      <option value="economy">
                        {isAr ? 'شحن اقتصادي (3-5 أيام)' : 'Economy Freight (3-5 days)'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'نوع الطرد' : 'Package Type'}
                    </label>
                    <select
                      value={packageType}
                      onChange={(e) => setPackageType(e.target.value as 'box' | 'flyer' | 'pallet')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[color:var(--accent)]/20"
                    >
                      <option value="box">{isAr ? 'صندوق كرتوني' : 'Box'}</option>
                      <option value="flyer">{isAr ? 'كيس شحن' : 'Flyer / Pouch'}</option>
                      <option value="pallet">{isAr ? 'طبلية شحن' : 'Pallet'}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="col-span-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                        {isAr ? 'الوزن كجم' : 'Weight (KG)'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={weightKg}
                        onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.1)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-center text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                        {isAr ? 'الأبعاد سم: الطول × العرض × الارتفاع' : 'Dimensions (cm): L × W × H'}
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="number"
                          placeholder={isAr ? 'ط' : 'L'}
                          value={dimLength}
                          onChange={(e) => setDimLength(parseInt(e.target.value) || 1)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center font-bold text-slate-800 dark:text-slate-200"
                        />
                        <input
                          type="number"
                          placeholder={isAr ? 'ع' : 'W'}
                          value={dimWidth}
                          onChange={(e) => setDimWidth(parseInt(e.target.value) || 1)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center font-bold text-slate-800 dark:text-slate-200"
                        />
                        <input
                          type="number"
                          placeholder={isAr ? 'ا' : 'H'}
                          value={dimHeight}
                          onChange={(e) => setDimHeight(parseInt(e.target.value) || 1)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center font-bold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isAr ? 'خيارات الشحنة والدفع' : 'Shipment & payment options'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCodEnabled(true)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          isCodEnabled
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isAr ? 'عند الاستلام' : 'COD'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCodEnabled(false)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          !isCodEnabled
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isAr ? 'مدفوع مسبقاً' : 'Prepaid'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInsuranceEnabled(true)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          isInsuranceEnabled
                            ? 'text-white'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                        style={
                          isInsuranceEnabled
                            ? { background: 'var(--portal-cta)', borderColor: 'var(--portal-cta)' }
                            : undefined
                        }
                      >
                        {isAr ? 'تأمين' : 'Insurance'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInsuranceEnabled(false)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          !isInsuranceEnabled
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isAr ? 'بدون تأمين' : 'No insurance'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCreateShipment}
                    className="w-full py-2.5 px-3 rounded-lg disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    style={{ background: 'var(--portal-cta)' }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? isAr
                          ? 'جاري الربط مع الناقل...'
                          : 'Creating with Carrier...'
                        : isAr
                          ? 'إنشاء بوليصة الشحن وتثبيتها'
                          : 'Create & Validate Waybill'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Primary preview: Order Details sheet */}
              <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isAr ? 'معاينة تفاصيل الطلب' : 'Order Details Preview'}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {generatedTracking || (isAr ? 'بانتظار البيانات' : 'Waiting for Data')}
                    </span>
                  </div>

                  <div className="mt-3 max-h-[420px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-2">
                    <ShippingOrderDetailsSheet
                      order={selectedOrder}
                      store={activeStore}
                      locale={locale}
                      labelUrl={effectiveLabelUrl || null}
                      className="scale-[0.72] origin-top max-w-none shadow-none"
                    />
                  </div>

                  {/* Optional secondary thermal strip */}
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      {isAr ? 'معاينة حرارية اختيارية (4×6)' : 'Optional thermal preview (4×6)'}
                    </summary>
                    <div className="mt-2 p-3 rounded-xl border-2 border-slate-900 bg-white text-slate-950 font-sans shadow-sm select-none">
                      <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                        <div className="text-xl font-black tracking-tighter uppercase font-mono">
                          {selectedCourier.toUpperCase()}
                        </div>
                        <div className="text-end text-[9px] text-slate-500 font-mono">
                          {isAr ? 'طرود محلية' : 'DOMESTIC PARCEL'}
                        </div>
                      </div>
                      {generatedTracking ? (
                        <div className="my-2 flex flex-col items-center overflow-hidden">
                          <div
                            className="w-full flex justify-center"
                            dangerouslySetInnerHTML={{ __html: awbBarcodeSvg }}
                          />
                          <div className="text-xs font-mono font-bold tracking-widest mt-1">
                            {generatedTracking}
                          </div>
                        </div>
                      ) : (
                        <p className="py-4 text-center text-[11px] text-slate-500">
                          {isAr ? 'بانتظار رقم التتبع من الناقل' : 'Waiting for tracking from carrier'}
                        </p>
                      )}
                      <div className="grid grid-cols-12 gap-2 py-2 border-y border-slate-800 text-[10px]">
                        <div className="col-span-5 border-e border-slate-300 pe-1">
                          <span className="font-black block uppercase text-[9px] text-slate-500">
                            {isAr ? 'من:' : 'From:'}
                          </span>
                          <strong className="block truncate">
                            {activeStore?.name || (isAr ? 'المتجر' : 'Store')}
                          </strong>
                          <span className="block text-slate-600">{storeAddressLine}</span>
                          <span className="block font-mono text-slate-600" dir="ltr">
                            {storePhone || '—'}
                          </span>
                        </div>
                        <div className="col-span-4 border-e border-slate-300 pe-1">
                          <span className="font-black block uppercase text-[9px] text-slate-500">
                            {isAr ? 'إلى:' : 'To:'}
                          </span>
                          <strong className="block truncate">
                            {getCustomerDisplayName(selectedOrder?.customerName, locale)}
                          </strong>
                          <span className="block truncate text-slate-600">
                            {getLocalizedCity((selectedOrder as { city?: string })?.city, locale) ||
                              getLocalizedAddress(selectedOrder?.deliveryLocation, locale) ||
                              '—'}
                          </span>
                          <span className="block font-mono text-slate-600 truncate" dir="ltr">
                            {selectedOrder?.customerPhone || '—'}
                          </span>
                        </div>
                        <div className="col-span-3 flex items-center justify-center">
                          <img
                            src={qrDataUri}
                            alt={isAr ? 'رمز الاستجابة السريعة' : 'QR'}
                            className="w-14 h-14 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  {effectiveLabelUrl ? (
                    <a
                      href={effectiveLabelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[140px] py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                      <span>{isAr ? 'فتح البوليصة الرسمية' : 'Open official label'}</span>
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'طباعة ملف' : 'Print PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintOrderDetails}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer unity-btn-primary"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isAr ? 'معاينة وطباعة' : 'Preview & Print'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedOrder) openOrderDetailsModal(selectedOrder.id, effectiveLabelUrl || null);
                    }}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title={isAr ? 'عرض تفاصيل الطلب' : 'View Order Details'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'سجل بوالص الشحن المصدرة' : 'Generated Waybills History'}
            </h3>
            <span className="text-xs text-slate-500">
              {currentShipments.length} {isAr ? 'بوليصة' : 'waybills'}
            </span>
          </div>

          {currentShipments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {currentShipments.map((s) => {
                const matchedOrder = (currentOrders || []).find((o) => o.id === s.orderId);
                const shipLabel = String(s.labelUrl || '').trim();
                return (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase shrink-0">
                        {s.provider}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold font-mono text-slate-900 dark:text-white truncate">
                          {s.trackingNumber || s.awbNumber || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {isAr ? 'الطلب:' : 'Order:'}{' '}
                          {matchedOrder?.orderNumber || s.orderId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {shipLabel ? (
                        <a
                          href={shipLabel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-semibold inline-flex items-center gap-1"
                          style={{ color: 'var(--accent)' }}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {isAr ? 'البوليصة الرسمية' : 'Official label'}
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          if (!matchedOrder) {
                            toast(
                              isAr
                                ? 'لا يوجد طلب مطابق لهذه الشحنة'
                                : 'No matching order found for this shipment',
                              'info',
                            );
                            return;
                          }
                          setSelectedOrderId(matchedOrder.id);
                          setGeneratedTracking(s.trackingNumber || s.awbNumber || '');
                          setGeneratedAwb(s.awbNumber || s.trackingNumber || '');
                          setCapturedLabelUrl(shipLabel);
                          openOrderDetailsModal(matchedOrder.id, shipLabel || null);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-semibold"
                        style={{ color: 'var(--accent)' }}
                      >
                        {isAr ? 'معاينة وطباعة' : 'Preview & Print'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'bulk' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs text-center space-y-3">
          <Layers className="w-10 h-10 mx-auto" style={{ color: 'var(--accent)' }} />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'إصدار وطباعة بوالص الشحن الجماعية' : 'Bulk Shipping Waybill Generation'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr
              ? 'يتطلب الربط الفعلي مع شركة الشحن. لا يتم إنشاء بوالص وهمية.'
              : 'Requires a real connected courier. Fake batch waybills are never generated.'}
          </p>
          <button
            type="button"
            onClick={() => {
              toast(
                isAr
                  ? 'يجب ربط شركة الشحن أولاً. لا تتوفر طباعة جماعية وهمية.'
                  : 'Connect a courier first. No fake batch processing is available.',
                'info',
              );
            }}
            className="px-4 py-2 rounded-lg text-white text-xs font-bold shadow-xs transition-colors unity-btn-primary"
          >
            {isAr ? 'بدء الطباعة الجماعية' : 'Start Batch Processing'}
          </button>
        </div>
      )}

      {activeSubTab === 'failed' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'لا توجد بوالص متعثرة' : 'Zero Failed Labels'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'لا توجد سجلات فشل من واجهة الناقل لهذا المتجر.'
              : 'No failed carrier API records for this store.'}
          </p>
        </div>
      )}

      {detailsModalOpen && detailsModalOrder ? (
        <ShippingOrderDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setDetailsModalOrderId(null);
            setDetailsModalLabelUrl(null);
          }}
          order={detailsModalOrder}
          store={activeStore}
          locale={locale}
          labelUrl={detailsModalLabelUrl}
        />
      ) : null}
    </div>
  );
};
