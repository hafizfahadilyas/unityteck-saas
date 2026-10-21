import React, { useRef } from 'react';
import {
  generateCode128Svg,
  getCarrierBrand,
  type ShippingLabelData,
  type CourierCarrierCode,
} from '../../../utils/courierBarcode';
import { generateQrSvgDataUri } from '../../../utils/zatca';
import {
  Printer,
  Download,
  Share2,
  X,
  Truck,
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  Building2,
  Barcode,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';

interface CourierShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelData: ShippingLabelData;
  onPrint?: () => void;
}

export const CourierShippingLabelModal: React.FC<CourierShippingLabelModalProps> = ({
  isOpen,
  onClose,
  labelData,
  onPrint,
}) => {
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const labelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const brand = getCarrierBrand(labelData.carrier);

  // Generate SVG barcodes
  const awbBarcodeSvg = generateCode128Svg(labelData.awbNumber, {
    height: 52,
    barWidth: 2,
    showText: true,
  });

  const trackingBarcodeSvg = generateCode128Svg(labelData.trackingNumber, {
    height: 40,
    barWidth: 1.8,
    showText: true,
  });

  // QR for digital driver scanning (contains tracking URL / verification)
  const qrData = `https://track.unityteck.sa/?c=${labelData.carrier}&awb=${labelData.awbNumber}&ord=${labelData.orderNumber}`;
  const qrSvgUri = generateQrSvgDataUri(qrData, 120);

  const handlePrint = () => {
    if (onPrint) onPrint();
    window.print();
  };

  const handleDownloadPdf = () => {
    toast(
      isAr ? 'جاري تحضير بوليصة الشحن للطابعة الحرارية...' : 'Preparing shipping waybill for 4x6 thermal printer...',
      'info'
    );
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* 4x6 inch standard thermal shipping label print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #courier-thermal-label-container, #courier-thermal-label-container * {
            visibility: visible !important;
          }
          #courier-thermal-label-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 4in !important;
            margin: 0 !important;
            padding: 0.1in !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Wrapper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] no-print">
        {/* Top Control Toolbar */}
        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? brand.nameAr : brand.nameEn}
                </h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase text-white"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {brand.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                AWB: {labelData.awbNumber} · {labelData.orderNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'تصدير' : 'Export'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:opacity-95"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة البوليصة' : 'Print Waybill'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body (Thermal Label Preview) */}
        <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center">
          {/* Printable 4" x 6" Courier Shipping Label (Standard A6 / Thermal 100mm x 150mm) */}
          <div
            id="courier-thermal-label-container"
            ref={labelRef}
            className="w-full max-w-[420px] bg-white text-slate-950 border-2 border-slate-900 rounded-2xl p-5 shadow-lg select-text font-sans text-xs flex flex-col justify-between"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div>
              {/* 1. Header Bar: Carrier Logo + Service Type + Hub Route */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black leading-tight tracking-tight">
                      {isAr ? brand.nameAr : brand.nameEn}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-600 block uppercase">
                      {labelData.routing.serviceType}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-xs font-mono font-black px-2 py-0.5 bg-slate-900 text-white rounded-md inline-block">
                    {labelData.routing.hubCode}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-600 mt-0.5">
                    {labelData.routing.routeCode}
                  </div>
                </div>
              </div>

              {/* 2. Main High-Density Code 128 Barcode */}
              <div className="py-3 border-b-2 border-slate-900 text-center flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  {isAr ? 'رقم بوليصة الشحن (AWB Barcode)' : 'Air Waybill Barcode (Code 128)'}
                </span>
                <div
                  className="overflow-hidden flex justify-center max-w-full"
                  dangerouslySetInnerHTML={{ __html: awbBarcodeSvg }}
                />
              </div>

              {/* 3. Sender (FROM) and Recipient (TO) Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 border-b-2 border-slate-900 text-[11px]">
                {/* Sender */}
                <div className="border-e border-slate-300 pe-2 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                    {isAr ? 'من (الراسل):' : 'FROM (SHIPPER):'}
                  </span>
                  <p className="font-extrabold text-slate-900 leading-tight">
                    {isAr ? labelData.sender.nameAr || labelData.sender.name : labelData.sender.name}
                  </p>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    {labelData.sender.address}, {labelData.sender.city}
                  </p>
                  <p className="text-[10px] font-mono text-slate-700 flex items-center gap-1 dir-ltr">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{labelData.sender.phone}</span>
                  </p>
                </div>

                {/* Recipient */}
                <div className="ps-1 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                    {isAr ? 'إلى (المرسل إليه):' : 'TO (CONSIGNEE):'}
                  </span>
                  <p className="font-black text-slate-950 text-xs leading-tight">
                    {isAr ? labelData.recipient.nameAr || labelData.recipient.name : labelData.recipient.name}
                  </p>
                  <p className="text-[10px] text-slate-800 font-medium leading-snug">
                    {labelData.recipient.address}
                  </p>
                  <p className="text-[10px] font-bold text-slate-900">
                    {labelData.recipient.city}
                    {labelData.recipient.postalCode ? ` · ${labelData.recipient.postalCode}` : ''}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-slate-900 flex items-center gap-1 dir-ltr">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{labelData.recipient.phone}</span>
                  </p>
                </div>
              </div>

              {/* 4. COD / Payment Banner & Package Details */}
              <div className="py-2.5 border-b-2 border-slate-900 grid grid-cols-2 gap-2 items-center">
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-300">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    {isAr ? 'طريقة الدفع والتحصيل:' : 'PAYMENT TYPE:'}
                  </span>
                  {labelData.payment.method === 'cod' ? (
                    <div className="mt-0.5">
                      <span className="text-xs font-black px-1.5 py-0.5 rounded-sm bg-rose-600 text-white inline-block">
                        {isAr ? 'دفع عند الاستلام (COD)' : 'CASH ON DELIVERY'}
                      </span>
                      <p className="text-sm font-black text-rose-700 font-mono mt-1">
                        {labelData.payment.codAmountSar} {labelData.payment.currency}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-0.5">
                      <span className="text-xs font-black px-1.5 py-0.5 rounded-sm bg-emerald-700 text-white inline-block">
                        {isAr ? 'مدفوع مسبقاً (Prepaid)' : 'PREPAID ELECTRONIC'}
                      </span>
                      <p className="text-[10px] font-bold text-emerald-800 mt-0.5">
                        {isAr ? 'لا يتم تحصيل أي مبالغ من العميل' : 'Do NOT collect any money'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'الوزن:' : 'Weight:'}</span>
                    <strong className="font-mono">{labelData.packageDetails.weightKg} KG</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'عدد الطرود:' : 'Pieces:'}</span>
                    <strong className="font-mono">{labelData.packageDetails.pieces} PCS</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'القيمة المعلنة:' : 'Decl. Value:'}</span>
                    <strong className="font-mono">{labelData.packageDetails.declaredValueSar} SAR</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'الطلب:' : 'Order Ref:'}</span>
                    <strong className="font-mono">{labelData.orderNumber}</strong>
                  </div>
                </div>
              </div>

              {/* 5. Secondary Tracking Barcode & Dispatch QR */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <div className="flex-1 text-center">
                  <span className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">
                    {isAr ? 'باركود التتبع السريع' : 'Tracking Number Barcode'}
                  </span>
                  <div
                    className="overflow-hidden flex justify-center max-w-full"
                    dangerouslySetInnerHTML={{ __html: trackingBarcodeSvg }}
                  />
                </div>

                <div className="flex flex-col items-center shrink-0 ps-2 border-s border-slate-200">
                  <img src={qrSvgUri} alt="Digital Waybill QR" className="w-16 h-16 border border-slate-300 p-0.5 rounded" />
                  <span className="text-[8px] font-mono text-slate-500 mt-0.5">SCAN TO VERIFY</span>
                </div>
              </div>
            </div>

            {/* 6. Footer Disclaimer & Customer Care Hotline */}
            <div className="pt-3 border-t-2 border-slate-900 mt-3 text-[9px] text-slate-600 flex items-center justify-between">
              <span>{isAr ? 'خدمة العملاء والتتبع:' : 'Customer Care:'} <strong className="font-mono">{brand.serviceCenterPhone}</strong></span>
              <span className="font-bold">{labelData.orderDate}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isAr ? 'البوليصة متوافقة 100% مع معايير الطابعات الحرارية والباركود الوطنية' : '100% standard thermal barcode compliant'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
