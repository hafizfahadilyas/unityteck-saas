import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { PlanType } from '../../types';
import {
  UserPlus,
  Link,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Store,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  buildRegisterUrl,
  createOnboardingInvite,
  listOnboardingInvites,
  ONBOARD_TIMEZONES,
  type OnboardingInvite,
} from '../../auth/invites';
import { useToast } from '../common/ToastProvider';
import { usePrefs } from '../../i18n/PrefsContext';

const FLOW_STEPS = [
  {
    n: '1',
    t: 'Invite link only',
    tAr: 'رابط دعوة فقط',
    d: 'No public register — Master generates link',
    dAr: 'لا يوجد تسجيل عام — المدير يُنشئ الرابط',
  },
  {
    n: '2',
    t: 'Client self-creates',
    tAr: 'العميل يُنشئ حسابه',
    d: 'User sets email/password + business details',
    dAr: 'يحدد المستخدم البريد/كلمة المرور وبيانات النشاط',
  },
  {
    n: '3',
    t: 'Own dashboard + plan',
    tAr: 'لوحة تحكم خاصة + باقة',
    d: 'Free/Paid/Pro gates; dummy data + themes',
    dAr: 'صلاحيات مجانية/مدفوعة/احترافية؛ بيانات تجريبية + قوالب',
  },
  {
    n: '4',
    t: 'Brand + Master grants',
    tAr: 'الهوية + صلاحيات المدير',
    d: 'Basic for all · advanced per Master allow',
    dAr: 'الأساسي للجميع · المتقدم حسب موافقة المدير',
  },
];

const CATEGORY_OPTIONS = [
  { value: 'Fashion', en: 'Fashion & Apparel', ar: 'الأزياء والملابس' },
  { value: 'Jewelry', en: 'Jewelry & Gold', ar: 'المجوهرات والذهب' },
  { value: 'Beauty & Fragrance', en: 'Perfumes & Oud', ar: 'العطور والعود' },
  { value: 'Coffee Machines', en: 'Coffee & Roastery', ar: 'القهوة والمحامص' },
  { value: 'Cycles & Bikes', en: 'Cycles & Sports', ar: 'الدراجات والرياضة' },
  { value: 'Electronics', en: 'Electronics & Gaming', ar: 'الإلكترونيات والألعاب' },
];

export const MasterOnboarding: React.FC = () => {
  const { registerNewClient, switchToStore } = useTenant();
  const { toast } = useToast();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [copiedLink, setCopiedLink] = useState(false);
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [plan, setPlan] = useState<PlanType>('pro');
  const [phone, setPhone] = useState('+966 5');
  const [crNumber, setCrNumber] = useState('');
  const [inviteLabel, setInviteLabel] = useState('New merchant');
  const [invitePlan, setInvitePlan] = useState<PlanType>('pro');
  const [inviteLocale, setInviteLocale] = useState<'en' | 'ar'>('en');
  const [inviteDir, setInviteDir] = useState<'ltr' | 'rtl'>('ltr');
  const [inviteCurrency, setInviteCurrency] = useState<'SAR' | 'USD' | 'AED' | 'EUR'>('SAR');
  const [inviteTimezone, setInviteTimezone] = useState('Asia/Riyadh');
  const [activeInvite, setActiveInvite] = useState<OnboardingInvite | null>(null);
  const [inviteTick, setInviteTick] = useState(0);

  const [provisionedStoreId, setProvisionedStoreId] = useState<string | null>(null);
  const [copiedStoreId, setCopiedStoreId] = useState(false);

  const invites = useMemo(() => listOnboardingInvites(), [inviteTick, activeInvite]);
  const shareUrl = activeInvite ? buildRegisterUrl(activeInvite.token) : '';

  const planLabel = (p: string) => {
    switch (p) {
      case 'free':
        return isAr ? 'مجانية' : 'Free';
      case 'paid':
        return isAr ? 'مدفوعة' : 'Paid';
      case 'pro':
        return isAr ? 'احترافية' : 'Pro';
      case 'custom':
        return isAr ? 'مخصصة' : 'Custom';
      default:
        return p;
    }
  };

  const handleGenerateInvite = () => {
    const invite = createOnboardingInvite({
      plan: invitePlan,
      label: inviteLabel,
      daysValid: 7,
      locale: inviteLocale,
      textDir: inviteDir,
      currency: inviteCurrency,
      timezone: inviteTimezone,
    });
    setActiveInvite(invite);
    setInviteTick((n) => n + 1);
    toast(
      isAr
        ? `الدعوة جاهزة · store_id ${invite.storeId}`
        : `Invite ready · store_id ${invite.storeId}`,
      'success',
    );
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast(isAr ? 'أنشئ رابطاً أولاً' : 'Generate a link first', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast(isAr ? 'تم نسخ رابط الدعوة' : 'Invite link copied', 'success');
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast(isAr ? 'تعذّر النسخ' : 'Copy failed', 'error');
    }
  };

  const handleCopyStoreId = async () => {
    if (!provisionedStoreId) return;
    try {
      await navigator.clipboard.writeText(provisionedStoreId);
      setCopiedStoreId(true);
      toast(isAr ? 'تم نسخ معرّف المتجر' : 'Store ID copied', 'success');
      window.setTimeout(() => setCopiedStoreId(false), 2000);
    } catch {
      toast(isAr ? 'تعذّر النسخ' : 'Copy failed', 'error');
    }
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !businessName.trim() || !email.trim()) return;

    const newId = registerNewClient({
      clientName,
      email,
      businessName,
      category,
      plan,
      currency: inviteCurrency,
      locale: inviteLocale,
      textDirection: inviteDir,
      timezone: inviteTimezone,
      phone,
    });

    setProvisionedStoreId(newId);
    toast(isAr ? `تم تجهيز المتجر · ${newId}` : `Store provisioned · ${newId}`, 'success');
  };

  const darkInputStyle: React.CSSProperties = {
    backgroundColor: 'rgba(2, 28, 36, 0.95)',
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  };

  const lightInputCls =
    'w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto text-slate-800">
      <div>
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {isAr ? 'بوابة التسجيل الذاتي للعملاء' : 'Client Self-Onboarding Portal'}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
          {isAr
            ? 'يشارك المدير رابط دعوة الحساب فقط. ينشئ العميل حسابه بنفسه ← ويحصل على لوحة تحكم متجره الخاصة (ميزات مجانية/مدفوعة/احترافية). يتم تهيئة المتجر بكتالوج تجريبي ومُنتقي القوالب، ثم يتبع كل شيء هوية ذلك المتجر. الميزات الأساسية للجميع؛ والمتقدمة حسب ما يسمح به المدير لكل متجر.'
            : "Master only shares an account invite link. Client creates their own account → gets their own store dashboard (Free/Paid/Pro features). Dummy catalog + theme picker seed the store; then everything follows that store's branding. Basic features for all; advanced only what Master allows per store."}
        </p>
      </div>

      {/* Locked product flow reminder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
        {FLOW_STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
          >
            <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 text-[10px] font-black">
              {s.n}
            </span>
            <p className="font-bold text-slate-900 mt-1.5">{isAr ? s.tAr : s.t}</p>
            <p className="text-slate-500 mt-0.5 leading-snug">{isAr ? s.dAr : s.d}</p>
          </div>
        ))}
      </div>

      {/* Secure invite generator */}
      <div className="p-6 bg-gradient-to-r from-teal-950 via-emerald-950 to-slate-950 text-white rounded-2xl shadow-lg border border-teal-500/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-black text-teal-300 tracking-wider px-2 py-0.5 rounded-full bg-teal-900/60 border border-teal-500/30">
                {isAr ? 'آمن · يُنشأ من المدير فقط' : 'Secure · Master-generated only'}
              </span>
              <span className="text-[10px] font-semibold text-emerald-300">
                {isAr ? 'استخدام واحد · صلاحية الرمز 7 أيام' : 'Single-use · 7-day token expiry'}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              {isAr ? 'رابط تسجيل عميل جديد' : 'New client register link'}
            </h3>
            <p className="text-xs text-teal-100/80 max-w-2xl mt-0.5 leading-relaxed">
              {isAr
                ? 'أنشئ رابط دعوة معزولاً لتسجيل تاجر جديد. لا تظهر أي بيانات لمتاجر أخرى في النموذج.'
                : 'Generate an isolated invitation link for onboarding a new merchant. No other store data is exposed on the form.'}
            </p>
          </div>
        </div>

        {/* Labeled responsive inputs grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 pt-3 border-t border-white/10">
          <div>
            <label className="block text-[11px] font-bold text-teal-200 mb-1">
              {isAr ? 'اسم التاجر / المتجر' : 'Merchant / Store Label'}
            </label>
            <input
              value={inviteLabel}
              onChange={(e) => setInviteLabel(e.target.value)}
              placeholder={isAr ? 'مثال: عطور مكة' : 'e.g. Makkah Perfumes'}
              className="w-full px-3 py-2 rounded-xl text-xs outline-none border transition-all dark-control"
              style={darkInputStyle}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-teal-200 mb-1">
              {isAr ? 'فئة الباقة' : 'Plan Tier'}
            </label>
            <select
              value={invitePlan}
              onChange={(e) => setInvitePlan(e.target.value as PlanType)}
              className="w-full px-3 py-2 rounded-xl text-xs outline-none border transition-all dark-control"
              style={darkInputStyle}
            >
              <option value="free">{isAr ? 'الباقة المجانية' : 'Free Tier'}</option>
              <option value="paid">{isAr ? 'المدفوعة المبتدئة' : 'Paid Starter'}</option>
              <option value="pro">{isAr ? 'التاجر الاحترافي' : 'Pro Merchant'}</option>
              <option value="custom">{isAr ? 'مؤسسية مخصصة' : 'Enterprise Custom'}</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-teal-200 mb-1">
              {isAr ? 'اللغة' : 'Language'}
            </label>
            <select
              value={inviteLocale}
              onChange={(e) => {
                const loc = e.target.value as 'en' | 'ar';
                setInviteLocale(loc);
                setInviteDir(loc === 'ar' ? 'rtl' : 'ltr');
              }}
              className="w-full px-3 py-2 rounded-xl text-xs outline-none border transition-all dark-control"
              style={darkInputStyle}
            >
              <option value="en">English (LTR)</option>
              <option value="ar">العربية (RTL)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-teal-200 mb-1">
              {isAr ? 'العملة' : 'Currency'}
            </label>
            <select
              value={inviteCurrency}
              onChange={(e) =>
                setInviteCurrency(e.target.value as 'SAR' | 'USD' | 'AED' | 'EUR')
              }
              className="w-full px-3 py-2 rounded-xl text-xs outline-none border transition-all dark-control"
              style={darkInputStyle}
            >
              <option value="SAR">{isAr ? 'SAR (ريال سعودي)' : 'SAR (Saudi Riyal)'}</option>
              <option value="USD">{isAr ? 'USD (دولار $)' : 'USD ($)'}</option>
              <option value="AED">{isAr ? 'AED (درهم إماراتي)' : 'AED (Dirham)'}</option>
              <option value="EUR">{isAr ? 'EUR (يورو €)' : 'EUR (€)'}</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-teal-200 mb-1">
              {isAr ? 'المنطقة الزمنية' : 'Timezone'}
            </label>
            <select
              value={inviteTimezone}
              onChange={(e) => setInviteTimezone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs outline-none border transition-all dark-control"
              style={darkInputStyle}
              dir="ltr"
            >
              {ONBOARD_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerateInvite}
              className="w-full px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isAr ? 'إنشاء الرابط' : 'Generate link'}</span>
            </button>
          </div>
        </div>

        {activeInvite && (
          <div className="flex flex-wrap items-center gap-3 text-xs bg-teal-900/40 p-2.5 rounded-xl border border-teal-500/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 px-2 py-0.5 rounded bg-teal-950/80">
              {isAr ? 'store_id المحجوز' : 'Reserved store_id'}
            </span>
            <code className="text-white font-mono font-bold">{activeInvite.storeId}</code>
            <span className="text-teal-300">·</span>
            <span className="text-teal-100 font-semibold">{activeInvite.locale.toUpperCase()} / {activeInvite.textDir.toUpperCase()}</span>
            <span className="text-teal-300">·</span>
            <span className="text-teal-100 font-semibold">{activeInvite.currency}</span>
            <span className="text-teal-300">·</span>
            <span className="text-teal-100 font-mono text-[11px]">{activeInvite.timezone}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/45 p-2.5 rounded-xl border border-white/20">
          <div className="flex items-center gap-2 min-w-0 flex-1 px-2">
            <Link className="w-4 h-4 text-teal-300 shrink-0" />
            <code className="text-xs text-teal-100 font-mono truncate select-all" dir={shareUrl ? 'ltr' : undefined}>
              {shareUrl ||
                (isAr
                  ? 'أنشئ رابطاً لنسخ عنوان آمن بصيغة /store/register?invite=…'
                  : 'Generate a link to copy a secure /store/register?invite=… URL')}
            </code>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            disabled={!shareUrl}
            className="px-4 py-2 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>
              {copiedLink ? (isAr ? 'تم النسخ!' : 'Copied!') : isAr ? 'نسخ الرابط' : 'Copy Link'}
            </span>
          </button>
        </div>

        {invites.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-white/20 bg-black/40">
            <table className="w-full text-xs text-start">
              <thead className="bg-black/60 text-teal-200 font-bold border-b border-white/15">
                <tr>
                  <th className="px-3.5 py-2.5 font-bold text-start">{isAr ? 'الاسم' : 'Label'}</th>
                  <th className="px-3.5 py-2.5 font-bold text-start">store_id</th>
                  <th className="px-3.5 py-2.5 font-bold text-start">{isAr ? 'الباقة' : 'Plan'}</th>
                  <th className="px-3.5 py-2.5 font-bold text-start">{isAr ? 'اللغة / الاتجاه' : 'Lang / Dir'}</th>
                  <th className="px-3.5 py-2.5 font-bold text-start">{isAr ? 'العملة' : 'Currency'}</th>
                  <th className="px-3.5 py-2.5 font-bold text-start">{isAr ? 'المنطقة الزمنية' : 'TZ'}</th>
                  <th className="px-3.5 py-2.5 font-bold text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-3.5 py-2.5 font-bold text-start">{isAr ? 'تاريخ الانتهاء' : 'Expires'}</th>
                </tr>
              </thead>
              <tbody>
                {invites.slice(0, 8).map((inv) => {
                  const used = Boolean(inv.usedAt);
                  const expired = new Date(inv.expiresAt).getTime() < Date.now();
                  return (
                    <tr key={inv.token} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-white">{inv.label}</td>
                      <td className="px-3.5 py-2.5 font-mono text-teal-200 font-bold">{inv.storeId}</td>
                      <td className="px-3.5 py-2.5 capitalize text-teal-100 font-semibold">{planLabel(inv.plan)}</td>
                      <td className="px-3.5 py-2.5 text-teal-100">
                        {inv.locale.toUpperCase()} / {inv.textDir.toUpperCase()}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-white">{inv.currency}</td>
                      <td className="px-3.5 py-2.5 font-mono text-teal-200/80 truncate max-w-[8rem]">
                        {inv.timezone}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {used ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {isAr ? 'مستخدمة' : 'Used'}
                          </span>
                        ) : expired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {isAr ? 'منتهية' : 'Expired'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {isAr ? 'نشطة' : 'Active'}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-teal-200/80 text-[11px]">
                        {new Date(inv.expiresAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Master-side simulator (internal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-5">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                {isAr ? 'محاكاة التجهيز من المدير (داخلي)' : 'Master simulate provision (internal)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'اختياري: تجهيز متجر من لوحة التحكم دون رابط العميل'
                  : 'Optional: provision from dashboard without client link'}
              </p>
            </div>
            <span className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full shrink-0">
              {isAr ? 'إعداد فوري' : 'Instant Setup'}
            </span>
          </div>

          <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'الاسم الكامل للعميل *' : 'Client Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: طارق منصور' : 'e.g. Tariq Mansoor'}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={lightInputCls}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@business.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={lightInputCls}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'ملاحظة مؤقتة (غير مُشاركة)' : 'Temp note (not shared)'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isAr ? 'يحدد العميل كلمة المرور في نموذج الدعوة' : 'Client sets password on invite form'
                  }
                  className={`${lightInputCls} font-mono`}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'رقم الجوال السعودي *' : 'Saudi Phone *'}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${lightInputCls} font-mono`}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'اسم النشاط التجاري *' : 'Business Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={lightInputCls}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'فئة المتجر' : 'Store Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none bg-white"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {isAr ? c.ar : c.en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'الباقة المختارة' : 'Selected Plan'}
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as PlanType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none bg-white"
                >
                  <option value="pro">{isAr ? 'التاجر الاحترافي' : 'Pro Merchant'}</option>
                  <option value="paid">{isAr ? 'مدفوعة' : 'Paid'}</option>
                  <option value="free">{isAr ? 'الباقة المجانية' : 'Free Tier'}</option>
                  <option value="custom">{isAr ? 'مخصصة' : 'Custom'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isAr ? 'السجل التجاري / معروف' : 'CR / Maroof'}
              </label>
              <input
                type="text"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none font-mono"
                dir="ltr"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isAr ? 'العزل بعد التسجيل' : 'Isolation after register'}
              </span>
              <ul className="grid grid-cols-2 gap-2 ps-4 list-disc">
                <li>{isAr ? 'store_id فريد في كل سجل' : 'Unique store_id on every row'}</li>
                <li>{isAr ? 'لا بيانات لمتاجر أخرى في واجهة العميل' : 'No cross-tenant data in client UI'}</li>
                <li>{isAr ? 'تُستهلك الدعوة بعد أول استخدام' : 'Invite consumed after first use'}</li>
                <li>{isAr ? 'كلمة المرور يحددها العميل فقط' : 'Password set only by the client'}</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>
                {isAr ? 'تسجيل وتجهيز متجر تجريبي تلقائياً' : 'Register & Auto-Provision Demo Store'}
              </span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-4">
          {provisionedStoreId ? (
            <div className="p-6 bg-white rounded-2xl border-2 border-emerald-500 shadow-lg text-slate-800">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center mb-3">
                <Check className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                {isAr ? 'المتجر جاهز' : 'Store Ready'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {isAr ? `تم تجهيز ${businessName}!` : `${businessName} Provisioned!`}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isAr ? (
                  <>
                    العميل <strong>{clientName}</strong> لديه لوحة تحكم معزولة بمعرّف store_id خاص.
                  </>
                ) : (
                  <>
                    Client <strong>{clientName}</strong> has an isolated store_id dashboard.
                  </>
                )}
              </p>
              <div className="my-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200 font-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">{isAr ? 'معرّف المتجر' : 'Store ID'}</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-slate-900 truncate">{provisionedStoreId}</span>
                    <button
                      type="button"
                      onClick={() => void handleCopyStoreId()}
                      title={isAr ? 'نسخ معرّف المتجر' : 'Copy store ID'}
                      aria-label={isAr ? 'نسخ معرّف المتجر' : 'Copy store ID'}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer shrink-0"
                    >
                      {copiedStoreId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchToStore(provisionedStoreId)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isAr ? 'فتح لوحة تحكم المتجر' : 'Open Store Dashboard'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          ) : (
            <div className="p-6 bg-slate-100/70 border border-dashed border-slate-300 rounded-2xl text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-700">
                {isAr ? 'أرسل دعوة أو نفّذ محاكاة' : 'Send invite or simulate'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {isAr
                  ? 'أنشئ رابطاً آمناً لنموذج العميل متعدد الخطوات، أو جهّز المتجر داخلياً من النموذج المجاور.'
                  : 'Generate a secure link for the client multi-step form, or provision internally on the left.'}
              </p>
            </div>
          )}

          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'الأمان' : 'Security'}</span>
            </h4>
            <div className="space-y-2 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  {isAr ? (
                    <>
                      <strong>لا يوجد تسجيل مفتوح</strong> في صفحة الدخول — يلزم رمز دعوة.
                    </>
                  ) : (
                    <>
                      <strong>No open register</strong> on login — invite token required.
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  {isAr ? (
                    <>
                      <strong>عزل store_id</strong> — لا يمكن لتاجر قراءة سجلات تاجر آخر.
                    </>
                  ) : (
                    <>
                      <strong>store_id isolation</strong> — one merchant cannot read another&apos;s rows.
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  {isAr ? (
                    <>
                      <strong>رموز مُبهمة</strong> — لا يحتوي الرابط على بريد أو كلمة مرور لعملاء آخرين.
                    </>
                  ) : (
                    <>
                      <strong>Opaque tokens</strong> — URL has no email/password of other clients.
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
