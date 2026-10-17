import React from 'react';
import type { InvoiceDocument } from '../../../types/invoices';
import { usePrefs } from '../../../i18n/PrefsContext';
import { X, History, Clock, User, ShieldCheck, Printer, Download, RefreshCw, Plus, Check } from 'lucide-react';

interface InvoiceAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: InvoiceDocument | null;
}

export const InvoiceAuditDrawer: React.FC<InvoiceAuditDrawerProps> = ({ isOpen, onClose, document }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  if (!isOpen || !document) return null;

  const actionIcons: Record<string, any> = {
    created: Plus,
    issued: ShieldCheck,
    edited: RefreshCw,
    printed: Printer,
    exported_pdf: Download,
    status_changed: Clock,
    payment_applied: Check,
    refund_issued: RefreshCw,
    credit_issued: RefreshCw,
    converted: ShieldCheck,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl text-slate-900 dark:text-white">
        {/* Drawer Header */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {isAr ? 'سجل العمليات والتدقيق' : 'Document Audit Trail'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{document.documentNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Trail List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'تتبع تاريخي غير قابل للتعديل لجميع عمليات الإنشاء والتعديل والطباعة والتصدير لهذا المستند.'
              : 'Immutable chronological audit log of all document creation, edits, exports, and status transitions.'}
          </div>

          <div className="relative ps-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:start-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {document.auditTrail.map((entry) => {
              const Icon = actionIcons[entry.action] || Clock;
              return (
                <div key={entry.id} className="relative group">
                  <div className="absolute -start-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{entry.action.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{entry.details}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/50">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{entry.actorName}</span>
                      </span>
                      <span className="font-mono">
                        {new Date(entry.timestamp).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
