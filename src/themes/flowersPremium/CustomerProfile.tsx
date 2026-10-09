import React from 'react';
import { LogOut, Package, User } from 'lucide-react';
import type { Order } from '../../types';
import type { SfCustomerSession } from './sfCustomerSession';

type Props = {
  lang: string;
  session: SfCustomerSession;
  orders: Order[];
  money: (n: number) => string;
  onLogout: () => void;
  onBack: () => void;
};

export const CustomerProfile: React.FC<Props> = ({
  lang,
  session,
  orders,
  money,
  onLogout,
  onBack,
}) => {
  const ar = lang === 'ar';
  const mine = orders.filter(
    (o) =>
      o.customerPhone?.replace(/\s/g, '') === session.phone.replace(/\s/g, '') ||
      o.customerName?.toLowerCase().includes(session.name.split(' ')[0]?.toLowerCase() || '___'),
  );

  return (
    <section className="px-4 sm:px-8 py-8 space-y-5" style={{ background: 'var(--sf-bg)', color: 'var(--sf-text)' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-2xl text-white font-bold flex items-center justify-center"
            style={{ background: 'var(--sf-accent)' }}
          >
            {session.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2 className="text-lg font-black flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {ar ? 'ملفي' : 'My profile'}
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--sf-muted)' }}>
              {session.name} · {session.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer"
            style={{ borderColor: 'var(--sf-border)', background: 'var(--sf-surface)' }}
          >
            {ar ? 'المتجر' : 'Store'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1 text-white"
            style={{ background: 'var(--tone-danger, #e11d48)' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            {ar ? 'خروج' : 'Logout'}
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl border p-4 space-y-2 text-xs"
        style={{ background: 'var(--sf-surface)', borderColor: 'var(--sf-border)' }}
      >
        <p>
          <span style={{ color: 'var(--sf-muted)' }}>{ar ? 'الجوال: ' : 'Phone: '}</span>
          <span className="font-semibold">{session.phone || '—'}</span>
        </p>
        <p className="text-[11px]" style={{ color: 'var(--sf-muted)' }}>
          {ar
            ? 'إدارة العملاء والطلبات من لوحة المتجر (CRM). هنا تعرض طلباتك المرتبطة بحسابك فقط.'
            : 'Customers & orders are managed from the store CRM. Here you only see orders linked to your account.'}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <Package className="w-4 h-4" style={{ color: 'var(--sf-accent)' }} />
          {ar ? 'طلباتي' : 'My orders'}
        </h3>
        {mine.length === 0 ? (
          <p
            className="text-xs rounded-2xl border p-6 text-center"
            style={{ borderColor: 'var(--sf-border)', color: 'var(--sf-muted)', background: 'var(--sf-surface)' }}
          >
            {ar ? 'لا طلبات بعد — سجّل الدخول قبل إتمام الشراء.' : 'No orders yet — login before checkout to track them here.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {mine.map((o) => (
              <li
                key={o.id}
                className="rounded-2xl border p-3 flex items-center justify-between gap-3 text-xs"
                style={{ background: 'var(--sf-surface)', borderColor: 'var(--sf-border)' }}
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold">{o.orderNumber}</p>
                  <p className="truncate" style={{ color: 'var(--sf-muted)' }}>
                    {o.itemsSummary}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--sf-muted)' }}>
                    {o.date} · {o.status}
                  </p>
                </div>
                <span className="font-black tabular-nums shrink-0">{money(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
