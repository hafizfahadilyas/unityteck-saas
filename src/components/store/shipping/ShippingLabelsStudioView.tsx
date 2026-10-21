import React, { useMemo, useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import type { Order } from '../../../types';
import {
  generateCode128Svg,
  getCarrierBrand,
  type CourierCarrierCode,
  type ShippingLabelData,
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
  Phone,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  Search,
  ExternalLink,
  Layers,
  FileText,
  AlertCircle,
  Copy,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface ShippingLabelsStudioViewProps {
  initialOrderId?: string;
}

export const ShippingLabelsStudioView: React.FC<ShippingLabelsStudioViewProps> = ({ initialOrderId }) => {
  const { currentOrders, activeStore, currentShipments, createShipmentForOrder } = useTenant();
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  // Sub-tabs: Create Shipping Label, Label History, Bulk Actions, Failed Labels
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history' | 'bulk' | 'failed'>('create');

  // Stepper state (1 to 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Ready orders for shipping selection
  const eligibleOrders = useMemo(() => {
    return (currentOrders || []).filter(
      (o) => o.status !== 'cancelled' && o.status !== 'completed' && o.status !== 'delivered'
    );
  }, [currentOrders]);

  // Selected Order
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrderId || (eligibleOrders[0]?.id ?? currentOrders[0]?.id ?? '')
  );

  const selectedOrder = useMemo(() => {
    return (currentOrders || []).find((o) => o.id === selectedOrderId) || currentOrders[0] || null;
  }, [currentOrders, selectedOrderId]);

  // Shipping Details Form State
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

  // Generated Tracking Info
  const [generatedAwb, setGeneratedAwb] = useState<string>(
    (selectedOrder as any)?.awbNumber || selectedOrder?.shippingLabelNumber || (selectedOrder ? `SPL${selectedOrder.id.replace(/\D/g, '').padEnd(9, '0').slice(-9)}` : '')
  );
  const [generatedTracking, setGeneratedTracking] = useState<string>(
    selectedOrder?.trackingNumber || (selectedOrder ? `SPL${selectedOrder.id.replace(/\D/g, '').padEnd(9, '0').slice(-9)}` : '')
  );

  // Sync COD status when order changes
  React.useEffect(() => {
    if (selectedOrder) {
      setIsCodEnabled(selectedOrder.paymentMethod === 'COD');
      const courier = (selectedOrder as any).courierCode || selectedOrder.shippingCompany;
      if (courier) {
        const c = String(courier).toLowerCase();
        if (c.includes('spl')) setSelectedCourier('spl');
        else if (c.includes('aramex')) setSelectedCourier('aramex');
        else if (c.includes('smsa')) setSelectedCourier('smsa');
        else if (c.includes('dhl')) setSelectedCourier('dhl');
      }
      setGeneratedAwb((selectedOrder as any).awbNumber || selectedOrder.shippingLabelNumber || `SPL${selectedOrder.id.replace(/\D/g, '').padEnd(9, '0').slice(-9)}`);
      setGeneratedTracking(selectedOrder.trackingNumber || `SPL${selectedOrder.id.replace(/\D/g, '').padEnd(9, '0').slice(-9)}`);
    }
  }, [selectedOrder]);

  // Dynamic calculations for totals
  const orderItemsTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    return Number((selectedOrder as any).totalAmount || selectedOrder.total || 0);
  }, [selectedOrder]);

  const shippingCost = useMemo(() => {
    if (!selectedOrder) return 0;
    return Number(selectedOrder.shippingFee || (selectedOrder as any).shippingCost || 0);
  }, [selectedOrder]);

  const grandTotal = useMemo(() => {
    return orderItemsTotal + (selectedOrder?.shippingFee ? 0 : shippingCost);
  }, [orderItemsTotal, shippingCost, selectedOrder]);

  // Barcode and QR code generation
  const awbBarcodeSvg = useMemo(() => {
    return generateCode128Svg(generatedTracking, {
      height: 48,
      barWidth: 2,
      showText: true,
    });
  }, [generatedTracking]);

  const qrDataUri = useMemo(() => {
    const data = `https://track.unityteck.sa/?c=${selectedCourier}&awb=${generatedAwb}&ord=${selectedOrder?.orderNumber || selectedOrderId}`;
    return generateQrSvgDataUri(data, 90);
  }, [selectedCourier, generatedAwb, selectedOrder, selectedOrderId]);

  // Handle Create Shipment API Call
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
        setCurrentStep(4);
        toast(
          isAr
            ? `تم إنشاء بوليصة الشحن بنجاح (رقم التتبع: ${res.trackingNumber || res.awb})`
            : `Shipping waybill created successfully (AWB: ${res.awb || res.trackingNumber})`,
          'success'
        );
      } else {
        toast(isAr ? 'فشل إنشاء بوليصة الشحن مع الناقل' : 'Failed to generate shipment waybill with carrier', 'error');
      }
    } catch {
      toast(isAr ? 'حدث خطأ في الاتصال بالخدمة' : 'Error connecting to carrier API', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct thermal print handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF handler
  const handleDownloadPdf = () => {
    toast(
      isAr
        ? 'جاري تجهيز ملف PDF للطباعة الحرارية 4x6...'
        : 'Preparing 4x6 thermal printable PDF waybill...',
      'info'
    );
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── 1. Top Header ── */}
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
                ? 'دليل الربط اللوجستي: يمكنك طباعة بوالص الشحن بمقاس 4x6 إنش مباشرة عبر طابعات الباركود الحرارية.'
                : 'Help Guide: Labels are optimized for standard 4x6 thermal barcode printers (Zebra, TSC, Xprinter).',
              'info'
            )
          }
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs self-start sm:self-auto transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{isAr ? 'دليل المساعدة' : 'Help Guide'}</span>
        </button>
      </div>

      {/* ── 2. Sub-tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { key: 'create', label: isAr ? 'إنشاء بوليصة شحن' : 'Create Shipping Label' },
          { key: 'history', label: isAr ? 'سجل البوالص' : 'Label History' },
          { key: 'bulk', label: isAr ? 'إجراءات جماعية' : 'Bulk Actions' },
          { key: 'failed', label: isAr ? 'البوالص المتعثرة' : 'Failed Labels' },
        ].map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === 'create' && (
        <div className="space-y-6">
          {/* ── 3. Four-Step Stepper Bar ── */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between max-w-3xl mx-auto relative">
              {/* Connector Line */}
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
                    onClick={() => setCurrentStep(s.step as any)}
                    className="flex items-center gap-2 relative z-10 bg-white dark:bg-slate-900 px-2 group cursor-pointer"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:inline ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400 font-bold'
                          : isCompleted
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 4. Main 3-Column Studio Layout or Empty State ── */}
          {!selectedOrder ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600 rtl:rotate-180" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'لا توجد طلبات لإصدار بوالص الشحن' : 'No Orders Available for Shipping Labels'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isAr
                  ? 'بمجرد استلام طلبات جديدة في المتجر، ستتمكن من إصدار بوالص الشحن الرسمية وتتبعها وطباعتها حرارياً فوراً.'
                  : 'Once customers place orders in your store, you will be able to generate and print official carrier waybills here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* ── Left Column (4 cols): Order Information ── */}
              <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <div>
                  {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {selectedOrder?.orderNumber || (selectedOrder ? `#${selectedOrder.id.slice(-8)}` : '—')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isAr ? 'جاهز للشحن' : 'Ready to Ship'}</span>
                  </span>
                </div>

                {/* Customer Info */}
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                      {(selectedOrder?.customerName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {selectedOrder?.customerName || (isAr ? 'عميل المتجر' : 'Store Customer')}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {selectedOrder?.customerPhone || activeStore?.phone || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Location */}
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 pt-1">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {(selectedOrder as any)?.city || selectedOrder?.deliveryLocation || (activeStore as any)?.city || 'Saudi Arabia'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {typeof selectedOrder?.shippingAddress === 'string'
                          ? selectedOrder.shippingAddress
                          : (selectedOrder?.shippingAddress as any)?.address ||
                            selectedOrder?.deliveryLocation ||
                            (isAr ? 'العنوان الوطني' : 'National Address')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Selector (Switch order easily) */}
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
                        {ord.orderNumber || `#${ord.id.slice(-8)}`} — {ord.customerName} ({(ord as any).city || ord.deliveryLocation || 'KSA'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items Section */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2.5">
                    {isAr ? 'المنتجات' : 'Items'}
                  </span>

                  <div className="space-y-2">
                    {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.slice(0, 3).map((item, idx) => {
                        const itemImg = item.image || (item as any).productImage;
                        const itemTitle = item.name || (item as any).productTitle || 'Product';
                        const itemVar = (item as any).variantTitle || (isAr ? 'طرد الشحنة' : 'Package parcel');
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
                                <h5 className="font-semibold text-slate-900 dark:white truncate">
                                  {itemTitle}
                                </h5>
                                <p className="text-[11px] text-slate-500">
                                  {itemVar}
                                </p>
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
                        <p className="text-xs font-semibold">{isAr ? 'لا توجد منتجات مسجلة في هذا الطلب' : 'No items recorded in this order'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
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
                      onClick={() => toast(isAr ? 'يمكنك تغيير طريقة الشحن في الخطوة 2' : 'Change courier in section 2', 'info')}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline text-[11px]"
                    >
                      {isAr ? 'تعديل' : 'Edit'}
                    </button>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedCourier.toUpperCase()} - Standard
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <span>{isAr ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {money(shippingCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
                  <span>{isAr ? 'الإجمالي الكلي' : 'Total'}</span>
                  <span>{money(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* ── Middle Column (4 cols): Shipping Details Form ── */}
            <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                  {isAr ? 'تفاصيل الشحن والطرود' : 'Shipping Details'}
                </h3>

                {/* Courier Selection */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'شركة الشحن' : 'Courier'}
                  </label>
                  <select
                    value={selectedCourier}
                    onChange={(e) => setSelectedCourier(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="spl">SPL (البريد السعودي - سبل)</option>
                    <option value="aramex">Aramex (أرامكس)</option>
                    <option value="smsa">SMSA Express (سمسا)</option>
                    <option value="dhl">DHL Express</option>
                  </select>
                </div>

                {/* Service Type */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'نوع الخدمة' : 'Service Type'}
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="standard">Standard Delivery (2-4 days)</option>
                    <option value="express">Express Delivery (Same Day / 24h)</option>
                    <option value="economy">Economy Freight (3-5 days)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAr ? 'التوصيل التقديري: 2 - 4 أيام عمل' : 'Estimated delivery: 2 - 4 days'}
                  </p>
                </div>

                {/* Package Type */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'نوع الطرد' : 'Package Type'}
                  </label>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="box">{isAr ? 'صندوق كرتوني (Box)' : 'Box'}</option>
                    <option value="flyer">{isAr ? 'كيس شحن (Flyer / Pouch)' : 'Flyer / Pouch'}</option>
                    <option value="pallet">{isAr ? 'طبلية شحن (Pallet)' : 'Pallet'}</option>
                  </select>
                </div>

                {/* Weight & Dimensions */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="col-span-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                      {isAr ? 'الوزن (KG)' : 'Weight (KG)'}
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
                      {isAr ? 'الأبعاد (cm): الطول × العرض × الارتفاع' : 'Dimensions (cm): L × W × H'}
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <input
                        type="number"
                        placeholder="L"
                        value={dimLength}
                        onChange={(e) => setDimLength(parseInt(e.target.value) || 1)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center font-bold text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="number"
                        placeholder="W"
                        value={dimWidth}
                        onChange={(e) => setDimWidth(parseInt(e.target.value) || 1)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center font-bold text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="number"
                        placeholder="H"
                        value={dimHeight}
                        onChange={(e) => setDimHeight(parseInt(e.target.value) || 1)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {/* COD Toggle */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={isCodEnabled}
                      onChange={(e) => setIsCodEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  {/* Insurance Toggle */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'إضافة تأمين على الشحنة' : 'Add Insurance'}
                    </span>
                    <input
                      type="checkbox"
                      checked={isInsuranceEnabled}
                      onChange={(e) => setIsInsuranceEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreateShipment}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
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

            {/* ── Right Column (4 cols): Live 4x6 Thermal Label Preview ── */}
            <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'معاينة بوليصة الشحن (Live Preview)' : 'Label Preview'}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">4x6 Thermal</span>
                </div>

                {/* The Realistic 4x6 Thermal Label Card */}
                <div className="mt-4 p-4 rounded-xl border-2 border-slate-900 bg-white text-slate-950 font-sans shadow-sm select-none">
                  {/* Carrier Top Header */}
                  <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                    <div className="text-2xl font-black tracking-tighter uppercase font-mono">
                      {selectedCourier === 'spl' ? (
                        <span className="text-emerald-700 font-extrabold tracking-normal">SPL</span>
                      ) : selectedCourier === 'aramex' ? (
                        <span className="text-orange-600 font-extrabold tracking-normal">aramex</span>
                      ) : selectedCourier === 'smsa' ? (
                        <span className="text-blue-800 font-extrabold tracking-normal">SMSA</span>
                      ) : (
                        selectedCourier.toUpperCase()
                      )}
                    </div>
                    <div className="text-end">
                      <div className="text-[11px] font-bold tracking-tight">
                        {selectedCourier === 'spl'
                          ? 'سبل SPL'
                          : selectedCourier === 'aramex'
                          ? 'أرامكس'
                          : selectedCourier === 'smsa'
                          ? 'سمسا'
                          : 'EXPRESS'}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">DOMESTIC PARCEL</div>
                    </div>
                  </div>

                  {/* Crisp SVG Barcode */}
                  <div className="my-2.5 flex flex-col items-center justify-center overflow-hidden">
                    <div
                      className="w-full flex justify-center"
                      dangerouslySetInnerHTML={{ __html: awbBarcodeSvg }}
                    />
                    <div className="text-xs font-mono font-bold tracking-widest mt-1">
                      {generatedTracking}
                    </div>
                  </div>

                  {/* From / To & QR Code */}
                  <div className="grid grid-cols-12 gap-2 py-2 border-y border-slate-800 text-[10px]">
                    <div className="col-span-5 border-e border-slate-300 pe-1">
                      <span className="font-black block uppercase text-[9px] text-slate-500">From:</span>
                      <strong className="block truncate">{activeStore?.name || 'My Store'}</strong>
                      <span className="block text-slate-600">Riyadh, Saudi Arabia</span>
                      <span className="block font-mono text-slate-600">{(activeStore as any)?.phone || '+966 11 000 0000'}</span>
                    </div>

                    <div className="col-span-4 border-e border-slate-300 pe-1">
                      <span className="font-black block uppercase text-[9px] text-slate-500">To:</span>
                      <strong className="block truncate">
                        {selectedOrder?.customerName || (isAr ? 'عميل' : 'Customer')}
                      </strong>
                      <span className="block truncate text-slate-600">
                        {(selectedOrder as any)?.city || selectedOrder?.deliveryLocation || (activeStore as any)?.city || 'Saudi Arabia'}, KSA
                      </span>
                      <span className="block font-mono text-slate-600 truncate">
                        {selectedOrder?.customerPhone || '—'}
                      </span>
                    </div>

                    <div className="col-span-3 flex items-center justify-center">
                      <img src={qrDataUri} alt="Driver QR" className="w-14 h-14 object-contain" />
                    </div>
                  </div>

                  {/* Bottom Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-center font-mono">
                    <div className="border-e border-slate-300">
                      <span className="text-[9px] text-slate-500 block uppercase">Weight</span>
                      <strong className="text-xs">{weightKg} KG</strong>
                    </div>
                    <div className="border-e border-slate-300">
                      <span className="text-[9px] text-slate-500 block uppercase">Service</span>
                      <strong className="text-xs truncate block">Standard</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">COD</span>
                      <strong className="text-xs text-rose-700">
                        {isCodEnabled ? `SAR ${grandTotal.toFixed(2)}` : 'PREPAID'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Download PDF, Print Label, More Actions) */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحميل PDF' : 'Download PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة البوليصة' : 'Print Label'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toast(
                      isAr ? 'تم نسخ بيانات البوليصة إلى الحافظة' : 'Waybill manifest data copied to clipboard',
                      'info'
                    )
                  }
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title={isAr ? 'إجراءات إضافية' : 'More Actions'}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

      {/* ── Sub-tab 2: Label History ── */}
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
                {isAr ? 'لم يتم إصدار بوالص شحن بعد' : 'No shipping waybills generated yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {currentShipments.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase">
                      {s.provider}
                    </span>
                    <div>
                      <div className="font-bold font-mono text-slate-900 dark:text-white">
                        {s.trackingNumber || s.awbNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">Order: {s.orderId}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGeneratedTracking(s.trackingNumber || s.awbNumber);
                        setGeneratedAwb(s.awbNumber || s.trackingNumber);
                        setActiveSubTab('create');
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-blue-600 dark:text-blue-400 font-semibold"
                    >
                      {isAr ? 'معاينة وطباعة' : 'Preview & Print'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sub-tab 3: Bulk Actions ── */}
      {activeSubTab === 'bulk' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs text-center space-y-3">
          <Layers className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'إصدار وطباعة بوالص الشحن الجماعية' : 'Bulk Shipping Waybill Generation'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr
              ? 'يمكنك تحديد مجموعة من الطلبات الجاهزة لإصدار بوالصها دفعة واحدة وطباعتها على ورق حراري متصل.'
              : 'Select multiple ready-to-ship orders to batch generate carrier waybills and print consecutive 4x6 labels.'}
          </p>
          <button
            type="button"
            onClick={() => {
              if (eligibleOrders.length === 0) {
                toast(
                  isAr
                    ? 'لا توجد طلبات جاهزة للشحن للطباعة الجماعية'
                    : 'No ready-to-ship orders available for batch processing',
                  'info'
                );
                return;
              }
              toast(
                isAr
                  ? `تم تجهيز ${eligibleOrders.length} بوليصة شحن جماعية للطباعة`
                  : `${eligibleOrders.length} batch waybill(s) processed for printing`,
                'success'
              );
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors"
          >
            {isAr ? 'بدء الطباعة الجماعية' : 'Start Batch Processing'}
          </button>
        </div>
      )}

      {/* ── Sub-tab 4: Failed Labels ── */}
      {activeSubTab === 'failed' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isAr ? 'لا توجد بوالص متعثرة' : 'Zero Failed Labels'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'جميع بوالص الشحن تم التحقق منها ومزامنتها بنجاح مع بوابات شركات الشحن.'
              : 'All dispatched shipping labels have passed carrier API validation successfully.'}
          </p>
        </div>
      )}
    </div>
  );
};
