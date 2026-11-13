import React from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { AlertCircle, Ban } from 'lucide-react';

type Props = {
  /** Stable capability id for docs/gap matrix */
  capabilityId: 'services-points' | 'support' | 'payments-reconcile';
};

const COPY: Record<
  Props['capabilityId'],
  { titleEn: string; titleAr: string; bodyEn: string; bodyAr: string }
> = {
  'services-points': {
    titleEn: 'Services & Points',
    titleAr: 'الخدمات والنقاط',
    bodyEn:
      'Platform service point units are not in the current schema. Store customer loyalty points stay in the Merchant Dashboard. This screen stays deferred — no decorative controls.',
    bodyAr:
      'وحدات نقاط خدمات المنصة غير موجودة في المخطط الحالي. نقاط ولاء عملاء المتجر تبقى في لوحة التاجر. هذه الشاشة مؤجلة — لا عناصر تجميلية.',
  },
  support: {
    titleEn: 'Customer Service & Communication',
    titleAr: 'خدمة العملاء والتواصل',
    bodyEn:
      'Central tickets, complaints, surveys, and incidents are not connected yet. No fake ticket list. Use store messaging tools only when a real provider is connected.',
    bodyAr:
      'التذاكر والشكاوى والاستبيانات والحوادث المركزية غير مربوطة بعد. لا قائمة تذاكر وهمية. استخدم أدوات رسائل المتجر فقط عند وجود مزود حقيقي.',
  },
  'payments-reconcile': {
    titleEn: 'Financial Reconciliation',
    titleAr: 'المطابقة المالية',
    bodyEn:
      'No trusted payment gateway ledger is connected for platform reconciliation. Amounts are not estimated.',
    bodyAr:
      'لا يوجد دفتر موثوق لبوابة دفع لمطابقة المنصة. لا تُعرض مبالغ تقديرية.',
  },
};

/** SOUQ PLUS Phase 1 — honest deferred surface (zero mock). */
export const MasterCapabilityDeferred: React.FC<Props> = ({ capabilityId }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const copy = COPY[capabilityId];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? copy.titleAr : copy.titleEn}
        subtitle={
          isAr
            ? 'غير مدعوم حالياً · بانتظار الربط الحقيقي'
            : 'Not Supported yet · waiting for a real integration'
        }
        badge={
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--muted)',
              background: 'var(--surface)',
            }}
          >
            <Ban className="w-3.5 h-3.5" aria-hidden />
            {isAr ? 'مؤجل' : 'Deferred'}
          </span>
        }
      />
      <div
        className="mt-6 rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row gap-4 items-start"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        role="status"
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            color: 'var(--accent)',
          }}
        >
          <AlertCircle className="w-5 h-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {isAr ? 'لا سجلات · لا أزرار وهمية' : 'No records · no fake buttons'}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {isAr ? copy.bodyAr : copy.bodyEn}
          </p>
          <p className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
            id={capabilityId} · docs/32-souq-plus-phase1-gap-matrix.md
          </p>
        </div>
      </div>
    </AdminPageShell>
  );
};
