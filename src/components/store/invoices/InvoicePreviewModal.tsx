import React, { useState, useRef } from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig } from '../../../types/invoices';
import { InvoiceTemplateRenderer } from './InvoiceTemplateRenderer';
import { invoiceService } from '../../../services/invoiceService';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  Printer,
  Download,
  Share2,
  X,
  SlidersHorizontal,
  ExternalLink,
  Languages,
  Check,
  Sparkles,
  FileText,
  Copy,
  Building,
  RotateCcw,
} from 'lucide-react';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: InvoiceDocument | null;
  config: InvoiceTemplateConfig;
  onConfigChange?: (updatedConfig: InvoiceTemplateConfig) => void;
  onNavigateToRecord?: (type: 'order' | 'customer' | 'supplier' | 'invoice', id: string) => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  config,
  onConfigChange,
  onNavigateToRecord,
}) => {
  const { locale: appLocale } = usePrefs();
  const { toast } = useToast();
  const isAr = appLocale === 'ar';

  const [previewLocale, setPreviewLocale] = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [localConfig, setLocalConfig] = useState<InvoiceTemplateConfig>(config);
  const [isExporting, setIsExporting] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !document) return null;

  const handlePrint = () => {
    invoiceService.recordPrintOrExport(document.storeId, document.id, 'printed', 'Store Administrator');
    window.print();
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    invoiceService.recordPrintOrExport(document.storeId, document.id, 'exported_pdf', 'Store Administrator');

    toast(
      isAr ? 'جاري تحضير ملف PDF وتنزيله...' : 'Generating and downloading high-resolution PDF...',
      'info'
    );

    // Trigger print dialog or client-side print-to-pdf
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 300);
  };

  const handleShareWhatsApp = () => {
    const phone = document.buyer.phone?.replace(/[^0-9]/g, '') || '';
    const text = encodeURIComponent(
      isAr
        ? `مرحباً ${document.buyer.name}، مرفق لكم إشعار مستند ${document.titleAr || document.documentNumber} بمبلغ ${document.grandTotal} ${document.currency}.`
        : `Hello ${document.buyer.name}, here is your ${document.documentNumber} document statement for ${document.grandTotal} ${document.currency}.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleSaveConfig = () => {
    invoiceService.saveTemplateConfig(document.storeId, localConfig);
    if (onConfigChange) onConfigChange(localConfig);
    setShowSettingsDrawer(false);
    toast(isAr ? 'تم حفظ إعدادات القالب بنجاح' : 'Template settings saved successfully', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Print CSS to isolate document print area */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #invoice-live-print-container, #invoice-live-print-container * {
            visibility: visible !important;
          }
          #invoice-live-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] no-print">
        {/* Top Control Toolbar */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/90 shrink-0 text-slate-900 dark:text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{document.documentNumber}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {document.documentType.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? document.titleAr || document.title : document.title || document.documentNumber}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPreviewLocale('ar')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  previewLocale === 'ar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                عربي (RTL)
              </button>
              <button
                type="button"
                onClick={() => setPreviewLocale('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  previewLocale === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN (LTR)
              </button>
            </div>

            {/* Template Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowSettingsDrawer((v) => !v)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              title={isAr ? 'تخصيص القالب' : 'Customize Template'}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* WhatsApp Share */}
            {document.buyer.phone && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'مشاركة واتساب' : 'WhatsApp'}</span>
              </button>
            )}

            {/* PDF Export */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'تصدير PDF' : 'Export PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة A4' : 'Print A4'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ms-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with Settings Drawer & Live Document Canvas */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Document Render Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100 dark:bg-slate-950">
            <div
              id="invoice-live-print-container"
              ref={printAreaRef}
              className="w-full max-w-[820px] bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto"
            >
              <InvoiceTemplateRenderer
                document={document}
                config={localConfig}
                locale={previewLocale}
              />
            </div>
          </div>

          {/* Quick Settings Drawer */}
          {showSettingsDrawer && (
            <aside className="w-80 bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 flex flex-col p-5 space-y-4 overflow-y-auto text-slate-900 dark:text-white shrink-0 z-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isAr ? 'تخصيص مظهر القالب' : 'Template Customizer'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Brand Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'اللون الرئيسي للفاتورة' : 'Primary Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localConfig.primaryColor}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={localConfig.primaryColor}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {isAr ? 'العناصر والأقسام الظاهرة' : 'Visible Sections'}
                </span>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>{isAr ? 'إظهار باركود ZATCA QR' : 'Show ZATCA QR Code'}</span>
                  <input
                    type="checkbox"
                    checked={localConfig.showZatcaQr}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, showZatcaQr: e.target.checked }))}
                    className="rounded-sm text-blue-600 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>{isAr ? 'إظهار شعار المتجر' : 'Show Store Logo'}</span>
                  <input
                    type="checkbox"
                    checked={localConfig.showLogo}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, showLogo: e.target.checked }))}
                    className="rounded-sm text-blue-600 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>{isAr ? 'إظهار عمود SKU' : 'Show SKU Column'}</span>
                  <input
                    type="checkbox"
                    checked={localConfig.columns.sku}
                    onChange={(e) =>
                      setLocalConfig((c) => ({
                        ...c,
                        columns: { ...c.columns, sku: e.target.checked },
                      }))
                    }
                    className="rounded-sm text-blue-600 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>{isAr ? 'إظهار العلامة المائية للبروفورما' : 'Show Watermark'}</span>
                  <input
                    type="checkbox"
                    checked={localConfig.showWatermark}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, showWatermark: e.target.checked }))}
                    className="rounded-sm text-blue-600 w-4 h-4"
                  />
                </label>
              </div>

              {/* Save & Reset Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isAr ? 'حفظ كإعداد افتراضي' : 'Save Default Settings'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = invoiceService.resetTemplateConfig(document.storeId);
                    setLocalConfig(res);
                    toast(isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Default settings restored', 'info');
                  }}
                  className="w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isAr ? 'استعادة الافتراضي' : 'Restore Defaults'}
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* Footer Related Record Links Bar */}
        <div className="h-12 px-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-4">
            {document.orderId && (
              <button
                type="button"
                onClick={() => onNavigateToRecord && onNavigateToRecord('order', document.orderId!)}
                className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isAr ? 'فتح تفاصيل الطلب المرتبط' : 'Open Linked Order'}</span>
              </button>
            )}
            {document.supplierId && (
              <button
                type="button"
                onClick={() => onNavigateToRecord && onNavigateToRecord('supplier', document.supplierId!)}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Building className="w-3.5 h-3.5" />
                <span>{isAr ? 'ملف المورد' : 'Supplier Profile'}</span>
              </button>
            )}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {isAr ? 'نظام إدارة الفواتير والمستندات · يونيتي تيك' : 'Invoice & Document Engine · UnityTeck'}
          </div>
        </div>
      </div>
    </div>
  );
};
