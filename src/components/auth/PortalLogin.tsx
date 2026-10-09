import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Flower2,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { loginPortal } from '../../auth/api';
import type { AuthPortal } from '../../auth/session';
import { useToast } from '../common/ToastProvider';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
import { MasterLoginArt, StoreLoginArt } from './LoginHeroArt';

type PortalLoginProps = {
  portal: AuthPortal;
  onSuccess: (portal: AuthPortal, storeId?: string | null) => void;
  onSwitchPortal: (portal: AuthPortal) => void;
  onForgotPassword?: () => void;
};

export const PortalLogin: React.FC<PortalLoginProps> = ({
  portal,
  onSuccess,
  onSwitchPortal,
  onForgotPassword,
}) => {
  const { toast } = useToast();
  const { t, theme, locale, dir } = usePrefs();
  const storeBrand =
    locale === 'ar' ? t('storeDemoBrandAr') : t('storeDemoBrandEn');
  const storeTagline =
    locale === 'ar' ? t('storeDemoTaglineAr') : t('storeDemoTaglineEn');
  const [email, setEmail] = useState<string>(() => {
    try {
      const remembered = localStorage.getItem('unityteck_last_login_email');
      if (remembered) return remembered;
    } catch {}
    return '';
  });
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-portal', portal);
  }, [portal]);

  useEffect(() => {
    setPassword('');
  }, [portal]);

  const isMaster = portal === 'master';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const effectiveEmail = email.trim();
    const effectivePassword = password;

    if (!effectiveEmail || !effectivePassword) {
      toast(
        locale === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
          : 'Please enter your email and password',
        'error',
      );
      return;
    }

    setBusy(true);
    try {
      const session = await loginPortal(portal, effectiveEmail, effectivePassword);
      try {
        localStorage.setItem('unityteck_last_login_email', effectiveEmail);
      } catch {}
      toast(
        isMaster
          ? t('signedInMaster')
          : `${t('signedInStore')} · ${session.storeName ?? storeBrand}`,
        'success',
      );
      onSuccess(session.portal, session.storeId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('signInFailed');
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      dir={dir}
      lang={locale}
      data-theme={theme}
      data-portal={portal}
      className="portal-auth-shell min-h-screen flex flex-col"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <header
        className="shrink-0 z-20 border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background: 'var(--portal-cta)',
              color: '#FFFFFF',
              borderRadius: 'var(--icon-radius)',
            }}
          >
            {isMaster ? <Layers className="w-4 h-4" /> : <Flower2 className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-wider leading-none"
              style={{ color: 'var(--muted)' }}
            >
              {isMaster ? t('brand') : t('storeDemoBrandAr')}
            </p>
            <p
              className="text-sm font-extrabold truncate leading-tight mt-0.5"
              style={{ color: 'var(--text)' }}
            >
              {isMaster ? t('masterAdmin') : storeBrand}
            </p>
          </div>
        </div>

        {/* LOCK: Store login never shows Master switch */}
        {isMaster ? (
          <div
            className="flex items-center p-1 rounded-2xl border shrink-0"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
            role="tablist"
            aria-label="Portal"
          >
            <button
              type="button"
              role="tab"
              aria-selected
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] font-bold cursor-default"
              style={{ background: 'var(--portal-cta)', color: '#FFFFFF' }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('masterAdmin')}</span>
              <span className="sm:hidden">{t('masterShort')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              onClick={() => onSwitchPortal('store')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-150 cursor-pointer"
              style={{ background: 'transparent', color: 'var(--text)' }}
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('storeAdmin')}</span>
              <span className="sm:hidden">{t('storeShort')}</span>
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] font-bold shrink-0"
            style={{
              background: 'var(--active-bg)',
              color: 'var(--active-fg)',
            }}
            aria-current="page"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('storeAdmin')}</span>
            <span className="sm:hidden">{t('storeShort')}</span>
          </div>
        )}

        <div className="shrink-0">
          <PrefsSwitcher showCurrency={!isMaster} />
        </div>
      </header>

      <div className="portal-auth-split flex-1 flex min-h-0 relative overflow-hidden">
        {/* Hero — Holst dark panel; text always light on this surface */}
        <aside
          className="portal-auth-hero relative lg:w-[46%] xl:w-[48%] px-6 sm:px-10 py-8 lg:py-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0"
          style={{
            borderColor: 'color-mix(in srgb, var(--portal-200) 20%, transparent)',
            background:
              'linear-gradient(165deg, var(--portal-950) 0%, var(--portal-900) 45%, var(--portal-600) 100%)',
            color: '#F7FFFC',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 20% 10%, var(--portal-200) 0%, transparent 55%)',
            }}
          />

          <div className="relative z-10 space-y-3 max-w-md" style={{ color: '#F7FFFC' }}>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#FFFFFF',
              }}
            >
              {isMaster ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <Flower2 className="w-3 h-3" />
              )}
              {isMaster ? t('masterBadge') : storeBrand}
            </span>
            <h1
              className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight"
              style={{ color: '#FFFFFF', fontFamily: 'var(--font-ui)' }}
            >
              {isMaster ? t('masterHookTitle') : t('storeHookTitle')}
            </h1>
            <p
              className="text-sm sm:text-[15px] leading-relaxed"
              style={{ color: 'rgba(247,255,252,0.92)' }}
            >
              {isMaster ? t('masterHookBody') : t('storeHookBody')}
            </p>
            {!isMaster && (
              <p
                className="text-xs font-semibold pt-1"
                style={{ color: 'var(--portal-200)' }}
              >
                {t('storeBrandHint')}
              </p>
            )}
          </div>

          <div className="relative z-10 mt-6 lg:mt-0 flex justify-center lg:justify-start rtl:lg:justify-end">
            {isMaster ? (
              <MasterLoginArt className="w-full max-w-[280px] sm:max-w-[320px] drop-shadow-lg" />
            ) : (
              <StoreLoginArt className="w-full max-w-[280px] sm:max-w-[320px] drop-shadow-lg" />
            )}
          </div>
        </aside>

        {/* Form column — follows theme: light ink on light, light ink on dark */}
        <main
          className="flex-1 flex items-center justify-center p-5 sm:p-8 relative"
          style={{ background: 'var(--bg)', color: 'var(--text)' }}
        >
          <div
            className="relative w-full max-w-[420px] rounded-3xl border p-7 sm:p-8 shadow-xl"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background: 'var(--portal-cta)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--icon-radius)',
                }}
              >
                {isMaster ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <Flower2 className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--muted)' }}
                >
                  {isMaster ? t('brand') : storeBrand}
                </p>
                <h2
                  className="text-lg font-extrabold leading-tight truncate"
                  style={{ color: 'var(--text)' }}
                >
                  {isMaster ? t('masterAdmin') : t('storeAdmin')}
                </h2>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                  {isMaster ? t('masterLoginSub') : storeTagline}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="text-xs font-bold block mb-1.5"
                  style={{ color: 'var(--text)' }}
                >
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full ps-10 pe-3 py-3 text-sm rounded-2xl border outline-none focus:ring-2 transition-shadow duration-150"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                      fontFamily: 'var(--font-ui)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-xs font-bold block mb-1.5"
                  style={{ color: 'var(--text)' }}
                >
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full ps-10 pe-11 py-3 text-sm rounded-2xl border outline-none focus:ring-2 transition-shadow duration-150"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                      fontFamily: 'var(--font-ui)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl cursor-pointer"
                    style={{ color: 'var(--muted)' }}
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {onForgotPassword ? (
                  <div className="mt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-[11px] font-bold cursor-pointer"
                      style={{ color: 'var(--portal-600, var(--muted))' }}
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all duration-150 hover:opacity-95 shadow-sm"
                style={{
                  background: 'var(--portal-cta)',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {busy ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"
                      aria-hidden
                    />
                    <span>{t('signingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('signIn')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>



            <div
              className="mt-5 pt-4 border-t text-center"
              style={{ borderColor: 'var(--border)' }}
            >
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isMaster ? t('masterLoginScope') : t('storeLoginScope')}
              </p>
              <p className="text-[10px] leading-relaxed mt-2" style={{ color: 'var(--muted)' }}>
                {t('regOnlyViaInvite')}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
