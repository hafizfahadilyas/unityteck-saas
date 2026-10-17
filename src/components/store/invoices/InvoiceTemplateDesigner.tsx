import React, { useState } from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceDocumentType } from '../../../types/invoices';
import { InvoiceTemplateRenderer } from './InvoiceTemplateRenderer';
import { invoiceService, DEFAULT_TEMPLATE_CONFIG } from '../../../services/invoiceService';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import {
  Palette,
  Type,
  Layout,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  Building,
  CreditCard,
  QrCode,
  FileText,
} from 'lucide-react';

interface InvoiceTemplateDesignerProps {
  documents: InvoiceDocument[];
  onBack: () => void;
}

export const InvoiceTemplateDesigner: React.FC<InvoiceTemplateDesignerProps> = ({
  documents,
  onBack,
}) => {
  const { activeStore } = useTenant();
  const { t, locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [config, setConfig] = useState<InvoiceTemplateConfig>(() =>
    invoiceService.getTemplateConfig(activeStore.id)
  );

  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [designerTab, setDesignerTab] = useState<'branding' | 'typography' | 'columns' | 'sections' | 'terms'>('branding');
  const [previewDirection, setPreviewDirection] = useState<'rtl' | 'ltr'>('rtl');

  const selectedDocument = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleSave = () => {
    invoiceService.saveTemplateConfig(activeStore.id, config);
    toast(
      isAr ? 'تم حفظ إعدادات وتخصيصات القالب بنجاح!' : 'Template design settings saved successfully!',
      'success'
    );
  };

  const handleReset = () => {
    const res = invoiceService.resetTemplateConfig(activeStore.id);
    setConfig(res);
    toast(isAr ? 'تمت استعادة القالب الافتراضي' : 'Default template restored', 'info');
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white select-none">
      {/* Designer Top Bar */}
      <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs"
          >
            ← {isAr ? 'العودة للمستندات' : 'Back to Invoices'}
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'مصمم ومخصص قوالب الفواتير' : 'Invoice Template Designer'}
            </h2>
          </div>
        </div>

        {/* Live Preview Sample Document Selector & Save Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">{isAr ? 'معاينة بمستند:' : 'Preview with:'}</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.documentNumber} ({d.documentType})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setPreviewDirection('rtl')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                previewDirection === 'rtl' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              RTL عربي
            </button>
            <button
              type="button"
              onClick={() => setPreviewDirection('ltr')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                previewDirection === 'ltr' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              LTR English
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isAr ? 'استعادة الافتراضي' : 'Reset'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {isAr ? 'حفظ القالب' : 'Save Design'}
          </button>
        </div>
      </div>

      {/* Main Split Body (Settings Column + Live Preview) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Settings Navigation & Form Controls */}
        <div className="w-96 border-e border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col shrink-0 overflow-y-auto">
          {/* Sub-Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 p-2 gap-1 bg-slate-50/80 dark:bg-slate-950/40">
            {[
              { id: 'branding', labelEn: 'Branding', labelAr: 'الهوية' },
              { id: 'typography', labelEn: 'Fonts', labelAr: 'الخطوط' },
              { id: 'columns', labelEn: 'Columns', labelAr: 'الأعمدة' },
              { id: 'sections', labelEn: 'Sections', labelAr: 'الأقسام' },
              { id: 'terms', labelEn: 'Terms', labelAr: 'الشروط' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDesignerTab(tab.id as any)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  designerTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5 text-xs">
            {/* Branding Settings */}
            {designerTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'اللون الرئيسي (Navy / Brand)' : 'Primary Color'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الاسم التجاري بالعربية' : 'Business Name (AR)'}</label>
                  <input
                    type="text"
                    value={config.businessNameAr}
                    onChange={(e) => setConfig((c) => ({ ...c, businessNameAr: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الاسم التجاري بالإنجليزية' : 'Business Name (EN)'}</label>
                  <input
                    type="text"
                    value={config.businessNameEn}
                    onChange={(e) => setConfig((c) => ({ ...c, businessNameEn: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الرقم الضريبي للمنشأة' : 'VAT Registration Number'}</label>
                  <input
                    type="text"
                    value={config.taxNumber}
                    onChange={(e) => setConfig((c) => ({ ...c, taxNumber: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'رقم السجل التجاري' : 'CR Number'}</label>
                  <input
                    type="text"
                    value={config.crNumber}
                    onChange={(e) => setConfig((c) => ({ ...c, crNumber: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Typography */}
            {designerTab === 'typography' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'خط الفاتورة' : 'Font Family'}</label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => setConfig((c) => ({ ...c, fontFamily: e.target.value as any }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Tajawal">Tajawal (تجوال - فاخر ومقروء)</option>
                    <option value="Cairo">Cairo (كايرو - رسمي عريض)</option>
                    <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</option>
                    <option value="Inter">Inter (English Standard)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'حجم الخط والتنسيق' : 'Layout Density'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['compact', 'normal', 'spacious'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, fontSize: sz as any }))}
                        className={`py-2 rounded-lg border text-center capitalize font-bold cursor-pointer ${
                          config.fontSize === sz
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Table Columns Visibility */}
            {designerTab === 'columns' && (
              <div className="space-y-3">
                <span className="text-slate-600 dark:text-slate-400 block mb-2">{isAr ? 'حدد الأعمدة المراد إظهارها في جدول الفاتورة:' : 'Toggle invoice table columns:'}</span>
                {Object.entries(config.columns).map(([colKey, isVisible]) => (
                  <label
                    key={colKey}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">{colKey}</span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          columns: { ...c.columns, [colKey]: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded-sm text-blue-600"
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Sections Visibility */}
            {designerTab === 'sections' && (
              <div className="space-y-3">
                <span className="text-slate-600 dark:text-slate-400 block mb-2">{isAr ? 'إظهار / إخفاء أقسام المستند:' : 'Toggle document sections:'}</span>
                {[
                  { key: 'showLogo', label: isAr ? 'شعار المتجر' : 'Store Logo' },
                  { key: 'showZatcaQr', label: isAr ? 'رمز الاستجابة السريعة (ZATCA QR)' : 'ZATCA TLV QR Code' },
                  { key: 'showPaymentInstructions', label: isAr ? 'تعليمات وبيانات الدفع' : 'Payment Instructions' },
                  { key: 'showBankDetails', label: isAr ? 'الحساب البنكي والآيبان' : 'Bank & IBAN Details' },
                  { key: 'showSignatureField', label: isAr ? 'حقل التوقيع والاعتماد' : 'Signature Field' },
                  { key: 'showNotes', label: isAr ? 'الملاحظات الإضافية' : 'Additional Notes' },
                  { key: 'showTerms', label: isAr ? 'الشروط والأحكام' : 'Terms & Conditions' },
                  { key: 'showWatermark', label: isAr ? 'العلامة المائية (للبروفورما والمسودات)' : 'Watermark' },
                ].map((sec) => (
                  <label
                    key={sec.key}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{sec.label}</span>
                    <input
                      type="checkbox"
                      checked={(config as any)[sec.key]}
                      onChange={(e) => setConfig((c) => ({ ...c, [sec.key]: e.target.checked }))}
                      className="w-4 h-4 rounded-sm text-blue-600"
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Terms and Notes */}
            {designerTab === 'terms' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الملاحظات الافتراضية (عربي)' : 'Default Notes (AR)'}</label>
                  <textarea
                    rows={3}
                    value={config.customNotesAr}
                    onChange={(e) => setConfig((c) => ({ ...c, customNotesAr: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الشروط والأحكام (عربي)' : 'Default Terms (AR)'}</label>
                  <textarea
                    rows={3}
                    value={config.customTermsAr}
                    onChange={(e) => setConfig((c) => ({ ...c, customTermsAr: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'بيانات الحساب البنكي والآيبان' : 'Bank Account Details'}</label>
                  <input
                    type="text"
                    value={config.bankDetailsAr}
                    onChange={(e) => setConfig((c) => ({ ...c, bankDetailsAr: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Rendering Canvas */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 sm:p-10 flex justify-center overflow-y-auto">
          {selectedDocument ? (
            <div className="w-full max-w-[800px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <InvoiceTemplateRenderer
                document={selectedDocument}
                config={config}
                locale={previewDirection === 'rtl' ? 'ar' : 'en'}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center text-slate-500">
              {isAr ? 'لا توجد مستندات للمعاينة' : 'No document selected'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
