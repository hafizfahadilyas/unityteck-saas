import React, { useState } from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig } from '../../../types/invoices';
import { InvoiceTemplateRenderer } from './InvoiceTemplateRenderer';
import { invoiceService } from '../../../services/invoiceService';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import { Palette, RotateCcw, Save } from 'lucide-react';
import { StoreFontSelect } from '../fonts/StoreFontSelect';
import { ensureStoreGoogleFontLoaded } from '../../../data/storeGoogleFontsCatalog';

interface InvoiceTemplateDesignerProps {
  documents: InvoiceDocument[];
  onBack: () => void;
}

export const InvoiceTemplateDesigner: React.FC<InvoiceTemplateDesignerProps> = ({
  documents,
  onBack,
}) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
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

  const tabs = [
    { id: 'branding' as const, labelEn: 'Branding', labelAr: 'الهوية' },
    { id: 'typography' as const, labelEn: 'Fonts', labelAr: 'الخطوط' },
    { id: 'columns' as const, labelEn: 'Columns', labelAr: 'الأعمدة' },
    { id: 'sections' as const, labelEn: 'Sections', labelAr: 'الأقسام' },
    { id: 'terms' as const, labelEn: 'Terms', labelAr: 'الشروط' },
  ];

  const saveActions = (
    <>
      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer min-h-[2.5rem]"
        style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
      >
        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap">{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="unity-btn-primary inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer min-h-[2.5rem]"
      >
        <Save className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap">{isAr ? 'حفظ القالب' : 'Save Design'}</span>
      </button>
    </>
  );

  return (
    <div
      className="flex flex-col min-h-[min(100%,calc(100dvh-4.5rem))] w-full min-w-0 select-none"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Designer Top Bar — stacks cleanly on mobile */}
      <div
        className="shrink-0 border-b px-3 sm:px-6 py-3 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              <span aria-hidden="true">{isAr ? '→' : '←'}</span>
              <span>{isAr ? 'العودة للمستندات' : 'Back to Invoices'}</span>
            </button>
            <div className="hidden sm:block h-4 w-px shrink-0" style={{ background: 'var(--border)' }} />
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
              >
                <Palette className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-black leading-snug break-words min-w-0" style={{ color: 'var(--text)' }}>
                {isAr ? 'مصمم ومخصص قوالب الفواتير' : 'Invoice Template Designer'}
              </h2>
            </div>
          </div>

          {/* Desktop / tablet actions */}
          <div className="hidden md:flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                {isAr ? 'معاينة بمستند:' : 'Preview with:'}
              </span>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="border text-xs rounded-xl px-3 py-1.5 font-mono min-h-[2.25rem] max-w-[12rem]"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.documentNumber} ({d.documentType})
                  </option>
                ))}
              </select>
            </div>

            <div
              className="flex items-center rounded-xl p-0.5 border"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={() => setPreviewDirection('rtl')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap ${
                  previewDirection === 'rtl' ? 'text-white' : ''
                }`}
                style={
                  previewDirection === 'rtl'
                    ? { background: 'var(--portal-cta)', color: '#fff' }
                    : { color: 'var(--muted)' }
                }
              >
                {isAr ? 'يميني' : 'RTL'}
              </button>
              <button
                type="button"
                onClick={() => setPreviewDirection('ltr')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap ${
                  previewDirection === 'ltr' ? 'text-white' : ''
                }`}
                style={
                  previewDirection === 'ltr'
                    ? { background: 'var(--portal-cta)', color: '#fff' }
                    : { color: 'var(--muted)' }
                }
              >
                {isAr ? 'يساري' : 'LTR'}
              </button>
            </div>

            {saveActions}
          </div>
        </div>

        {/* Mobile preview + direction controls */}
        <div className="flex md:hidden flex-col gap-2 min-w-0">
          <label className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
            {isAr ? 'معاينة بمستند' : 'Preview with'}
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full border text-xs rounded-xl px-3 py-2 font-mono min-h-[2.5rem]"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
          >
            {documents.length === 0 ? (
              <option value="">{isAr ? 'لا توجد مستندات' : 'No documents'}</option>
            ) : (
              documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.documentNumber} ({d.documentType})
                </option>
              ))
            )}
          </select>
          <div
            className="flex items-center rounded-xl p-0.5 border self-start"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setPreviewDirection('rtl')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap"
              style={
                previewDirection === 'rtl'
                  ? { background: 'var(--portal-cta)', color: '#fff' }
                  : { color: 'var(--muted)' }
              }
            >
              {isAr ? 'يميني' : 'RTL'}
            </button>
            <button
              type="button"
              onClick={() => setPreviewDirection('ltr')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap"
              style={
                previewDirection === 'ltr'
                  ? { background: 'var(--portal-cta)', color: '#fff' }
                  : { color: 'var(--muted)' }
              }
            >
              {isAr ? 'يساري' : 'LTR'}
            </button>
          </div>
        </div>
      </div>

      {/* Main body: settings then preview on mobile; side-by-side on lg+ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 min-w-0">
        {/* Settings */}
        <div
          className="w-full lg:w-96 lg:border-e flex flex-col shrink-0 overflow-y-auto min-w-0 pb-24 md:pb-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="flex border-b p-2 gap-1 overflow-x-auto [scrollbar-width:thin]"
            style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 80%, transparent)' }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDesignerTab(tab.id)}
                className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                style={
                  designerTab === tab.id
                    ? { background: 'var(--portal-cta)', color: '#fff' }
                    : { color: 'var(--muted)' }
                }
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5 space-y-5 text-xs">
            {designerTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'اللون الرئيسي' : 'Primary Color'}
                  </label>
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border shrink-0 cursor-pointer bg-transparent"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                      className="flex-1 min-w-0 border rounded-lg px-3 py-2 font-mono"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الاسم التجاري' : 'Business Name'}
                  </label>
                  <input
                    type="text"
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={isAr ? config.businessNameAr : config.businessNameEn}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        ...(isAr ? { businessNameAr: e.target.value } : { businessNameEn: e.target.value }),
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الرقم الضريبي للمنشأة' : 'VAT Registration Number'}
                  </label>
                  <input
                    type="text"
                    value={config.taxNumber}
                    onChange={(e) => setConfig((c) => ({ ...c, taxNumber: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'رقم السجل التجاري' : 'CR Number'}
                  </label>
                  <input
                    type="text"
                    value={config.crNumber}
                    onChange={(e) => setConfig((c) => ({ ...c, crNumber: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>
            )}

            {designerTab === 'typography' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'خط الفاتورة' : 'Font Family'}
                  </label>
                  <StoreFontSelect
                    isAr={isAr}
                    value={config.fontFamily === 'System' ? '' : config.fontFamily}
                    allowEmpty
                    emptyLabelAr="نفس خط لوحة التحكم"
                    emptyLabelEn="Same as dashboard (Invoice chrome)"
                    onChange={(fontFamily) => {
                      const next = fontFamily || 'System';
                      if (next !== 'System') ensureStoreGoogleFontLoaded(next);
                      setConfig((c) => ({ ...c, fontFamily: next }));
                    }}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'حجم الخط والتنسيق' : 'Layout Density'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['compact', 'normal', 'spacious'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, fontSize: sz }))}
                        className="py-2 rounded-lg border text-center capitalize font-bold cursor-pointer"
                        style={
                          config.fontSize === sz
                            ? { background: 'var(--portal-cta)', borderColor: 'var(--portal-cta)', color: '#fff' }
                            : {
                                background: 'var(--input-bg)',
                                borderColor: 'var(--border)',
                                color: 'var(--text)',
                              }
                        }
                      >
                        {sz === 'compact'
                          ? isAr
                            ? 'مضغوط'
                            : 'compact'
                          : sz === 'normal'
                            ? isAr
                              ? 'عادي'
                              : 'normal'
                            : isAr
                              ? 'واسع'
                              : 'spacious'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {designerTab === 'columns' && (
              <div className="space-y-3">
                <span className="block mb-2" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'حدد الأعمدة المراد إظهارها في جدول الفاتورة:' : 'Toggle invoice table columns:'}
                </span>
                {Object.entries(config.columns).map(([colKey, isVisible]) => (
                  <label
                    key={colKey}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border cursor-pointer min-w-0"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  >
                    <span className="font-semibold uppercase min-w-0 break-words" style={{ color: 'var(--text)' }}>
                      {colKey}
                    </span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          columns: { ...c.columns, [colKey]: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded-sm shrink-0"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                  </label>
                ))}
              </div>
            )}

            {designerTab === 'sections' && (
              <div className="space-y-3">
                <span className="block mb-2" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'إظهار / إخفاء أقسام المستند:' : 'Toggle document sections:'}
                </span>
                {(
                  [
                    { key: 'showLogo', label: isAr ? 'شعار المتجر' : 'Store Logo' },
                    { key: 'showZatcaQr', label: isAr ? 'رمز الاستجابة السريعة لهيئة الزكاة' : 'ZATCA TLV QR Code' },
                    { key: 'showPaymentInstructions', label: isAr ? 'تعليمات وبيانات الدفع' : 'Payment Instructions' },
                    { key: 'showBankDetails', label: isAr ? 'الحساب البنكي والآيبان' : 'Bank & IBAN Details' },
                    { key: 'showSignatureField', label: isAr ? 'حقل التوقيع والاعتماد' : 'Signature Field' },
                    { key: 'showNotes', label: isAr ? 'الملاحظات الإضافية' : 'Additional Notes' },
                    { key: 'showTerms', label: isAr ? 'الشروط والأحكام' : 'Terms & Conditions' },
                    { key: 'showWatermark', label: isAr ? 'العلامة المائية (للبروفورما والمسودات)' : 'Watermark' },
                  ] as const
                ).map((sec) => (
                  <label
                    key={sec.key}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border cursor-pointer min-w-0"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  >
                    <span className="font-semibold min-w-0 break-words" style={{ color: 'var(--text)' }}>
                      {sec.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean((config as Record<string, unknown>)[sec.key])}
                      onChange={(e) => setConfig((c) => ({ ...c, [sec.key]: e.target.checked }))}
                      className="w-4 h-4 rounded-sm shrink-0"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                  </label>
                ))}
              </div>
            )}

            {designerTab === 'terms' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الملاحظات الافتراضية' : 'Default Notes'}
                  </label>
                  <textarea
                    rows={3}
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={isAr ? config.customNotesAr : config.customNotesEn}
                    onChange={(e) =>
                      setConfig((c) =>
                        isAr
                          ? { ...c, customNotesAr: e.target.value }
                          : { ...c, customNotesEn: e.target.value },
                      )
                    }
                    className="w-full border rounded-lg p-2"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الشروط والأحكام' : 'Default Terms'}
                  </label>
                  <textarea
                    rows={3}
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={isAr ? config.customTermsAr : config.customTermsEn}
                    onChange={(e) =>
                      setConfig((c) =>
                        isAr
                          ? { ...c, customTermsAr: e.target.value }
                          : { ...c, customTermsEn: e.target.value },
                      )
                    }
                    className="w-full border rounded-lg p-2"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'بيانات الحساب البنكي' : 'Bank Account Details'}
                  </label>
                  <input
                    type="text"
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={isAr ? config.bankDetailsAr : config.bankDetailsEn}
                    onChange={(e) =>
                      setConfig((c) =>
                        isAr
                          ? { ...c, bankDetailsAr: e.target.value }
                          : { ...c, bankDetailsEn: e.target.value },
                      )
                    }
                    className="w-full border rounded-lg p-2 font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>
            )}

            {/* Inline save on tablet when sticky bar hidden but desktop header actions also hidden */}
            <div className="hidden sm:flex md:hidden items-center gap-2 pt-2">
              {saveActions}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div
          className="flex-1 p-4 sm:p-6 lg:p-10 flex justify-center overflow-y-auto min-h-[18rem] min-w-0 pb-24 md:pb-6"
          style={{ background: 'var(--bg)' }}
        >
          {selectedDocument ? (
            <div
              className="w-full max-w-[800px] rounded-xl shadow-2xl overflow-hidden border"
              style={{ background: '#fff', borderColor: 'var(--border)' }}
            >
              <InvoiceTemplateRenderer
                document={selectedDocument}
                config={config}
                locale={previewDirection === 'rtl' ? 'ar' : 'en'}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد مستندات للمعاينة' : 'No document selected'}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Save bar — always visible on phone */}
      <div
        className="md:hidden fixed bottom-0 inset-inline-0 z-30 border-t px-3 py-3 flex items-center gap-2"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
      >
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer min-h-[2.75rem]"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{isAr ? 'استعادة' : 'Reset'}</span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="unity-btn-primary inline-flex flex-[1.4] items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer min-h-[2.75rem]"
        >
          <Save className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{isAr ? 'حفظ القالب' : 'Save Design'}</span>
        </button>
      </div>
    </div>
  );
};
