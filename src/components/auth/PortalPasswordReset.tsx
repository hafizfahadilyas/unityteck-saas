import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Flower2,
  KeyRound,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Store,
} from 'lucide-react';
import {
  DEMO_CREDENTIALS,
  forgotPassword,
  requestOtp,
  resetPassword,
  verifyOtp,
} from '../../auth/api';
import type { AuthPortal } from '../../auth/session';
import { useToast } from '../common/ToastProvider';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';

type Mode = 'forgot' | 'reset';

type PortalPasswordResetProps = {
  portal: AuthPortal;
  mode: Mode;
  onBackToLogin: () => void;
  onGoReset: (email: string, token: string) => void;
};

function readQuery(): { email: string; token: string } {
  if (typeof window === 'undefined') return { email: '', token: '' };
  const q = new URLSearchParams(window.location.search);
  return {
    email: q.get('email') ?? '',
    token: q.get('token') ?? '',
  };
}

/** Phase 2.2 — Holst forgot / reset (same shell as PortalLogin; no invent). */
export const PortalPasswordReset: React.FC<PortalPasswordResetProps> = ({
  portal,
  mode,
  onBackToLogin,
  onGoReset,
}) => {
  const { toast } = useToast();
  const { t, theme, locale, dir } = usePrefs();
  const storeBrand =
    locale === 'ar' ? t('storeDemoBrandAr') : t('storeDemoBrandEn');
  const [email, setEmail] = useState(() => readQuery().email || '');
  const [token, setToken] = useState(() => readQuery().token);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);

  const isMaster = portal === 'master';

  useEffect(() => {
    document.documentElement.setAttribute('data-portal', portal);
  }, [portal]);

  useEffect(() => {
    if (mode !== 'reset') return;
    const q = readQuery();
    if (q.email) setEmail(q.email);
    if (q.token) setToken(q.token);
  }, [mode, portal]);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await forgotPassword(portal, email.trim());
      toast(t('forgotSent'), 'success');
      if (res.dev_token) {
        onGoReset(res.dev_email ?? email.trim(), res.dev_token);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : t('forgotFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await resetPassword(portal, {
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirm,
      });
      toast(t('resetSuccess'), 'success');
      onBackToLogin();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('resetFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestOtp = async () => {
    if (otpBusy) return;
    setOtpBusy(true);
    try {
      const res = await requestOtp(portal, email.trim(), 'reset');
      toast(t('otpSent'), 'success');
      if (res.dev_code) setOtpCode(res.dev_code);
    } catch (err) {
      toast(err instanceof Error ? err.message : t('otpFailed'), 'error');
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpBusy) return;
    setOtpBusy(true);
    try {
      await verifyOtp(portal, email.trim(), 'reset', otpCode.trim());
      toast(t('otpVerified'), 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('otpInvalid'), 'error');
    } finally {
      setOtpBusy(false);
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

        <div
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] font-bold shrink-0"
          style={{
            background: 'var(--active-bg)',
            color: 'var(--active-fg)',
          }}
        >
          {isMaster ? <ShieldCheck className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">
            {isMaster ? t('masterAdmin') : t('storeAdmin')}
          </span>
        </div>

        <div className="shrink-0">
          <PrefsSwitcher showCurrency={!isMaster} />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
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
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--muted)' }}
              >
                {isMaster ? t('brand') : storeBrand}
              </p>
              <h2
                className="text-lg font-extrabold leading-tight"
                style={{ color: 'var(--text)' }}
              >
                {mode === 'forgot' ? t('forgotTitle') : t('resetTitle')}
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {mode === 'forgot' ? t('forgotSubtitle') : t('resetSubtitle')}
              </p>
            </div>
          </div>

          {mode === 'forgot' ? (
            <form onSubmit={handleForgot} className="space-y-4">
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
                    required
                    className="w-full ps-10 pe-3 py-3 text-sm rounded-2xl border outline-none focus:ring-2 transition-shadow duration-150"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all duration-150 hover:opacity-95 shadow-sm"
                style={{ background: 'var(--portal-cta)', color: '#FFFFFF' }}
              >
                {busy ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"
                      aria-hidden
                    />
                    <span>{t('sendingReset')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('sendResetLink')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
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
                    required
                    className="w-full ps-10 pe-3 py-3 text-sm rounded-2xl border outline-none focus:ring-2"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-xs font-bold block mb-1.5"
                  style={{ color: 'var(--text)' }}
                >
                  {t('resetToken')}
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  className="w-full px-3 py-3 text-sm rounded-2xl border outline-none focus:ring-2 font-mono"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                />
              </div>

              <div>
                <label
                  className="text-xs font-bold block mb-1.5"
                  style={{ color: 'var(--text)' }}
                >
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full ps-10 pe-11 py-3 text-sm rounded-2xl border outline-none focus:ring-2"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
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
              </div>

              <div>
                <label
                  className="text-xs font-bold block mb-1.5"
                  style={{ color: 'var(--text)' }}
                >
                  {t('confirmPassword')}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-3 text-sm rounded-2xl border outline-none focus:ring-2"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all duration-150 hover:opacity-95 shadow-sm"
                style={{ background: 'var(--portal-cta)', color: '#FFFFFF' }}
              >
                {busy ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"
                      aria-hidden
                    />
                    <span>{t('savingPassword')}</span>
                  </>
                ) : (
                  <span>{t('saveNewPassword')}</span>
                )}
              </button>
            </form>
          )}

          {/* OTP stub — Phase 2.2 delivery later */}
          <div
            className="mt-5 pt-4 border-t space-y-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
              {t('otpStubLabel')}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="flex-1 px-3 py-2.5 text-sm rounded-xl border font-mono tracking-widest"
                style={{
                  background: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--input-fg)',
                }}
              />
              <button
                type="button"
                disabled={otpBusy}
                aria-busy={otpBusy}
                onClick={handleRequestOtp}
                className="px-3 py-2.5 rounded-xl text-[11px] font-bold border cursor-pointer disabled:opacity-60"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  background: 'var(--input-bg)',
                }}
              >
                {t('sendOtp')}
              </button>
              <button
                type="button"
                disabled={otpBusy || otpCode.length !== 6}
                aria-busy={otpBusy}
                onClick={handleVerifyOtp}
                className="px-3 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-60"
                style={{ background: 'var(--portal-cta)', color: '#FFFFFF' }}
              >
                {t('verifyOtp')}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToLogin}
            className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
            style={{ color: 'var(--portal-600, var(--muted))' }}
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {t('backToSignIn')}
          </button>
        </div>
      </div>
    </div>
  );
};
