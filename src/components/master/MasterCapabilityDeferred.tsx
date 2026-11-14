import React from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { AlertCircle, Ban } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine } from './MasterUiKit';

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
      'Services & Points are live under the Phase 1 sidebar. Open that tab for real point units — this deferred surface is only a legacy redirect.',
    bodyAr:
      'الخدمات والنقاط متاحة في القائمة الرئيسية للمرحلة الأولى. افتح ذلك التبويب لوحدات النقاط الحقيقية — هذه الشاشة مؤجلة للتوافق فقط.',
  },
  support: {
    titleEn: 'Customer Service & Communication',
    titleAr: 'خدمة العملاء والتواصل',
    bodyEn:
      'Customer Service is live (tickets + CS CMS). Open the Support tab — this deferred surface is only a legacy redirect.',
    bodyAr:
      'خدمة العملاء متاحة (التذاكر وأقسام المحتوى). افتح تبويب الدعم — هذه الشاشة مؤجلة للتوافق فقط.',
  },
  'payments-reconcile': {
    titleEn: 'Financial Reconciliation',
    titleAr: 'المطابقة المالية',
    bodyEn:
      'No trusted payment gateway ledger is connected for platform reconciliation. Amounts are not estimated. Invoices UI unlocks only after a real gateway ledger is wired.',
    bodyAr:
      'لا يوجد دفتر موثوق لبوابة دفع لمطابقة المنصة. لا تُعرض مبالغ تقديرية. واجهة الفواتير تُفعَّل فقط بعد ربط دفتر بوابة حقيقي.',
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
      <MasterLuxePanel className="mt-6 flex flex-col sm:flex-row gap-4 items-start" padding="lg">
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
          <MasterMetaLine>
            id={capabilityId} · docs/32-souq-plus-phase1-gap-matrix.md
          </MasterMetaLine>
        </div>
      </MasterLuxePanel>
    </AdminPageShell>
  );
};
