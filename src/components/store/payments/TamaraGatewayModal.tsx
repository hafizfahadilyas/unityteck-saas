import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { GlobalModal } from '../../common/GlobalModal';
import { PAYMENT_METHOD_LOGO } from '../../../utils/paymentMethodLogos';

export type TamaraGatewayFormState = {
  merchantKey: string;
  publicKey: string;
  isSandbox: boolean;
  showProductLogo: boolean;
  policyAccepted: boolean;
};

type Props = {
  open: boolean;
  isAr: boolean;
  initial: TamaraGatewayFormState;
  saving?: boolean;
  statusLabel?: string;
  onClose: () => void;
  onSave: (next: TamaraGatewayFormState) => void | Promise<void>;
};

const TOGGLE_TRACK =
  "relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-focus:outline-none peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--portal-cta,#0d9488)]";

/**
 * Salla-style Tamara connect modal — Merchant Key + Public Key + product-page logo toggle.
 * Credentials stay merchant-entered per store_id (never hardcoded).
 */
export const TamaraGatewayModal: React.FC<Props> = ({
  open,
  isAr,
  initial,
  saving = false,
  statusLabel,
  onClose,
  onSave,
}) => {
  const [tab, setTab] = useState<'link' | 'about'>('link');
  const [merchantKey, setMerchantKey] = useState(initial.merchantKey);
  const [publicKey, setPublicKey] = useState(initial.publicKey);
  const [isSandbox, setIsSandbox] = useState(initial.isSandbox);
  const [showProductLogo, setShowProductLogo] = useState(initial.showProductLogo);
  const [policyAccepted, setPolicyAccepted] = useState(initial.policyAccepted);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTab('link');
    setMerchantKey(initial.merchantKey);
    setPublicKey(initial.publicKey);
    setIsSandbox(initial.isSandbox);
    setShowProductLogo(initial.showProductLogo);
    setPolicyAccepted(initial.policyAccepted);
    setFormError('');
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mk = merchantKey.trim();
    const pk = publicKey.trim();
    if (!mk || !pk) {
      setFormError(isAr ? 'مفتاح التاجر والمفتاح العام مطلوبان.' : 'Merchant key and public key are required.');
      return;
    }
    if (!policyAccepted) {
      setFormError(
        isAr
          ? 'يجب الموافقة على سياسة البيع قبل الحفظ.'
          : 'You must accept the sales policy before saving.',
      );
      return;
    }
    setFormError('');
    await onSave({
      merchantKey: mk,
      publicKey: pk,
      isSandbox,
      showProductLogo,
      policyAccepted,
    });
  };

  return (
    <GlobalModal
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'إعدادات تمارا' : 'Tamara settings'}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Tamara brand header */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-[#FFF5F7] via-[#FFE8EE] to-[#F8D4DE] dark:from-[#3a1a24] dark:via-[#2a1520] dark:to-[#1a1018]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 end-3 p-1.5 rounded-lg text-slate-500 hover:bg-white/50 dark:hover:bg-black/20 cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={PAYMENT_METHOD_LOGO.tamara}
              alt={isAr ? 'تمارا' : 'Tamara'}
              className="h-9 w-auto object-contain"
            />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {isAr ? 'تمارا' : 'Tamara'}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {isAr
                  ? 'قسّم فاتورتك على 4 دفعات · متوافقة مع الشريعة'
                  : 'Split into 4 payments · Sharia compliant'}
              </p>
              {statusLabel ? (
                <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300 mt-0.5">{statusLabel}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('link')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg cursor-pointer transition-colors ${
              tab === 'link'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-b-0 border-teal-200 dark:border-teal-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {isAr ? 'الربط والإعدادات' : 'Link & Settings'}
          </button>
          <button
            type="button"
            onClick={() => setTab('about')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg cursor-pointer transition-colors ${
              tab === 'about'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-b-0 border-teal-200 dark:border-teal-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {isAr ? 'نبذة' : 'Overview'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {tab === 'link' ? (
            <>
              <section className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'معلومات الربط' : 'Connection details'}
                </h4>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'مفتاح التاجر' : 'Merchant Key'}
                  </label>
                  <input
                    type="password"
                    autoComplete="off"
                    value={merchantKey}
                    onChange={(e) => setMerchantKey(e.target.value)}
                    placeholder={isAr ? 'الصق مفتاح تاجر تمارا' : 'Paste Tamara merchant API token'}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'المفتاح العام' : 'Public Key'}
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'بيئة التشغيل' : 'Environment'}
                  </label>
                  <select
                    value={isSandbox ? 'sandbox' : 'live'}
                    onChange={(e) => setIsSandbox(e.target.value === 'sandbox')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="live">{isAr ? 'إنتاج حقيقي' : 'Live production'}</option>
                    <option value="sandbox">{isAr ? 'وضع الاختبار' : 'Sandbox test'}</option>
                  </select>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {isAr
                      ? 'الموافقة على سياسة البيع في منصة سوق'
                      : 'I agree to the Souq marketplace sales policy'}
                  </span>
                </label>
              </section>

              <section className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'الإعدادات' : 'Settings'}
                </h4>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {isAr ? 'إظهار شعار تمارا في صفحة المنتج' : 'Show Tamara logo on the product page'}
                  </span>
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={showProductLogo}
                      onChange={(e) => setShowProductLogo(e.target.checked)}
                    />
                    <div className={TOGGLE_TRACK} />
                  </div>
                </label>
              </section>

              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {isAr
                    ? 'هل تحتاج مساعدة في ربط تمارا بمتجرك؟ استخدم مفاتيح لوحة تمارا للتاجر واحفظها هنا لكل متجر على حدة.'
                    : 'Need help connecting Tamara? Paste your Tamara merchant dashboard keys here — saved per store only.'}
                </span>
              </p>
            </>
          ) : (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                {isAr
                  ? 'تمارا خدمة شراء الآن وادفع لاحقاً معتمدة في المملكة، تتيح للعملاء تقسيط المشتريات على دفعات بدون فوائد، ويستلم التاجر المبلغ مقدماً.'
                  : 'Tamara is a KSA-approved buy-now-pay-later service. Shoppers split purchases into interest-free installments while the merchant is paid upfront.'}
              </p>
              <ul className="list-disc ps-4 space-y-1.5">
                <li>{isAr ? 'عزل كامل حسب معرّف المتجر' : 'Fully isolated per store_id'}</li>
                <li>{isAr ? 'مفاتيح التاجر مشفّرة على الخادم' : 'Merchant keys stored server-side'}</li>
                <li>
                  {isAr
                    ? 'شعار تمارا في صفحة المنتج اختياري من الإعدادات'
                    : 'Optional Tamara badge on the product page'}
                </li>
              </ul>
            </div>
          )}

          {formError ? (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{formError}</p>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="unity-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </GlobalModal>
  );
};
