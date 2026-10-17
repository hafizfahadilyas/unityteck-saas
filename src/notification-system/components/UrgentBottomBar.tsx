import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Package,
  Truck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { NotificationItem } from '../types/notification.types';
import { usePrefs } from '../../i18n/PrefsContext';

interface UrgentBottomBarProps {
  urgentItems: NotificationItem[];
  onAction: (item: NotificationItem) => void;
  onDismiss: (id: string) => void;
  className?: string;
}

export const UrgentBottomBar: React.FC<UrgentBottomBarProps> = ({
  urgentItems,
  onAction,
  onDismiss,
  className = '',
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (urgentItems.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 340;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const getTagBadgeStyle = (tag?: string) => {
    switch (tag) {
      case 'Payment':
        return {
          pill: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white',
          iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
        };
      case 'Inventory':
        return {
          pill: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white',
          iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
        };
      case 'Shipping':
        return {
          pill: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
          btn: 'bg-blue-600 hover:bg-blue-700 text-white',
          iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
        };
      default:
        return {
          pill: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white',
          iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
        };
    }
  };

  const getUrgentIcon = (tag?: string) => {
    switch (tag) {
      case 'Payment':
        return <CreditCard className="w-4 h-4" />;
      case 'Inventory':
        return <Package className="w-4 h-4" />;
      case 'Shipping':
        return <Truck className="w-4 h-4" />;
      default:
        return <ShieldAlert className="w-4 h-4" />;
    }
  };

  return (
    <aside
      aria-label="Urgent Alerts"
      className={`fixed bottom-0 inset-x-0 z-50 transition-all duration-300 shadow-[0_-8px_25px_rgba(0,0,0,0.12)] border-t border-rose-200/90 dark:border-rose-900/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md ${className}`}
    >
      {/* ── Top Bar Control Strip: Collapse & Title ── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-rose-100 dark:border-rose-950/50 text-xs">
        <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <AlertCircle className="w-3.5 h-3.5" />
          <span>
            {isAr
              ? `إجراءات فورية عاجلة مطلوبة (${urgentItems.length})`
              : `Immediate Urgent Actions (${urgentItems.length})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll arrow buttons for desktop */}
          {!isCollapsed && urgentItems.length > 2 && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <>
                <span>{isAr ? 'توسيع' : 'Expand'}</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>{isAr ? 'تصغير' : 'Collapse'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Scrollable Horizontal Cards Strip ── */}
      {!isCollapsed && (
        <div
          ref={scrollContainerRef}
          className="p-3 flex items-center gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none custom-scrollbar"
        >
          {urgentItems.map((item) => {
            const styles = getTagBadgeStyle(item.urgentTag);
            const title = isAr ? item.titleAr || item.title : item.title;
            const desc = isAr ? item.descriptionAr || item.description : item.description;
            const actionText = isAr ? item.actionLabelAr || item.actionLabel : item.actionLabel;

            return (
              <div
                key={item.id}
                className="snap-start shrink-0 min-w-[300px] sm:min-w-[340px] max-w-[380px] p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-white dark:bg-slate-900 shadow-sm relative group hover:shadow-md transition-all duration-150"
              >
                {/* Dismiss X button in top right */}
                <button
                  type="button"
                  onClick={() => onDismiss(item.id)}
                  className="absolute top-2.5 end-2.5 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isAr ? 'إغلاق' : 'Dismiss'}
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-start gap-2.5 pe-5">
                  {/* Category icon (32x32) */}
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg}`}
                  >
                    {getUrgentIcon(item.urgentTag)}
                  </span>

                  {/* Content block */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${styles.pill}`}
                      >
                        {item.urgentTag || 'Urgent'}
                      </span>
                    </div>

                    <h5
                      className="text-xs font-bold truncate leading-tight tracking-tight"
                      style={{ color: 'var(--text)' }}
                      title={title}
                    >
                      {title}
                    </h5>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onAction(item)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1 ${styles.btn}`}
                  >
                    <span>{actionText}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
