import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { X, Store as StoreIcon, ShieldCheck, Database, Check } from 'lucide-react';
import { PlanType } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOGO_OPTIONS: { value: string; label: string; labelAr: string }[] = [
  { value: 'flower', label: 'Flower', labelAr: 'زهرة' },
  { value: 'store', label: 'Store', labelAr: 'متجر' },
  { value: 'gift', label: 'Gift', labelAr: 'هدية' },
  { value: 'luxury', label: 'Luxury', labelAr: 'فاخر' },
];

const CATEGORY_OPTIONS: { value: string; label: string; labelAr: string }[] = [
  { value: 'Jewelry', label: 'Jewelry & Gold', labelAr: 'المجوهرات والذهب' },
  { value: 'Cycles & Bikes', label: 'Cycles & Bikes', labelAr: 'الدراجات' },
  { value: 'Coffee Machines', label: 'Coffee & Espresso', labelAr: 'القهوة والإسبريسو' },
  { value: 'Fashion', label: 'Fashion & Apparel', labelAr: 'الأزياء والملابس' },
  { value: 'Home & Living', label: 'Home & Living', labelAr: 'المنزل والمعيشة' },
  { value: 'Beauty & Health', label: 'Beauty & Health', labelAr: 'الجمال والصحة' },
  { value: 'Electronics', label: 'Electronics', labelAr: 'الإلكترونيات' },
  { value: 'Sports', label: 'Sports & Fitness', labelAr: 'الرياضة واللياقة' },
];

export const CreateStoreModal: React.FC<CreateStoreModalProps> = ({ isOpen, onClose }) => {
  const { createNewStore } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Jewelry');
  const [owner, setOwner] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [plan, setPlan] = useState<PlanType>('pro');
  const [masterGrantedPro, setMasterGrantedPro] = useState(false);
  const [dbIsolation, setDbIsolation] = useState<'shared_store_id' | 'dedicated_mysql'>('shared_store_id');
  const [logoEmoji, setLogoEmoji] = useState('flower');
  const [enableEnglish, setEnableEnglish] = useState(true);
  const [enableArabic, setEnableArabic] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !owner.trim()) {
      toast(
        isAr ? 'يرجى إدخال اسم المتجر واسم المالك.' : 'Please enter the store name and owner name.',
        'error',
      );
      return;
    }

    if (!enableEnglish && !enableArabic) {
      toast(
        isAr ? 'يجب تفعيل لغة واحدة على الأقل للمتجر.' : 'At least one language must be enabled for the store.',
        'error',
      );
      return;
    }

    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `store-${Date.now().toString(36)}`;

    createNewStore({
      name,
      slug,
      category,
      owner,
      ownerEmail: ownerEmail || `${owner.toLowerCase().replace(/\s+/g, '')}@store.sa`,
      plan,
      masterGrantedPro,
      status: 'active',
      logo: logoEmoji,
      accentColor: '#059669',
      dbIsolation,
      languages: {
        english: enableEnglish,
        arabic: enableArabic,
      },
    });

    toast(
      isAr ? `تم إنشاء المتجر «${name}» بنجاح` : `Store "${name}" provisioned successfully`,
      'success',
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#05322e] to-[#0a4843] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-400/20 rounded-lg text-teal-300">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{isAr ? 'إنشاء متجر جديد' : 'Create New Store'}</h3>
              <p className="text-xs text-teal-200/80">
                {isAr ? 'تجهيز مستأجر تاجر جديد ومعزول' : 'Provision a new isolated merchant tenant'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title={isAr ? 'إغلاق' : 'Close'}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isAr ? 'اسم المتجر' : 'Store Name'} <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={logoEmoji}
                onChange={(e) => setLogoEmoji(e.target.value)}
                aria-label={isAr ? 'شعار المتجر' : 'Store logo'}
                className="w-24 px-2 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
              >
                {LOGO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {isAr ? o.labelAr : o.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: النور للساعات الفاخرة' : 'e.g. Al-Nour Luxury Watches'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'الفئة' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {isAr ? o.labelAr : o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'الباقة المبدئية' : 'Initial Plan'}
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white"
              >
                <option value="pro">
                  {isAr ? `تاجر Pro (${money(299)}/شهرياً)` : `Pro Merchant (${money(299)}/mo)`}
                </option>
                <option value="free">{isAr ? 'الباقة المجانية' : 'Free Tier'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'اسم مالك المتجر' : 'Merchant Owner Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: سلطان الغامدي' : 'e.g. Sultan Al-Ghamdi'}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'البريد الإلكتروني للمالك' : 'Owner Email'}
              </label>
              <input
                type="email"
                dir="ltr"
                placeholder="sultan@store.sa"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 text-start"
              />
            </div>
          </div>

          {/* Database Isolation Mode */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300" />
                {isAr ? 'نموذج عزل البيانات' : 'Data Isolation Model'}
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200 font-mono px-1.5 py-0.5 rounded">
                MySQL 8
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                dbIsolation === 'shared_store_id'
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/10 dark:border-teal-400/60'
                  : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  name="dbIsolation"
                  checked={dbIsolation === 'shared_store_id'}
                  onChange={() => setDbIsolation('shared_store_id')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="font-medium text-slate-900 block">
                    {isAr ? 'store_id مشترك' : 'Shared store_id'}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block">
                    {isAr ? 'بدون أعباء إضافية، تجهيز فوري للمستأجر' : 'Zero overhead, instant tenant setup'}
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                dbIsolation === 'dedicated_mysql'
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/10 dark:border-teal-400/60'
                  : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  name="dbIsolation"
                  checked={dbIsolation === 'dedicated_mysql'}
                  onChange={() => setDbIsolation('dedicated_mysql')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="font-medium text-slate-900 block">
                    {isAr ? 'MySQL مخصص' : 'Dedicated MySQL'}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight block">
                    {isAr ? 'حاوية قاعدة بيانات فعلية معزولة' : 'Isolated physical DB container'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Language Availability Options (Super Admin Control) */}
          <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>{isAr ? 'لغات المتجر المفعلة (تحكم الإدارة)' : 'Enabled Store Languages (Master Control)'}</span>
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableEnglish}
                  onChange={(e) => {
                    if (!e.target.checked && !enableArabic) {
                      toast(
                        isAr ? 'يجب تفعيل لغة واحدة على الأقل.' : 'At least one language must remain enabled.',
                        'info',
                      );
                      return;
                    }
                    setEnableEnglish(e.target.checked);
                  }}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  🇬🇧 English
                </span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableArabic}
                  onChange={(e) => {
                    if (!e.target.checked && !enableEnglish) {
                      toast(
                        isAr ? 'يجب تفعيل لغة واحدة على الأقل.' : 'At least one language must remain enabled.',
                        'info',
                      );
                      return;
                    }
                    setEnableArabic(e.target.checked);
                  }}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  🇸🇦 العربية
                </span>
              </label>
            </div>
          </div>

          {/* Master Grant Pro Option */}
          <label className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={masterGrantedPro}
              onChange={(e) => setMasterGrantedPro(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
            />
            <div>
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                {isAr ? 'تطبيق منحة الإدارة (باقة Pro مجانية)' : 'Apply Master Grant (Complimentary Pro Tier)'}
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-300/90 block">
                {isAr
                  ? 'يتجاوز الفوترة ويمنح تحليلات تسويقية غير محدودة ونشراً فورياً دون تأخير.'
                  : 'Bypasses billing and grants unlimited marketing analytics & zero-stale instant publish.'}
              </span>
            </div>
          </label>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isAr ? 'إنشاء المتجر' : 'Provision Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
