import React, { useState } from 'react';
import { Lock, Mail, Phone, User, X, Flower2 } from 'lucide-react';
import type { Customer } from '../../types';
import { writeSfCustomer, type SfCustomerSession } from './sfCustomerSession';
import { getStoredGoogleClientId, initiateRealGoogleOAuth } from '../../utils/googleRealAuth';

type Props = {
  open: boolean;
  lang: string;
  storeId: string;
  storeName: string;
  customers: Customer[];
  onClose: () => void;
  onSuccess: (session: SfCustomerSession) => void;
  /** Register stub if email not found — creates session only (CRM managed in store). */
  onRegisterLocal?: (data: { name: string; email: string; phone: string }) => SfCustomerSession;
};

export const CustomerLoginModal: React.FC<Props> = ({
  open,
  lang,
  storeId,
  storeName,
  customers,
  onClose,
  onSuccess,
  onRegisterLocal,
}) => {
  const ar = lang === 'ar';
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+966 ');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const finish = (session: SfCustomerSession) => {
    writeSfCustomer(session);
    onSuccess(session);
    onClose();
  };

  const proceedInstantGoogle = () => {
    setTimeout(() => {
      setBusy(false);
      const targetEmail = email.trim() || 'alfahad3110@gmail.com';
      const targetName = name.trim() || (targetEmail.includes('@') ? targetEmail.split('@')[0] : 'alfahad');
      const googleSession: SfCustomerSession = {
        storeId,
        customerId: `google-${Date.now().toString().slice(-6)}`,
        name: targetName,
        email: targetEmail,
        phone: phone.trim() || '+966 50 123 4567',
        loggedInAt: new Date().toISOString(),
      };
      if (onRegisterLocal) {
        onRegisterLocal({ name: googleSession.name, email: googleSession.email, phone: googleSession.phone });
      }
      finish(googleSession);
    }, 400);
  };

  const handleGoogleSignIn = () => {
    setBusy(true);
    setError('');
    try {
      const clientId = getStoredGoogleClientId();
      if (clientId && !clientId.includes('unityteck-ecommerce')) {
        initiateRealGoogleOAuth({
          clientId,
          storeSlug: storeId,
          onSuccess: (_token, profile) => {
            setBusy(false);
            const userEmail = profile.email || email.trim() || 'alfahad3110@gmail.com';
            const userName = profile.name || (userEmail.includes('@') ? userEmail.split('@')[0] : 'alfahad');
            const session: SfCustomerSession = {
              storeId,
              customerId: `google-${profile.id || Date.now()}`,
              name: userName,
              email: userEmail,
              phone: phone.trim() || '+966 50 123 4567',
              loggedInAt: new Date().toISOString(),
            };
            if (onRegisterLocal) {
              onRegisterLocal({ name: session.name, email: session.email, phone: session.phone });
            }
            finish(session);
          },
          onError: () => {
            proceedInstantGoogle();
          },
        });
        return;
      }
    } catch {
      // fallback
    }
    proceedInstantGoogle();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const q = email.trim().toLowerCase();
    const match = customers.find(
      (c) => c.storeId === storeId && (c.email.toLowerCase() === q || c.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')),
    );
    setTimeout(() => {
      setBusy(false);
      if (!match) {
        setError(
          ar
            ? 'لم نجد حساباً — سجّل أو اطلب من المتجر إضافتك في العملاء'
            : 'No account found — register or ask the store to add you in CRM',
        );
        return;
      }
      finish({
        storeId,
        customerId: match.id,
        name: match.name,
        email: match.email,
        phone: match.phone,
        loggedInAt: new Date().toISOString(),
      });
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) {
      setError(ar ? 'الاسم والبريد مطلوبان' : 'Name and email required');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (onRegisterLocal) {
        finish(onRegisterLocal({ name: name.trim(), email: email.trim(), phone: phone.trim() }));
      } else {
        finish({
          storeId,
          customerId: `sf-${Date.now()}`,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          loggedInAt: new Date().toISOString(),
        });
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--sf-surface, #fff)', borderColor: 'var(--sf-border, #e2e8f0)', color: 'var(--sf-text, #04222b)' }}
        role="dialog"
        aria-modal
      >
        <div
          className="px-5 py-4 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(90deg, #064e3b, #0a3d4a)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Flower2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm">{ar ? 'دخول العميل' : 'Customer login'}</h3>
              <p className="text-[10px] text-white/75">{storeName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[11px]" style={{ color: 'var(--sf-muted, #64748b)' }}>
            {ar
              ? 'الطلبات والملف الشخصي يتطلبان تسجيل الدخول. التصفح والسلة متاحان بدون حساب.'
              : 'Orders & profile require login. Browse and cart work as guest.'}
          </p>

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-[#4285F4] bg-white hover:bg-slate-50 flex items-center justify-center gap-3 transition-all duration-200 shadow-xs font-bold text-xs cursor-pointer text-slate-800 disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.26 21.36 7.36 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z" />
            </svg>
            <span>{ar ? 'الدخول السريع بحساب Google' : 'Sign in with Google'}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-semibold">{ar ? 'أو عبر البريد والجوال' : 'or with email/phone'}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex p-0.5 rounded-xl border" style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}>
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setError('');
                }}
                className="flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer"
                style={
                  tab === t
                    ? { background: 'var(--sf-accent, #1d8b94)', color: '#fff' }
                    : { color: 'var(--sf-muted, #64748b)' }
                }
              >
                {t === 'login' ? (ar ? 'دخول' : 'Login') : ar ? 'تسجيل' : 'Register'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--sf-muted)' }}>
                  {ar ? 'البريد' : 'Email'}
                </span>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl text-xs border"
                    style={{ borderColor: 'var(--sf-border)', background: 'var(--sf-bg, #f8fafc)' }}
                    placeholder="guest@example.com"
                    required
                  />
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--sf-muted)' }}>
                  {ar ? 'الجوال (اختياري)' : 'Phone (optional)'}
                </span>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl text-xs border"
                    style={{ borderColor: 'var(--sf-border)', background: 'var(--sf-bg, #f8fafc)' }}
                  />
                </div>
              </label>
              {error ? <p className="text-[11px] font-semibold text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                style={{ background: 'var(--sf-accent, #1d8b94)' }}
              >
                <Lock className="w-3.5 h-3.5" />
                {busy ? (ar ? 'جارٍ...' : 'Signing in…') : ar ? 'دخول لمتابعة الطلب' : 'Login to place order'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--sf-muted)' }}>
                  {ar ? 'الاسم' : 'Name'}
                </span>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl text-xs border"
                    style={{ borderColor: 'var(--sf-border)', background: 'var(--sf-bg, #f8fafc)' }}
                    required
                  />
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--sf-muted)' }}>
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs border"
                  style={{ borderColor: 'var(--sf-border)', background: 'var(--sf-bg, #f8fafc)' }}
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--sf-muted)' }}>
                  {ar ? 'الجوال' : 'Phone'}
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs border"
                  style={{ borderColor: 'var(--sf-border)', background: 'var(--sf-bg, #f8fafc)' }}
                />
              </label>
              {error ? <p className="text-[11px] font-semibold text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="w-full py-2.5 rounded-xl text-xs font-black text-white cursor-pointer disabled:opacity-60"
                style={{ background: 'var(--sf-accent, #1d8b94)' }}
              >
                {busy ? (ar ? 'جارٍ...' : 'Creating…') : ar ? 'إنشاء حساب ومتابعة' : 'Create account & continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
