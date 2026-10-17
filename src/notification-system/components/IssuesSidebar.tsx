import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  Settings,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem } from '../types/notification.types';
import { SEVERITY_COLOR_MAP } from '../config/colorMap';
import { formatRelativeTime } from '../utils/dateFilters';
import { usePrefs } from '../../i18n/PrefsContext';

interface IssuesSidebarProps {
  issues: NotificationItem[];
  onSelectIssue: (item: NotificationItem) => void;
  onViewAllIssues?: () => void;
  className?: string;
}

export const IssuesSidebar: React.FC<IssuesSidebarProps> = ({
  issues,
  onSelectIssue,
  onViewAllIssues,
  className = '',
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [mobileExpanded, setMobileExpanded] = useState(true);

  const getIssueIcon = (item: NotificationItem) => {
    const cat = item.category;
    if (cat.includes('Order')) return <ShoppingCart className="w-4 h-4" />;
    if (cat.includes('Payment')) return <CreditCard className="w-4 h-4" />;
    if (cat.includes('Product') || cat.includes('Inventory')) return <Package className="w-4 h-4" />;
    if (cat.includes('Shipping')) return <Truck className="w-4 h-4" />;
    if (cat.includes('Settings')) return <Settings className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div
      className={`u-panel p-5 rounded-2xl shadow-sm transition-all duration-200 ${className}`}
      data-zone="zone1-issues"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-base tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'تنبيهات تتطلب اهتمامك' : 'Issues Requiring Your Attention'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Red circular badge showing count */}
          {issues.length > 0 && (
            <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {issues.length}
            </span>
          )}

          {/* Mobile Accordion Toggle */}
          <button
            type="button"
            onClick={() => setMobileExpanded((v) => !v)}
            className="md:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-500"
            aria-label="Toggle issues"
          >
            {mobileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Body: Vertical list of notification items ── */}
      {mobileExpanded && (
        <>
          {issues.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'لا توجد تنبيهات عاجلة حالياً.' : 'All caught up! No operational issues detected.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pe-1 custom-scrollbar">
              {issues.map((item) => {
                const sevStyles = SEVERITY_COLOR_MAP[item.severity] || SEVERITY_COLOR_MAP.warning;
                const relativeTime = formatRelativeTime(item.timestamp, locale);
                const title = isAr ? item.titleAr || item.title : item.title;
                const desc = isAr ? item.descriptionAr || item.description : item.description;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectIssue(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectIssue(item);
                      }
                    }}
                    className="group relative p-3 rounded-xl border transition-all duration-150 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 active:scale-[0.99] select-none focus:outline-hidden focus:ring-2 focus:ring-teal-500/40"
                    style={{
                      background: item.read ? 'transparent' : 'color-mix(in srgb, var(--surface) 95%, var(--accent))',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar/Icon Circle (colored by severity) */}
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${sevStyles.avatarBg} ${sevStyles.avatarText}`}
                      >
                        {getIssueIcon(item)}
                      </span>

                      {/* Content block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <h4
                            className="font-bold text-sm truncate leading-snug tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors"
                            style={{ color: 'var(--text)' }}
                          >
                            {title}
                          </h4>
                          {/* Severity dot */}
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${sevStyles.dot}`}
                            title={item.severity}
                          />
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {desc}
                        </p>

                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectIssue(item);
                            }}
                            className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{isAr ? item.actionLabelAr || item.actionLabel : item.actionLabel}</span>
                            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                          </button>
                          <span>{relativeTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer: "View all issues" link (right-aligned, teal) ── */}
          <div className="pt-3.5 mt-3 border-t flex items-center justify-end" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onViewAllIssues}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors inline-flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>{isAr ? 'عرض جميع التنبيهات' : 'View all issues'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
