import React from 'react';
import { Printer, X, ExternalLink } from 'lucide-react';
import type { Order, Store } from '../../../types';
import { GlobalModal } from '../../common/GlobalModal';
import { ShippingOrderDetailsSheet } from './ShippingOrderDetailsSheet';

export interface ShippingOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  store?: Partial<Store> | null;
  locale: 'en' | 'ar';
  labelUrl?: string | null;
}

export const ShippingOrderDetailsModal: React.FC<ShippingOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  store,
  locale,
  labelUrl,
}) => {
  if (!isOpen) return null;

  const isAr = locale === 'ar';
  const officialUrl = String(labelUrl || '').trim();

  const handlePrint = () => {
    window.print();
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'تفاصيل الطلب' : 'Order Details'}
      backdropClassName="print:p-0 print:bg-white print:static print:inset-auto"
      contentClassName="max-w-[900px]"
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #shipping-order-details-sheet,
          #shipping-order-details-sheet * {
            visibility: visible !important;
          }
          #shipping-order-details-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .shipping-order-details-modal-chrome {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full rounded-2xl overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl">
        <div
          className="shipping-order-details-modal-chrome flex items-center justify-between gap-3 px-4 py-3 text-white"
          style={{ background: 'var(--portal-cta)' }}
        >
          <h2 className="text-sm font-bold truncate">
            {isAr ? 'تفاصيل الطلب' : 'Order Details'}
            {order.orderNumber ? (
              <span className="ms-2 font-mono opacity-90">#{order.orderNumber}</span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[min(72dvh,780px)] overflow-y-auto p-3 sm:p-4 bg-slate-100/80 dark:bg-slate-950/40">
          <ShippingOrderDetailsSheet
            order={order}
            store={store}
            locale={locale}
            labelUrl={officialUrl || null}
          />
        </div>

        <div className="shipping-order-details-modal-chrome flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-t border-[color:var(--border)] bg-[color:var(--surface)]">
          {officialUrl ? (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[color:var(--border)] text-xs font-semibold text-[color:var(--text)] hover:bg-[color:var(--surface-2,transparent)] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>{isAr ? 'فتح البوليصة الرسمية' : 'Open official label'}</span>
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-[color:var(--border)] text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="unity-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'طباعة' : 'Print'}</span>
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

export default ShippingOrderDetailsModal;
