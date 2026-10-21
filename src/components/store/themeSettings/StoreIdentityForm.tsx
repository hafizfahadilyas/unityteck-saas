import React, { useEffect, useState } from 'react';
import { Building2, Check, Image, Mail, MapPin, Phone, Save, HardDrive, Copy, ExternalLink } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  defaultStoreIdentity,
  readStoreIdentity,
  writeStoreIdentity,
  type StoreIdentitySettings,
} from '../../../themes/settings/storeIdentity';
import { MediaUploadField } from '../../common/MediaUploadField';
import { COFFEE_STORE_WORKSPACE_PATH } from '../../../data/coffeeStoreData';

/**
 * Theme Settings · 01 Store Identity — Holst form, same-to-same Phase 5.1 start.
 * designs/Theme_Settings_UIUX/01_Store_Identity
 */
export const StoreIdentityForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const [form, setForm] = useState<StoreIdentitySettings>(() =>
    readStoreIdentity(activeStore.id, activeStore),
  );
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setForm(readStoreIdentity(activeStore.id, activeStore));
  }, [activeStore.id, activeStore.name, activeStore.logo, activeStore.ownerEmail]);

  const patch = <K extends keyof StoreIdentitySettings>(key: K, value: StoreIdentitySettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    writeStoreIdentity(activeStore.id, form);
    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(locale === 'ar' ? 'تم حفظ هوية المتجر' : 'Store identity saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 350);
  };

  const onReset = () => {
    const d = defaultStoreIdentity(activeStore);
    setForm(d);
    writeStoreIdentity(activeStore.id, d);
    toast(locale === 'ar' ? 'تمت إعادة الضبط' : 'Reset to defaults', 'info');
  };

  const field = (
    label: string,
    key: keyof StoreIdentitySettings,
    opts?: { dir?: 'ltr' | 'rtl'; type?: string; placeholder?: string },
  ) => (
    <label className="block space-y-1.5 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <input
        type={opts?.type || 'text'}
        value={String(form[key] ?? '')}
        onChange={(e) => patch(key, e.target.value as StoreIdentitySettings[typeof key])}
        dir={opts?.dir}
        placeholder={opts?.placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none"
        style={{
          background: 'var(--input-bg)',
          color: 'var(--input-fg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-ctrl)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)';
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      />
    </label>
  );

  return (
    <form
      onSubmit={onSave}
      className="rounded-2xl border p-5 sm:p-6 space-y-5"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 unity-icon-box"
          >
            <Building2 className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Theme Settings · 01
            </p>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
              {locale === 'ar' ? 'هوية المتجر والمعلومات' : 'Store Identity & Information'}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
              {locale === 'ar'
                ? 'الاسم · الشعار · التواصل · السجل التجاري — لكل متجر (store_id)'
                : 'Name · logo · contact · CR — scoped per store_id'}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-1 rounded-lg border shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          {activeStore.id}
        </span>
      </div>

      <div className="space-y-4">
        {field(locale === 'ar' ? 'اسم المتجر' : 'Store name', 'storeName')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {field('Tagline (EN)', 'taglineEn', { dir: 'ltr' })}
          {field('الشعار (عربي)', 'taglineAr', { dir: 'rtl' })}
        </div>
        <MediaUploadField
          label={locale === 'ar' ? 'شعار المتجر (Store Logo)' : 'Store Logo'}
          value={form.logoUrl}
          onChange={(url) => setForm((prev) => ({ ...prev, logoUrl: url }))}
          recommendedSize="200 × 200 px"
          aspectRatio="square"
          initialFolder="branding"
        />
      </div>

      {/* Contact Channels: Phone, WhatsApp, Email */}
      <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {locale === 'ar' ? 'قنوات التواصل المباشر' : 'Direct Contact Channels'}
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <Phone className="w-3 h-3 text-emerald-500" /> {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
            </span>
            {field('', 'phone', { dir: 'ltr', placeholder: '+966 50 000 0000' })}
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> WhatsApp
            </span>
            {field('', 'whatsapp', { dir: 'ltr', placeholder: '+966 50 000 0000' })}
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <Mail className="w-3 h-3 text-indigo-500" /> Email
            </span>
            {field('', 'email', { type: 'email', dir: 'ltr', placeholder: 'support@store.sa' })}
          </div>
        </div>
      </div>

      {/* Official Address & Registration */}
      <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {locale === 'ar' ? 'العنوان والبيانات الرسمية' : 'Official Address & Registration'}
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <MapPin className="w-3 h-3 text-rose-500" /> Address EN
            </span>
            {field('', 'addressEn', { dir: 'ltr', placeholder: 'King Fahd Rd, Riyadh' })}
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <MapPin className="w-3 h-3 text-rose-500" /> العنوان عربي
            </span>
            {field('', 'addressAr', { dir: 'rtl', placeholder: 'طريق الملك فهد، الرياض' })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field(locale === 'ar' ? 'المدينة' : 'City', 'city')}
          {field('Instagram', 'instagram', { dir: 'ltr', placeholder: '@handle' })}
          {field(locale === 'ar' ? 'السجل التجاري (CR)' : 'Commercial Registration (CR)', 'commercialReg', { dir: 'ltr' })}
          {field(locale === 'ar' ? 'الرقم الضريبي (VAT)' : 'VAT Number', 'vatNumber', { dir: 'ltr' })}
        </div>
      </div>

      {/* Connected Local Workspace Directory Link */}
      <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
            <HardDrive className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'مسار مجلد المشروع المحلي المرتبط (Local Workspace)' : 'Connected Local Workspace Path'}</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            {locale === 'ar' ? 'متصل' : 'Connected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold truncate bg-white dark:bg-slate-900" style={{ borderColor: 'var(--border)' }}>
            {activeStore.workspacePath || COFFEE_STORE_WORKSPACE_PATH}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(activeStore.workspacePath || COFFEE_STORE_WORKSPACE_PATH);
              toast(locale === 'ar' ? 'تم نسخ المسار' : 'Path copied', 'success');
            }}
            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
            title={locale === 'ar' ? 'نسخ المسار' : 'Copy path'}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <a
            href={`file:///${(activeStore.workspacePath || COFFEE_STORE_WORKSPACE_PATH).replace(/\\/g, '/')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-amber-800 text-white hover:bg-amber-900 cursor-pointer shadow-2xs"
            title={locale === 'ar' ? 'فتح المجلد' : 'Open folder'}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--bg)' }}
        >
          {locale === 'ar' ? 'إعادة ضبط' : 'Reset defaults'}
        </button>
        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60 unity-btn-primary"
        >
          {savedFlash ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saving
            ? locale === 'ar'
              ? 'جارٍ الحفظ…'
              : 'Saving…'
            : savedFlash
              ? locale === 'ar'
                ? 'تم الحفظ'
                : 'Saved'
              : locale === 'ar'
                ? 'حفظ الهوية'
                : 'Save identity'}
        </button>
      </div>
    </form>
  );
};
